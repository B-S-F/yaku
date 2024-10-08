import logging
from ipaddress import ip_address
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urlparse

from pydantic import BaseSettings, Field, validator
from requests import Response, Session
from requests.exceptions import HTTPError, InvalidURL, JSONDecodeError
from requests_ntlm import HttpNtlmAuth


class Settings(BaseSettings):
    sharepoint_project_site: str = Field(..., env="SHAREPOINT_PROJECT_SITE")
    username: str = Field(..., env="SHAREPOINT_USERNAME")
    password: str = Field(..., env="SHAREPOINT_PASSWORD")
    force_ip: Optional[str] = Field(None, env="SHAREPOINT_FORCE_IP")

    @validator("sharepoint_project_site", always=True)
    def validate_sharepoint_project_site(cls, v):
        parsed_url = urlparse(v)
        if not all([parsed_url.scheme, parsed_url.netloc]):
            raise InvalidURL("Invalid sharepoint site url")
        return v

    @validator("force_ip", always=True)
    def validate_force_ip(cls, v):
        if not v:
            return v
        ip_address(v)
        return v


class SharepointClient:
    """
    Establish link with a sharepoint site to upload folders and files.

    This class provides functionality to upload files and folders on a SharePoint site.
    """

    def __init__(self, config: Settings):
        self._logger = logging.getLogger()
        self._logger.debug("Initializing sharepoint connection with %s", config)
        if config.sharepoint_project_site.endswith("/"):
            config.sharepoint_project_site = config.sharepoint_project_site[:-1]
        self._sharepoint_site = config.sharepoint_project_site
        session = Session()
        session.headers = {"Accept": "application/json;odata=verbose"}
        self._force_ip = config.force_ip
        session.auth = HttpNtlmAuth(config.username, config.password)
        session.verify = False
        self._session = session

    def _exchange_hostname_by_forced_ip_address(self, url: str) -> Tuple[str, str]:
        """
        Replace the hostname by the IP address.

        Returns the new URL and the extracted hostname.
        """
        parts = urlparse(url)
        host = parts.netloc
        assert self._force_ip is not None
        url = parts._replace(netloc=self._force_ip).geturl()
        return url, host

    def _post(self, url, headers=None, data=None) -> Response:
        custom_headers = {}
        custom_headers.update(headers)
        if self._force_ip:
            url, host = self._exchange_hostname_by_forced_ip_address(url)
            custom_headers["Host"] = host
        return self._session.post(
            url, headers=custom_headers, data=data, verify=self._session.verify
        )

    def _get_form_digest_value(self) -> str:
        response = self._post(
            f"{self._sharepoint_site}/_api/contextinfo",
            headers={"Accept": "application/json;odata=verbose"},
        )
        if response.status_code != 200:
            raise HTTPError(
                f"Sharepoint server response status code was {response.status_code}",
                response=response,
            )
        try:
            return response.json()["d"]["GetContextWebInformation"]["FormDigestValue"]  # type: ignore
        except JSONDecodeError:
            raise HTTPError(
                "Sharepoint server response did not contain proper JSON. Received data starts with:\n"
                + response.text[:200]
                + "...",
                response=response,
            )
        except KeyError:
            raise HTTPError(
                "Sharepoint server response did not contain form digest value",
                response=response,
            )

    def _get_sharepoint_path_url(self, sharepoint_path: str) -> str:
        """
        Get the server relative url of a sharepoint path.

        Args:
            sharepoint_path: Path on SharePoint.

        Returns:
            Server relative url.
        """
        if sharepoint_path.startswith("/"):
            sharepoint_path = sharepoint_path[1:]
        sharepoint_path = sharepoint_path.replace("//", "/")
        return f"{self._sharepoint_site}/_api/web/GetFolderByServerRelativeUrl('{sharepoint_path}')"

    def _extract_sharepoint_error(self, response: Response) -> str:
        try:
            return response.json()["error"]["message"]["value"]  # type: ignore
        except KeyError:
            return response.text

    def _get_sharepoint_error_message(self, response: Response) -> str:
        error_string = f"{response.status_code} {self._extract_sharepoint_error(response)}"
        if response.status_code == 401:
            error_string += "\nPlease check if your credentials are correct."
        if response.status_code == 403:
            error_string += "\nPlease check if you have write permissions."
        if response.status_code == 404:
            error_string += (
                "\nPlease check if the sharepoint path exists and you have write permissions."
            )
        if str(response.status_code).startswith("5"):
            error_string += "\nPlease check if your sharepoint server is reachable."
        return error_string

    def upload_file(self, file_path: Path, sharepoint_path: str, force: bool = False) -> None:
        """
        Upload a file to SharePoint.

        Args:
            file_path: Path to the file to upload.
            sharepoint_path: Path to the destination folder on SharePoint.
            force: Overwrite existing file.
        """
        if not file_path.is_file():
            raise FileNotFoundError(f"File {file_path} does not exist")
        destination_url = f"{self._get_sharepoint_path_url(sharepoint_path)}/Files/add(url='{file_path.name}',overwrite={str(force).lower()})"
        self._logger.debug("Uploading file %s to %s", file_path, destination_url)
        content = file_path.read_bytes()
        headers = {
            "Accept": "application/json;odata=verbose",
            "X-RequestDigest": self._get_form_digest_value(),
            "Content-Length": str(len(content)),
        }
        self._logger.debug("Headers: %s", headers)
        response = self._post(destination_url, headers=headers, data=content)
        self._logger.debug("Response: %s", response)
        if response.status_code != 200:
            raise HTTPError(
                f"Uploading file {file_path} to {self._get_sharepoint_path_url(sharepoint_path)} failed with {self._get_sharepoint_error_message(response)}",
                response=response,
            )

    def upload_directory(
        self, directory_path: Path, sharepoint_path: str, force: bool = False
    ) -> None:
        """
        Upload a folder to SharePoint.

        Args:
            directory_path: Path to the folder to upload.
            sharepoint_path: Path to the destination folder on SharePoint.
            force: Overwrite existing files.
        """
        if not directory_path.is_dir():
            raise FileNotFoundError(f"Folder {directory_path} does not exist")
        destination_url = f"{self._sharepoint_site}/_api/web/folders"
        self._logger.debug("Uploading file %s to %s", directory_path, destination_url)
        content = f"{{'__metadata': {{'type': 'SP.Folder'}},'ServerRelativeUrl': '{sharepoint_path}/{directory_path.name}'}}"
        self._logger.debug("Content: %s", content)
        headers = {
            "Accept": "application/json;odata=verbose",
            "X-RequestDigest": self._get_form_digest_value(),
            "Content-Type": "application/json;odata=verbose",
        }
        self._logger.debug("Headers: %s", headers)
        response = self._post(destination_url, headers=headers, data=content)
        self._logger.debug("Response: %s", response)
        if response.status_code != 201:
            raise HTTPError(
                f"Creating folder {directory_path} at {destination_url} failed with {self._get_sharepoint_error_message(response)}",
                response=response,
            )
        for file in directory_path.iterdir():
            if file.is_file():
                self._logger.info("Uploading file %s", file)
                self.upload_file(file, f"{sharepoint_path}/{directory_path.name}", force)
            else:
                self._logger.info("Uploading folder %s", file)
                self.upload_directory(file, f"{sharepoint_path}/{directory_path.name}", force)

    def delete_folder(self, sharepoint_path):
        """
        Delete a folder on SharePoint.

        Args:
            sharepoint_path: Path to the folder to delete.
        """
        destination_url = f"{self._get_sharepoint_path_url(sharepoint_path)}"
        self._logger.debug(
            "Deleting folder %s at %s",
            sharepoint_path,
            destination_url,
        )

        headers = {
            "Accept": "application/json;odata=verbose",
            "X-RequestDigest": self._get_form_digest_value(),
            "IF-MATCH": "*",
            "X-HTTP-Method": "DELETE",
        }

        response = self._post(destination_url, headers=headers)
        self._logger.debug("Response: %s", response)
        if response.status_code != 200:
            raise HTTPError(
                f"Deleting folder {sharepoint_path} failed with error: {self._extract_sharepoint_error(response)}",
                response=response,
            )
