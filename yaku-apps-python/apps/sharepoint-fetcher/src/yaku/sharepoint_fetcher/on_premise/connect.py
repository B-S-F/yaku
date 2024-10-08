from typing import Any, Dict, List, Tuple
from urllib.parse import quote, urlparse

import requests
from loguru import logger
from requests_ntlm import HttpNtlmAuth
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError


class Connect:
    """
    Establish link with an on-premise SharePoint site and get folders and files.

    This class provides means to access files and folders on a SharePoint site,
    e.g. under a URL like `https://sites.company.com/sites/035029/`.

    It also provides access to metadata/properties.

    Files and folders are always given as relative URLs. The URL must include
    the site prefix, e.g. `/sites/012345/Documents/myFolder/myFile.txt`.
    """

    def __init__(self, sharepoint_site, username, password, force_ip=None):
        if sharepoint_site.endswith("/"):
            sharepoint_site = sharepoint_site[:-1]
        self._sharepoint_site = sharepoint_site

        session = requests.Session()
        session.headers = {"Accept": "application/json;odata=verbose"}
        self._force_ip = force_ip
        session.auth = HttpNtlmAuth(username, password)
        session.verify = False
        self._session = session

    def _exchange_hostname_by_forced_ip_address(self, url: str) -> Tuple[str, str]:
        """
        Replace the hostname by the IP address.

        Returns the new URL and the extracted hostname.
        """
        parts = urlparse(url)
        host = parts.netloc
        url = parts._replace(netloc=self._force_ip).geturl()
        return url, host

    def _get(self, url: str) -> requests.Response:
        assert url.count("//") == 1, f"Duplicate slashes detected: {url}"
        headers = {}
        if self._force_ip:
            url, host = self._exchange_hostname_by_forced_ip_address(url)
            headers["Host"] = host
        logger.debug("GET {url}", url=url)
        return self._session.get(url, verify=False, headers=headers)

    def _get_paginated_results(self, url: str) -> List[Dict[str, Any]]:
        results = []
        response = self._get(url)
        response.raise_for_status()
        json_response = response.json()
        results.extend(json_response["d"]["results"])
        while "__next" in json_response["d"]:
            url = json_response["d"]["__next"]
            response = self._get(url)
            response.raise_for_status()
            json_response = response.json()
            results.extend(json_response["d"]["results"])
        return results

    def check_folder_access_and_presence(self, relative_url: str, original_url: str):
        """
        Check if the user has access to the given file/folder.

        Throws an error if something goes wrong.

        For info on `relative_url`, see class docs.
        """
        url = (
            self._sharepoint_site + f"/_api/web/GetFolderByServerRelativeUrl('{relative_url}')"
        )
        response = self._get(url)
        # TODO: Figure out if we want to explicitly not raise exceptions here
        if response.status_code == 401:
            raise AutopilotConfigurationError(
                f"The passed credentials are not authorized to access URL {url}"
            )
        elif response.status_code == 403:
            raise AutopilotConfigurationError(
                f"The configured user does not have access to the requested URL {url}"
            )
        elif response.status_code == 500:
            return True

        response.raise_for_status()  # catch all other HTTP errors

        try:
            if len(response.json()["d"]) == 1:
                return True
        except requests.exceptions.JSONDecodeError as e:
            raise RuntimeError(response.text) from e

        if relative_url != original_url:
            raise AutopilotError(
                f"The directory {relative_url} exists and can be accessed, but {original_url} "
                + "leads to a non-existing directory! One reason could be that the directory does not exist "
                + "or you do not have permissions to access that directory path!"
            )

    def get_folders(self, relative_url) -> List[Dict[str, Any]]:
        """
        Get JSON structure of subfolders of given folder.

        For info on `relative_url`, see class docs.
        """
        url = (
            self._sharepoint_site
            + f"/_api/web/GetFolderByServerRelativeUrl('{relative_url}')/folders"
        )
        response = self._get_paginated_results(url)
        return response

    def get_files(self, relative_url) -> List[Dict[str, Any]]:
        """
        Get JSON structure of files in the given folder.

        For info on `relative_url`, see class docs.
        """
        url = (
            self._sharepoint_site
            + f"/_api/web/GetFolderByServerRelativeUrl('{relative_url}')/files"
        )
        response = self._get_paginated_results(url)
        return response

    def get_file_object(self, relative_url: str, file_name: str) -> bytes:
        """
        Get file from given relative path and under the given file name.

        For info on `relative_url`, see class docs.
        """
        encoded_file_name = quote(file_name)
        url = (
            self._sharepoint_site
            + f"/_api/web/GetFileByServerRelativePath(decodedurl='{relative_url}/{encoded_file_name}')/$value"
        )
        response = self._get(url)
        response.raise_for_status()
        additional_file_properties = self._get_additional_file_properties(
            relative_url, file_name
        )
        actual_size = self._get_file_size_from_properties(additional_file_properties)
        file_size = len(response.content)
        if actual_size != file_size:
            raise AutopilotError(
                f"The downloaded file does not have the proper size: expected {actual_size} bytes, got {file_size} bytes! One reason could be "
                + "that you are behind a proxy/restricted firewall!"
            )
        return response.content

    def _get_file_size_from_properties(self, properties):
        return properties["vti_x005f_filesize"]

    def _get_additional_file_properties(self, relative_url: str, file_name: str):
        """
        Get additional properties for file given by relative path and file name.

        The properties are returned as JSON structure.

        For info on `relative_url`, see class docs.
        """
        encoded_file_name = quote(file_name)
        url = (
            self._sharepoint_site
            + f"/_api/web/GetFileByServerRelativePath(decodedurl='{relative_url}/{encoded_file_name}')/Properties"
        )
        response = self._get(url)
        response.raise_for_status()
        json_response = response.json()
        return json_response["d"]

    def get_file_properties(self, relative_url: str, file_name: str) -> Dict[str, Any]:
        """
        Get properties for file given by relative path and file name.

        The properties are returned as JSON structure.

        For info on `relative_url`, see class docs.
        """
        encoded_file_name = quote(file_name)
        url = (
            self._sharepoint_site
            + f"/_api/web/GetFileByServerRelativePath(decodedurl='{relative_url}/{encoded_file_name}')/ListItemAllFields"
        )
        response = self._get(url)
        response.raise_for_status()
        json_response = response.json()
        return json_response["d"]  # type: ignore

    def verify_site_lists(self, titles: List[str], must_have_items=False) -> List[str]:
        """
        Get and verify SharePoint lists given by their `titles`.

        A list usually contains enum values, e.g. a mapping from a status id to its status title.

        Result can be filtered to include only lists which have items, like a status mapping,
        by setting `must_have_items=True`.
        """
        url = self._sharepoint_site + "/_api/web/Lists"
        json_response = self._get_paginated_results(url)

        return [
            sp_list["Title"]
            for sp_list in json_response
            if (not must_have_items or sp_list["ItemCount"] > 0)
            and (sp_list["Title"] in titles)
        ]

    def get_items_for_list(
        self, list_title: str, list_item_title_property: str
    ) -> Dict[int, str]:
        """
        Get items for a list.

        This is needed if you want to get all possible property values
        for a given file property. They are stored in a list so that
        the file only has a (numeric) id for that property and the
        site's list contains the mapping from id to title.

        Unfortunately, there is no clear rule for getting the proper value
        for a list item, so if you are looking for the list 'Foo Status', the
        list items might store their title in an property 'FooStatus', or 'Foo Status',
        or even something different.

        For this reason, you need to provide not only the `list_title`, but also
        the property name of the list's item in which the item's title is stored
        by providing `list_item_title_property`.
        """
        url = self._sharepoint_site + f"/_api/web/Lists/GetByTitle('{list_title}')/items"
        json_response = self._get_paginated_results(url)
        return {int(item["Id"]): item[list_item_title_property] for item in json_response}
