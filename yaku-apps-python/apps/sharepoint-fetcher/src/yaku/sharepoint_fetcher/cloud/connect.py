from typing import Any, Dict, List, Tuple
from urllib.parse import quote, urlparse

import requests
from requests.exceptions import HTTPError
from yaku.autopilot_utils.errors import (
    AutopilotConfigurationError,
    AutopilotError,
    AutopilotFileNotFoundError,
)

RESOURCE = "https://graph.microsoft.com/"
GRANT_TYPE = "client_credentials"
SCOPE = "Sites.Selected"


class Connect:
    """
    Establish link with a cloud SharePoint site and get folders and files.

    This class provides means to access files and folders on a SharePoint site,
    e.g. under a URL like `https://my.sharepoint.com/sites/035029/`.

    It also provides access to metadata/properties.

    Files and folders are always given as relative URLs. The URL must include
    the site prefix, e.g. `/sites/012345/Shared Documents/myFolder/myFile.txt`.

    Provide functionality for both default root SharePoint documents at "Shared Documents"
    and also custom document libraries.
    """

    def __init__(self, sharepoint_site, tenant_id, client_id, client_secret, force_ip=None):
        if sharepoint_site.endswith("/"):
            sharepoint_site = sharepoint_site[:-1]
        self._sharepoint_site = sharepoint_site

        session = requests.Session()
        self._force_ip = force_ip
        session.headers = self.sharepoint_cloud_instance_connect(
            client_id, tenant_id, client_secret
        )
        session.verify = True
        session.auth = None
        self._session = session

    def sharepoint_cloud_instance_connect(self, client_id, tenant_id, client_secret):
        """
        Get the header needed for authentication and authorization for all the Microsoft Graph API calls.

        It requires the credential for the App Registration in Azure ( the client id,
        the tenant id and the client secret ).
        """
        try:
            token_api = f"https://login.microsoftonline.com/{tenant_id}/oauth2/token"
            payload = f"grant_type={GRANT_TYPE}&client_id={client_id}&client_secret={client_secret}&resource={RESOURCE}"
            access_token_request = requests.request(
                "POST", token_api, data=payload, verify=True
            ).json()
            access_token = access_token_request["access_token"]

            headers = {
                "Authorization": f"Bearer {access_token}",
            }
            return headers

        except HTTPError as http_err:
            print(f"HTTP error occured: {http_err}")
        except Exception as err:
            print(f"Erorr occured: {err}")

    def _exchange_url_by_domain_and_site_name(self, sharepoint_site: str) -> Tuple[str, str]:
        """
        Replace the url by the host and site name.

        Returns the hostname and the extracted site name.
        """
        parsed_url = urlparse(sharepoint_site)
        host = parsed_url.netloc
        path_parts = parsed_url.path.strip("/").split("/")
        site_name = path_parts[-1]
        return host, site_name

    def get_site_id(self, headers):
        """
        Get the site id for a given sharepoint site.

        It requires an authorized header. For more information,
        check the official Microsoft Graph Api Documentation.
        """
        host, site_name = self._exchange_url_by_domain_and_site_name(self._sharepoint_site)
        response = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{host}:/sites/{site_name}",
            headers=headers,
        ).json()
        response_id = response["id"].split(",")
        site_id = response_id[1]
        return site_id

    def get_drive_id(self, headers, library_name):
        """
        Get the drive id for a given document library.

        For more information about document libraries on
        SharePoint, check the official Microsoft Graph Api Documentation.
        """
        site_id = self.get_site_id(self._session.headers)
        url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives"
        response = requests.get(url, headers=headers)
        drive_id = None
        if response.status_code == 200:
            drives = response.json().get("value", [])
            for drive in drives:
                if drive.get("name") == library_name:
                    drive_id = drive.get("id")
                    break
                else:
                    raise AutopilotFileNotFoundError(
                        f"SharePoint document library {library_name} does not exist"
                    )
        return drive_id

    def _exchange_hostname_by_forced_ip_address(self, url: str) -> Tuple[str, str]:
        """
        Replace the hostname by the IP address.

        Returns the new URL and the extracted hostname.
        """
        parts = urlparse(url)
        host = parts.netloc
        url = parts._replace(netloc=self._force_ip).geturl()
        return url, host

    def check_folder_access_and_presence(
        self, path: str, library_name: str | None, original_path: str
    ):
        """
        Check if the user has access to the given file/folder.

        Throws an error if something goes wrong.
        """
        site_id = self.get_site_id(self._session.headers)
        encoded_path = quote(path)
        if library_name is None:
            api = (
                f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{encoded_path}"
            )
        else:
            drive_id = self.get_drive_id(self._session.headers, library_name)
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root:/{encoded_path}"

        response = requests.request("GET", api, headers=self._session.headers, verify=True)
        if response.status_code == 200:
            data = response.json()
            if not data.get("name"):
                return True
        elif response.status_code == 401:
            raise AutopilotConfigurationError(
                f"The passed credentials are not authorized to access URL {api}"
            )
        elif response.status_code == 403:
            raise AutopilotConfigurationError(
                f"The configured user does not have access to the requested URL {api}"
            )
        elif response.status_code == 404:
            return True
        elif response.status_code == 500:
            raise AutopilotError(
                f"Internal server error while accessing {api}!"
                + "One reason could be that your PROJECT_PATH "
                + "does not start with 'Shared Documents/' (or similar). Please check "
                + "your settings!\n\nThe server's response was: "
                + response.text
            )

        response.raise_for_status()
        if path != original_path:
            raise AutopilotError(
                f"The directory {path} exists and can be accessed, but {original_path} "
                + "leads to a non-existing directory! One reason could be that the directory does not exist "
                + "or you do not have permissions to access that directory path!"
            )

    def get_folder_id(self, folder, library_name):
        """
        Get the folder id for a given SharePoint folder.

        It requires an authorized header and the site id.
        """
        site_id = self.get_site_id(self._session.headers)
        if library_name is None:
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{folder}"
        else:
            drive_id = self.get_drive_id(self._session.headers, library_name)
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root:/{folder}"

        response = requests.request(
            "GET", api, headers=self._session.headers, verify=True
        ).json()
        id = response["id"]
        return id

    def get_folders(self, relative_url, library_name) -> List[str]:
        """
        Get JSON structure of subfolders of given folder.

        It requires the site id and the folder id for a given SharePoint
        relative url.

        For info on `relative_url`, see class docs.
        """
        site_id = self.get_site_id(self._session.headers)
        folder_id = self.get_folder_id(relative_url, library_name)
        if library_name is None:
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/items/{folder_id}/children?$filter=folder ne null"
        else:
            drive_id = self.get_drive_id(self._session.headers, library_name)
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/items/{folder_id}/children?$filter=folder ne null"

        response = requests.request(
            "GET", api, headers=self._session.headers, verify=True
        ).json()
        subfolders = []
        subfolders_path = []
        for subfolder in response["value"]:
            subfolder_name = subfolder["name"]
            subfolder_path = f"{relative_url}/{subfolder_name}"
            subfolders_path.append(subfolder_path)
            subfolders.append(subfolder_name)
        return subfolders_path

    def get_folders_root(self, library_name) -> List[str]:
        """
        Get JSON structure of subfolders for the root.

        The root level of a cloud SharePoint site
        is "Shared Documents".
        """
        site_id = self.get_site_id(self._session.headers)
        if library_name is None:
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root/children?$filter=folder ne null"
        else:
            drive_id = self.get_drive_id(self._session.headers, library_name)
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root/children?$filter=folder ne null"

        response = requests.request(
            "GET", api, headers=self._session.headers, verify=True
        ).json()
        subfolders_path = []
        for subfolder in response["value"]:
            subfolder_name = subfolder["name"]
            subfolders_path.append(subfolder_name)
        return subfolders_path

    def get_files(self, relative_url, library_name) -> List[str]:
        """
        Get JSON structure of files in the given folder.

        For info on `relative_url`, see class docs.
        """
        site_id = self.get_site_id(self._session.headers)
        folder_id = self.get_folder_id(relative_url, library_name)
        if library_name is None:
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/items/{folder_id}/children"
        else:
            drive_id = self.get_drive_id(self._session.headers, library_name)
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/items/{folder_id}/children"

        response = requests.request(
            "GET", api, headers=self._session.headers, verify=True
        ).json()

        files = []
        for file in response["value"]:
            if file.get("file"):
                file_name = file["name"]
                files.append(file_name)

        return files

    def get_files_root(self, library_name) -> List[str]:
        """
        Get JSON structure of files in the root folder.

        The root folder is "Shared Documents" for the default document.
        """
        site_id = self.get_site_id(self._session.headers)
        if library_name is None or library_name == "Shared Documents":
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root/children"
        else:
            drive_id = self.get_drive_id(self._session.headers, library_name)
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root/children"

        response = requests.request(
            "GET", api, headers=self._session.headers, verify=True
        ).json()

        files = []
        for file in response["value"]:
            if file.get("file"):
                file_name = file["name"]
                files.append(file_name)

        return files

    def get_file_object(self, relative_url: str, file_name: str, library_name) -> bytes:
        """
        Get file from given relative path and under the given file name.

        For info on `relative_url`, see class docs.
        """
        encoded_file_name = quote(file_name)
        site_id = self.get_site_id(self._session.headers)
        if library_name is None:
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{relative_url}/{encoded_file_name}?$expand=listItem"
        else:
            drive_id = self.get_drive_id(self._session.headers, library_name)
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root:/{relative_url}/{encoded_file_name}?$expand=listItem"

        response = requests.request("GET", api, headers=self._session.headers, verify=True)
        response.raise_for_status()
        download_url = response.json()["@microsoft.graph.downloadUrl"]
        actual_size = response.json()["size"]
        download_file = requests.get(download_url)
        download_file_size = len(download_file.content)
        if actual_size != download_file_size:
            raise AutopilotError(
                f"The downloaded file does not have the proper size: expected {actual_size} bytes, got {download_file_size} bytes! One reason could be "
                + "that you are behind a proxy/restricted firewall!"
            )
        return download_file.content

    def get_file_properties(
        self, relative_url: str, file_name: str, library_name
    ) -> Dict[str, Any]:
        """
        Get properties for file given by relative path and file name.

        The properties are returned as JSON structure.

        For info on `relative_url`, see class docs.
        """
        encoded_file_name = quote(file_name)
        site_id = self.get_site_id(self._session.headers)
        if library_name is None:
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{relative_url}/{encoded_file_name}?$expand=listItem"
        else:
            drive_id = self.get_drive_id(self._session.headers, library_name)
            api = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root:/{relative_url}/{encoded_file_name}?$expand=listItem"

        response = requests.request("GET", api, headers=self._session.headers, verify=True)
        response.raise_for_status()
        json_response = response.json()
        return json_response  # type: ignore
