import os
from abc import ABC, abstractmethod
from collections import defaultdict
from fnmatch import fnmatch
from pathlib import Path
from typing import Dict, List, Mapping, Optional, Tuple, Union

from loguru import logger
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.sharepoint_fetcher.selectors import FilesSelectors


class SharepointFetcher(ABC):
    def __init__(
        self,
        sharepoint_dir: Optional[str],
        destination_path: Path,
        sharepoint_site: Optional[str],
        download_properties_only: Optional[bool] = False,
        list_title_property_map: Optional[Dict[str, str]] = None,
        filter_config: Optional[List[FilesSelectors]] = None,
    ):
        if sharepoint_dir is not None and sharepoint_site is not None:
            assert sharepoint_dir.endswith(
                "/"
            ), f"{sharepoint_dir} should end with a /, but doesn't!"
            self._destination_path = destination_path

            if "/sites/" not in sharepoint_site:
                logger.warning(
                    "Usually, the URL for a SharePoint site is similar to: "
                    "https://<hostname>/sites/<site_id>. "
                    "If you are getting connection problems, please verify your `sharepoint_site` URL! "
                    "(your current URL is: {})",
                    sharepoint_site,
                )
            if sharepoint_site.endswith("/"):
                sharepoint_site = sharepoint_site[:-1]
            self._sharepoint_site = sharepoint_site

            self._relative_url_prefix = self._get_relative_url_prefix()

            if sharepoint_dir.startswith(self._relative_url_prefix):
                sharepoint_dir = self._remove_url_prefix(sharepoint_dir)
            self._sharepoint_dir = sharepoint_dir

            if list_title_property_map is None:
                list_title_property_map = {}
            self.list_title_property_map: Dict[str, str] = list_title_property_map

            self._folder_filters: List[str] = []
            self._files_selectors: Mapping[str, List[FilesSelectors]] = defaultdict(list)

            self._download_properties_only = download_properties_only

            if filter_config is not None:
                (
                    self._folder_filters,
                    self._files_selectors,
                ) = self._generate_filters_and_selectors(filter_config)
        else:
            raise AutopilotConfigurationError(
                "Missing values for the SharePoint site and path! Make sure you either provide the complete SharePoint URL or both the SharePoint site and path. You can provide the URL either as environment"
                + "variable SHAREPOINT_FETCHER_URL or as command line argument --project-url. In the same way, the site and path can be provided either as environment variables SHAREPOINT_FETCHER_PROJECT_SITE"
                + "and SHAREPOINT_FETCHER_PROJECT_PATH or as command line arguments --project-site and --project-path respectively."
            )

    def _remove_url_prefix(self, url: str) -> str:
        if url.startswith(self._relative_url_prefix):
            return url[len(self._relative_url_prefix + "/") :]
        return url

    def _remove_sharepoint_dir_prefix(self, path: str) -> str:
        if path.startswith(self._sharepoint_dir):
            return path[len(self._sharepoint_dir) :]
        return path

    def _get_relative_url_prefix(self):
        """
        Check if site prefix is required in web URLs and return it.

        Will be either something like `/sites/123456` or just an empty string.

        Logic developed from the reference given in microsoft site:
        https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/working-with-folders-and-files-with-rest
        """
        web_url = self._sharepoint_site
        if web_url.count("/") > 2:
            relative_url = web_url.split("/", maxsplit=3)[3]
            return "/" + relative_url

        return ""

    def _get_files_selectors_for_file_path(self, short_remote_path: str):
        """
        Retrieve the corresponding file selector for a remote file path.

        This is needed because the file selector then also contains the
        title for the selection result as well as the extra checks which
        need to be applied to the fetched file.
        """
        filters = list(self._files_selectors.keys())
        if "/" in short_remote_path and not short_remote_path.endswith("/"):
            short_remote_path = short_remote_path.rsplit("/", maxsplit=1)[0] + "/"
        for filter in filters:
            if fnmatch(short_remote_path, filter):
                return self._files_selectors[filter]
        return []

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

    def _unlink_local_file(self, path: Path):
        """Wrap Path.unlink for easier mocking during tests."""
        path.unlink()

    def save_file(
        self, path: Path, file_name: str, contents: Union[bytes, str], enable_logging: bool
    ):
        if isinstance(contents, str):
            contents = contents.encode("utf-8")
        file_dir_path = Path.cwd().joinpath(path).joinpath(file_name)
        with open(file_dir_path, "wb") as f:
            f.write(contents)
            f.close()
        if not enable_logging:
            logger.info("File `{}` was saved in path `{}`", file_name, path)

    def _generate_filters_and_selectors(
        self, filter_config: List[FilesSelectors]
    ) -> Tuple[List[str], Mapping[str, List[FilesSelectors]]]:
        folder_filters: List[str] = []
        files_selectors: Mapping[str, List[FilesSelectors]] = defaultdict(list)
        for files_selector in filter_config:
            filter_expression = files_selector.filter
            folder_filter = os.path.dirname(filter_expression)
            if folder_filter:
                folder_filter += "/"
            if folder_filter not in folder_filters:
                folder_filters.append(folder_filter)
            files_selectors[folder_filter].append(files_selector)
        return folder_filters, files_selectors

    @abstractmethod
    def _download_file(
        self,
        output_path: Path,
        remote_path: str,
        file_name: str,
        *,
        files_selectors: Optional[List[FilesSelectors]] = None,
    ):
        pass

    @abstractmethod
    def download_folder(self, remote_path=None):
        pass

    @abstractmethod
    def _fetch_subfolders(self, remote_path: str):
        pass

    @abstractmethod
    def _fetch_files(self, remote_path: str):
        pass

    @abstractmethod
    def check_dir_access(self):
        pass

    @abstractmethod
    def download_custom_property_definitions(self):
        pass
