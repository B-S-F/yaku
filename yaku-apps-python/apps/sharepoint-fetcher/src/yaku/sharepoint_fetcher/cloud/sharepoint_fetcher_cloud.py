import itertools
import json
import os
from fnmatch import fnmatch
from pathlib import Path
from typing import Dict, List, Optional

from loguru import logger
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.sharepoint_fetcher.sharepoint_fetcher import SharepointFetcher

from ..selectors import FilesSelectors
from .connect import Connect


class SharepointFetcherCloud(SharepointFetcher):
    """
    Fetch files from a cloud SharePoint directory.

    Given a `sharepoint_site` URL and a `sharepoint_dir` path, you can
    download files and folders recursively into `destination_path`.

    The sharepoint site URL must be given as full URL including the site path part,
    e.g. `https://my.sharepoint.com/sites/123456/`.

    The sharepoint directory is given as file system path, e.g. `Shared Documents/SubfolderA/`.

    The destination path is a Python `Path` object to a local directory into
    which the downloaded files and directories are put.

    It is also possible to download only the property files and no file contents.
    This can be enabled by providing `download_properties_only=True`.
    """

    metadata_file_suffix = ".__properties__.json"

    def __init__(
        self,
        sharepoint_dir: Optional[str],
        destination_path: Path,
        sharepoint_site: Optional[str],
        tenant_id: Optional[str],
        client_id: Optional[str],
        client_secret: Optional[str],
        *,
        force_ip: Optional[str] = None,
        list_title_property_map: Optional[Dict[str, str]] = None,
        download_properties_only: Optional[bool] = False,
        filter_config: Optional[List[FilesSelectors]] = None,
    ):
        super().__init__(
            sharepoint_dir,
            destination_path,
            sharepoint_site,
            download_properties_only,
            list_title_property_map,
            filter_config,
        )

        if tenant_id is None:
            raise AutopilotConfigurationError(
                "Missing value for Tenant ID! You can provide the Tenant ID either as environment"
                + "variable SHAREPOINT_FETCHER_TENANT_ID or as command line argument --tenant-id."
            )

        if client_id is None:
            raise AutopilotConfigurationError(
                "Missing value for Client ID! You can provide the Client ID either as environment"
                + "variable SHAREPOINT_FETCHER_CLIENT_ID or as command line argument --client-id."
            )

        if client_secret is None:
            raise AutopilotConfigurationError(
                "Missing value for Client Secret! You can provide the Client Secret either as environment"
                + "variable SHAREPOINT_FETCHER_CLIENT_SECRET or as command line argument --client-secret."
            )
        self._connect = Connect(
            self._sharepoint_site, tenant_id, client_id, client_secret, force_ip
        )

    def download_file(self, remote_path: str, file_name: str):
        """
        Download a single file from the SharePoint site.

        The `remote_path` must not contain the site prefix.
        """
        output_path = self._destination_path

        os.makedirs(output_path, exist_ok=True)
        self._download_file(
            output_path, self._relative_url_prefix + "/" + remote_path, file_name
        )

    def download_folder(self, remote_path=None):
        """
        Iterate through all the folders present and download files recursively.

        The `remote_path` must not contain the site prefix.
        """
        if remote_path is None:
            remote_path = self._relative_url_prefix + "/" + self._sharepoint_dir

        assert remote_path.endswith("/"), f"{remote_path} should end with a /, but doesn't!"

        output_path = self._destination_path.joinpath(
            self._remove_sharepoint_dir_prefix(self._remove_url_prefix(remote_path))
        )
        os.makedirs(output_path, exist_ok=True)
        if remote_path.startswith("/sites/") or "Shared Documents" in remote_path:
            folder_path = self.get_path(remote_path)
        else:
            folder_path = remote_path
        subfolders_path = self._fetch_subfolders(folder_path)
        if subfolders_path == []:
            pass
        else:
            for subfolder_path in subfolders_path:
                self.download_folder(subfolder_path + "/")
        short_remote_path = self._remove_sharepoint_dir_prefix(
            self._remove_url_prefix(remote_path)
        )
        if self._folder_filters and not any(
            [fnmatch(short_remote_path, filter) for filter in self._folder_filters]
        ):
            return
        files = self._fetch_files(remote_path)

        files_selectors = self._get_files_selectors_for_file_path(short_remote_path)
        downloaded_files_per_selector: List[List[str]] = [[] for _ in files_selectors]
        for file in files:
            matching_files_selector_index = None
            if files_selectors:
                for index, files_selector in enumerate(files_selectors):
                    if fnmatch(short_remote_path + file, files_selector.filter):
                        matching_files_selector_index = index
                        break
                else:
                    continue

            did_download_file = self._download_file(
                output_path, remote_path, file, files_selectors=files_selectors
            )

            if did_download_file and matching_files_selector_index is not None:
                downloaded_files_per_selector[matching_files_selector_index].append(file)

        if files_selectors and not all(downloaded_files_per_selector):
            selectors_with_no_files = itertools.compress(
                files_selectors, [not f for f in downloaded_files_per_selector]
            )
            logger.info(
                "Some file filters for `{}` didn't match any file! Those filters were: {}",
                short_remote_path if short_remote_path else "<root path>",
                ", ".join([str(f) for f in selectors_with_no_files]),
            )

    def download_custom_property_definitions(self):
        pass

    def _download_file(
        self,
        output_path: Path,
        remote_path: str,
        file_name: str,
        *,
        files_selectors: Optional[List[FilesSelectors]] = None,
    ):
        """
        Download a file from SharePoint.

        The file given by `{remote_path}/{file_name}` is stored under
        `{output_path}/{file_name}`.
        """
        if remote_path.endswith("/"):
            remote_path = remote_path[:-1]

        if remote_path.startswith("/sites") or "Shared Documents" in remote_path:
            path = self.get_path(remote_path)
        else:
            path = remote_path
        if "Shared Documents" in self._sharepoint_dir:
            file_properties = self._connect.get_file_properties(path, file_name, None)
        else:
            library_name = self._sharepoint_dir.split("/")[0]
            file_properties = self._connect.get_file_properties(path, file_name, library_name)

        self.save_file(
            output_path,
            file_name + self.metadata_file_suffix,
            json.dumps(file_properties, indent=2),
            False,
        )

        if not self._download_properties_only:
            if "Shared Documents" in self._sharepoint_dir:
                file_contents = self._connect.get_file_object(path, file_name, None)
            else:
                file_contents = self._connect.get_file_object(path, file_name, library_name)
            self.save_file(output_path, file_name, file_contents, False)
        return True

    def _fetch_subfolders(self, remote_path: str) -> List[str]:
        """
        Fetch list of all subfolders of a given path.

        Fetches list of relative paths of all remote folders present inside the
        folder given by `remote_path`.
        For example: if called with `/sites/123456/Documents/Some/Path/` it
        might return a list with entries like
        `/sites/123456/Documents/Some/Path/WithSubFolder`.
        """
        if remote_path == "":
            if "Shared Documents" in self._sharepoint_dir:
                folders_path = self._connect.get_folders_root(None)
            else:
                library_name = self._sharepoint_dir.split("/")[0]
                folders_path = self._connect.get_folders_root(library_name)
        elif "Shared Documents" in self._sharepoint_dir:
            folders_path = self._connect.get_folders(remote_path, None)
        else:
            library_name = self._sharepoint_dir.split("/")[0]
            folders_path = self._connect.get_folders(remote_path, library_name)
        return folders_path

    def _fetch_files(self, remote_path: str) -> List[str]:
        """
        Fetch list of file names.

        Fetches list of names of all files present inside the folder passed
        through parameter.
        """
        if remote_path.startswith("/sites") or "Shared Documents" in remote_path:
            remote_path = self.get_path(remote_path)
        url_parts = remote_path.split("/")
        if len(url_parts) == 1:
            if remote_path == "Shared Documents":
                result = self._connect.get_files_root(None)
            else:
                library_name = self._sharepoint_dir.split("/")[0]
                result = self._connect.get_files_root(library_name)
        elif "Shared Documents" in self._sharepoint_dir:
            result = self._connect.get_files(remote_path, None)
        else:
            library_name = self._sharepoint_dir.split("/")[0]
            result = self._connect.get_files(remote_path, library_name)
        return result

    def get_path(self, path):
        url_parts = path.split("/")
        if "/sites/" in path:
            if len(url_parts) >= 4:
                result_path = "/".join(url_parts[4:])
            else:
                result_path = ""
        else:
            if len(url_parts) > 1:
                result_path = "/".join(url_parts[1:])
            else:
                result_path = ""
        return result_path

    def get_directory_length(self, relative_url: str):
        url_parts = relative_url.split("/")
        non_empty_parts = [part for part in url_parts if part]
        length = len(non_empty_parts)
        return length

    def get_directory_parent(self, relative_url: str):
        url_parts = relative_url.rstrip("/").split("/")
        parent_url = "/".join(url_parts[:-1]) + "/"
        return parent_url

    def check_dir_access(self, file_name):
        elements = self._sharepoint_dir.split("/")
        elements = [element for element in elements if element]
        if (
            len(elements) == 1 and file_name is None
        ):  # The root always exists for a SharePoint site by default
            return
        else:
            path = self.get_path(self._sharepoint_dir)
        if path == "":  # If the path is empty means we have a file at the root level
            path = file_name
        library_name = None
        if "Shared Documents" in self._sharepoint_dir:
            dir_access = self._connect.check_folder_access_and_presence(
                path, library_name, path
            )
        else:
            library_name = self._sharepoint_dir.split("/")[0]
            dir_access = self._connect.check_folder_access_and_presence(
                path, library_name, path
            )
        folder_url = path
        length = self.get_directory_length(path)
        while dir_access == True:
            length = length - 1
            if length > 0:
                parent_folder = self.get_directory_parent(folder_url)
                dir_access = self._connect.check_folder_access_and_presence(
                    parent_folder, library_name, path
                )
                folder_url = parent_folder
            else:
                raise AutopilotError(
                    f"Internal server error while accessing {self._sharepoint_dir}! "
                    + "One reason could be that your PROJECT_PATH "
                    + "does not start with 'Shared Documents/' (or similar). Please check "
                    + "your settings!"
                )
