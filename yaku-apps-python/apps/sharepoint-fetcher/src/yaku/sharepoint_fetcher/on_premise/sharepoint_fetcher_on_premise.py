import itertools
import json
import os
import shutil
import urllib.parse
from fnmatch import fnmatch
from pathlib import Path
from typing import Any, Dict, List, Optional

from loguru import logger
from yaku.autopilot_utils.checks import check
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.sharepoint_fetcher.selectors import FilesSelectors
from yaku.sharepoint_fetcher.sharepoint_fetcher import SharepointFetcher
from yaku.sharepoint_fetcher.utils import PropertiesReader

from .connect import Connect


class SharepointFetcherOnPremise(SharepointFetcher):
    """
    Fetch files from an on-premise SharePoint directory.

    Given a `sharepoint_site` URL and a `sharepoint_dir` path, you can
    download files and folders recursively into `destination_path`.

    The sharepoint site URL must be given as full URL including the site path part,
    e.g. `https://some.sharepoint.server/sites/123456/`.

    The sharepoint directory is given as file system path, e.g. `Documents/SubfolderA/`.

    The destination path is a Python `Path` object to a local directory into
    which the downloaded files and directories are put.

    As files and folders may have custom metadata with custom values, you can
    provide the names of the lists containing the custom properties together
    with a mapping to the property names of their list items which contain the
    actual human-readable title.

    For example, if `list_title_property_map = {'Field One': 'FieldOneTitle'}`
    is given, the sharepoint fetcher will try to download the list data for the
    custom field SharePoint list 'Field One' and will then go through all items of this
    SharePoint list and get their 'FieldOneTitle' property.
    This title property will then be used to convert custom property integer IDs
    to their human-readable titles.

    It is also possible to download only the property files and no file contents.
    This can be enabled by providing `download_properties_only=True`.
    """

    # used for storing the file metadata in a JSON file next to the downloaded file
    metadata_file_suffix = ".__properties__.json"

    # used to store mapping of file property value IDs to their titles
    custom_property_definitions_filename = "__custom_property_definitions__.json"

    def __init__(
        self,
        sharepoint_dir: Optional[str],
        destination_path: Path,
        sharepoint_site: Optional[str],
        username: Optional[str],
        password: Optional[str],
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
        if username is None:
            raise AutopilotConfigurationError(
                "Missing value for the username! You can provide the username either as environment"
                + "variable SHAREPOINT_FETCHER_USERNAME or as command line argument --username."
            )

        if password is None:
            raise AutopilotConfigurationError(
                "Missing value for the password! You can provide the password either as environment"
                + "variable SHAREPOINT_FETCHER_PASSWORD or as command line argument --password."
            )

        self._connect = Connect(self._sharepoint_site, username, password, force_ip)
        self._properties_reader = PropertiesReader(
            self._destination_path / self.custom_property_definitions_filename
        )

    def download_file(self, remote_path, file_name):
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

        The `remote_path` must contain the site prefix, unless it is empty
        (see also `relative_url_prefix`).
        """
        if remote_path is None:
            remote_path = self._relative_url_prefix + "/" + self._sharepoint_dir

        assert remote_path.endswith("/"), f"{remote_path} should end with a /, but doesn't!"

        output_path = self._destination_path.joinpath(
            self._remove_sharepoint_dir_prefix(self._remove_url_prefix(remote_path))
        )
        os.makedirs(output_path, exist_ok=True)

        # we first dive into all subfolders (not using any folder filters here!)
        # TODO: use filter to prevent creating subfolders which eventually don't contain any file
        subfolders = self._fetch_subfolders(remote_path)
        for subfolder in subfolders:
            assert subfolder.startswith(
                self._relative_url_prefix + "/" + self._sharepoint_dir
            ), f"{subfolder} should start with {self._relative_url_prefix + '/' + self._sharepoint_dir}, but doesn't!"
            self.download_folder(subfolder + "/")

        # skip checking files in folders which are not in the include list by our filters
        short_remote_path = self._remove_sharepoint_dir_prefix(
            self._remove_url_prefix(remote_path)
        )
        if self._folder_filters and not any(
            [fnmatch(short_remote_path, filter) for filter in self._folder_filters]
        ):
            return

        # go through list of files and match it with our filter expressions
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
                    # our current file doesn't match any files filter
                    continue

            did_download_file = self._download_file(
                output_path, remote_path, file, files_selectors=files_selectors
            )
            if did_download_file and matching_files_selector_index is not None:
                downloaded_files_per_selector[matching_files_selector_index].append(file)

        # this function checks whether a folder doesn't have any files that match
        # any selectors including nested sub-folders
        # if the folder is empty of files, remove it
        def check_folder_empty(output_path: Path):
            files = [
                file_path.name for file_path in output_path.glob("*") if file_path.is_file()
            ]
            subfolders = [
                subfolder for subfolder in os.listdir(output_path) if subfolder not in files
            ]
            if len(subfolders) == 0 and len(files) == 0:
                logger.debug(
                    "Removing local folder `{}` because it doesn't have files that match filter criteria.",
                    output_path,
                )
                shutil.rmtree(output_path)
                return False
            if len(files) != 0:
                return True
            has_nested_files = False
            for subfolder in subfolders:
                nested_output_path = output_path / subfolder
                nested_files = check_folder_empty(nested_output_path)
                if nested_files:
                    has_nested_files = True

            if not has_nested_files:
                logger.debug(
                    "Removing local folder `{}` because it doesn't have files that match filter criteria.",
                    output_path,
                )
                shutil.rmtree(output_path)
                return False

        if files_selectors and not all(downloaded_files_per_selector):
            selectors_with_no_files = itertools.compress(
                files_selectors, [not f for f in downloaded_files_per_selector]
            )
            check_folder_empty(output_path)
            logger.debug(
                "Some file filters for `{}` didn't match any file! Those filters were: {}",
                short_remote_path if short_remote_path else "<root path>",
                ", ".join([str(f) for f in selectors_with_no_files]),
            )

        # now do a check whether we need to keep only the last modified file
        # (if there were more than one) and then print out the URL of the
        # fetched files as comments
        def filter_out_last_modified_file(output_path: Path, files: List[str]):
            files_with_lmd = []
            for file in files:
                last_modified = self._properties_reader.get_file_property(
                    output_path / file, "Modified"
                )
                files_with_lmd.append((file, last_modified))
            files_with_lmd.sort(key=lambda x: x[1], reverse=True)
            return (
                [files_with_lmd[0][0]],
                list(map(lambda x: x[0], files_with_lmd[1:])),
            )

        for index, files_selector in enumerate(files_selectors):
            title = files_selector.title
            downloaded_files = downloaded_files_per_selector[index]
            onlyLastModified = files_selector.onlyLastModified
            if downloaded_files:
                if onlyLastModified:
                    (files_to_keep, files_to_delete) = filter_out_last_modified_file(
                        output_path, downloaded_files
                    )
                    for unlink_me in files_to_delete:
                        logger.debug(
                            "Removing file `{}` because onlyLastModified={} and there is a more recent modified file.",
                            unlink_me,
                            onlyLastModified,
                        )
                        self._unlink_local_file(output_path / unlink_me)
                        self._unlink_local_file(
                            output_path / (unlink_me + self.metadata_file_suffix)
                        )
                    downloaded_files = files_to_keep
                if title:
                    urls = []
                    for file in downloaded_files:
                        urls.append(
                            f"{self._sharepoint_site}/{urllib.parse.quote(self._remove_url_prefix(remote_path))}{urllib.parse.quote(file)}"
                        )
                    logger.info("{}: {}", title, ", ".join([f"<{url}>" for url in urls]))

    def download_custom_property_definitions(self):
        result = {}
        lists_with_items = self._connect.verify_site_lists(
            titles=list(self.list_title_property_map.keys()), must_have_items=True
        )
        for list_title in lists_with_items:
            list_item_title_property = self.list_title_property_map[list_title]
            try:
                item_mapping = self._connect.get_items_for_list(
                    list_title, list_item_title_property
                )
            except KeyError:
                logger.error(
                    "Error: when downloading file property lists, "
                    "the '{}' list could not be parsed!",
                    list_title,
                )
                continue

            result[list_title] = {k: v for k, v in item_mapping.items()}

        self.save_file(
            self._destination_path,
            self.custom_property_definitions_filename,
            json.dumps(result, indent=2),
            False,
        )

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

        assert remote_path.startswith(
            self._relative_url_prefix
        ), f"{remote_path} should start with {self._relative_url_prefix}, but doesn't!"

        # download file properties
        file_properties = self._connect.get_file_properties(remote_path, file_name)

        self.save_file(
            output_path,
            file_name + self.metadata_file_suffix,
            json.dumps(file_properties, indent=2),
            True,
        )

        # find matching files_selectors
        if files_selectors:
            files_selectors = list(
                filter(
                    lambda f: fnmatch(
                        self._remove_sharepoint_dir_prefix(
                            self._remove_url_prefix(remote_path + "/" + file_name)
                        ),
                        f.filter,
                    ),
                    files_selectors,
                )
            )
            for file_selectors in files_selectors:
                for selector in file_selectors.selectors:
                    # make sure every selector matches, otherwise skip downloading
                    # if not_matches: return

                    try:
                        property_value = self._properties_reader.get_file_property(
                            output_path / file_name, selector.property
                        )
                    except AutopilotError:
                        # TODO: should we really delete the file? Perhaps it is useful for debugging?
                        self._unlink_local_file(
                            output_path / (file_name + self.metadata_file_suffix)
                        )
                        raise

                    matches = check(
                        checked_value=property_value,
                        operator=selector.operator,
                        other_value=selector.other_value,
                    )
                    if not matches:
                        logger.debug(
                            "Removing local file `{}` because it doesn't match filter criteria.",
                            file_name + self.metadata_file_suffix,
                        )
                        self._unlink_local_file(
                            output_path / (file_name + self.metadata_file_suffix)
                        )
                        return False

        # download file
        if not self._download_properties_only:
            file_contents = self._connect.get_file_object(remote_path, file_name)
            logger.info(
                "File `{}` was saved in path `{}`",
                file_name + self.metadata_file_suffix,
                output_path,
            )
            self.save_file(output_path, file_name, file_contents, False)
        return True

    def _fetch_subfolders(self, remote_path: str) -> List[str]:
        """
        Fetch list of all subfolders of a given path.

        Fetches list of relative paths of all remote folders present inside the
        folder given by `remote_path`.

        The folder names are returned as absolute paths on the server, including
        the relative url prefix (when present).

        For example: if called with `/sites/123456/Documents/Some/Path/` it
        might return a list with entries like
        `/sites/123456/Documents/Some/Path/WithSubFolder`.
        """
        assert remote_path.startswith(
            self._relative_url_prefix
        ), f"{remote_path} should start with {self._relative_url_prefix}, but doesn't!"
        result = self._connect.get_folders(remote_path)
        return self.frame_list_from_dict(result, "folders")

    def _fetch_files(self, remote_path: str) -> List[str]:
        """
        Fetch list of file names.

        Fetches list of names of all files present inside the folder passed
        through parameter.
        """
        assert remote_path.startswith(
            self._relative_url_prefix
        ), f"{remote_path} should start with {self._relative_url_prefix}, but doesn't!"
        result = self._connect.get_files(remote_path)
        return self.frame_list_from_dict(result, "files")

    def get_directory_length(self, relative_url):
        url_parts = relative_url.split("/")
        non_empty_parts = [part for part in url_parts if part]
        length = len(non_empty_parts)
        return length

    def get_directory_parent(self, relative_url):
        url_parts = relative_url.rstrip("/").split("/")
        parent_url = "/".join(url_parts[:-1]) + "/"
        return parent_url

    def check_dir_access(self, file_name):
        relative_url = self._relative_url_prefix + "/" + self._sharepoint_dir
        length = self.get_directory_length(relative_url)
        dir_access = self._connect.check_folder_access_and_presence(relative_url, relative_url)
        folder_url = relative_url
        while dir_access:
            length = length - 1
            if length > 2:
                parent_folder = self.get_directory_parent(folder_url)
                dir_access = self._connect.check_folder_access_and_presence(
                    parent_folder, relative_url
                )
                folder_url = parent_folder
            else:
                raise AutopilotError(
                    f"Internal server error while accessing {relative_url}! "
                    + "One reason could be that your PROJECT_PATH "
                    + "does not start with 'Documents/' (or similar). Please check "
                    + "your settings!"
                )
        return dir_access

    @staticmethod
    def frame_list_from_dict(result_list: List[Dict[str, Any]], list_type) -> List[str]:
        final_list = []
        for item in result_list:
            assert list_type in ("files", "folders"), f"Unknown list_type: {list_type}!"
            if list_type == "files":
                final_list.append(item["Name"])
            elif list_type == "folders":
                final_list.append(item["ServerRelativeUrl"])

        return final_list
