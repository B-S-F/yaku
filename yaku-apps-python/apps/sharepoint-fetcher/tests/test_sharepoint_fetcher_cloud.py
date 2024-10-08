import json
import logging
import os
import re
from pathlib import Path
from unittest import mock

import pytest
from yaku.autopilot_utils.errors import AutopilotError
from yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud import (
    SharepointFetcherCloud,
)
from yaku.sharepoint_fetcher.selectors import FilesSelectors, Selector


@pytest.fixture
def default_fetcher():
    return SharepointFetcherCloud(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "tenant-id",
        "client-id",
        "client-secret",
        list_title_property_map={
            "StatusList": "StatusTitle",
            "Workflow Status": "WorkflowStatus",
        },
    )


def test_initializer_args(caplog):
    SharepointFetcherCloud(
        "Documents/",
        Path("out_path"),
        "https://some.weird.url/",
        "tenant-id",
        "client-id",
        "client-secret",
    )

    assert "please verify" in caplog.text


def test_sharepoint_site_with_trailing_slash():
    url = "https://some.sharepoint.url/sites/123456/"
    sf = SharepointFetcherCloud(
        "Documents/",
        Path("out_path"),
        url,
        "tenant-id",
        "client-id",
        "client-secret",
    )
    assert sf._sharepoint_site == url[:-1]


def test_sharepoint_dir_with_site_prefix():
    remote_path = "/sites/123456/Documents/"
    sf = SharepointFetcherCloud(
        remote_path,
        Path("out_path"),
        "https://some.sharepoint.url/sites/123456",
        "tenant-id",
        "client-id",
        "client-secret",
    )
    assert sf._sharepoint_dir == "Documents/"


def test_initial_value():
    fetcher = SharepointFetcherCloud(
        "/Documents/shared-foss-id/",
        Path("evidence_path"),
        "https://my.sharepoint.com/sites/0xe32s/",
        "tenant-id",
        "client-id",
        "client-secret",
    )

    assert fetcher._relative_url_prefix == "/sites/0xe32s"


def test_filter_config_argument():
    fetcher = SharepointFetcherCloud(
        "/Documents/shared-foss-id/",
        Path("evidence_path"),
        "https://my.sharepoint.com/sites/0xe32s/",
        "tenant-id",
        "client-id",
        "client-secret",
        filter_config=[
            FilesSelectors(
                "some/filter/expression/*.xlsx",
                [Selector("Date", "equals", "yesterday")],
            )
        ],
    )

    assert fetcher._folder_filters == ["some/filter/expression/"]


def test_get_files_selectors_for_path(default_fetcher):
    selector1 = FilesSelectors("some/filter/expression/*.xlsx", [])
    selector2 = FilesSelectors("path_with_wildcard_*/index.html", [])
    fetcher = SharepointFetcherCloud(
        "/Documents/shared-foss-id/",
        Path("evidence_path"),
        "https://my.sharepoint.com/sites/0xe32s/",
        "tenant-id",
        "client-id",
        "client-secret",
        filter_config=[selector1, selector2],
    )
    assert [selector1] == fetcher._get_files_selectors_for_file_path("some/filter/expression/")
    assert [selector1] == fetcher._get_files_selectors_for_file_path(
        "some/filter/expression/myfile.xlsx"
    )
    assert [] == fetcher._get_files_selectors_for_file_path(
        "some/filter/expression/subfolder/"
    )
    assert [selector2] == fetcher._get_files_selectors_for_file_path(
        "path_with_wildcard_ABC/index.html"
    )
    assert [selector2] == fetcher._get_files_selectors_for_file_path(
        "path_with_wildcard_ABC/other_file.html"
    )


def test_get_relative_url_prefix():
    fetcher = SharepointFetcherCloud(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "tenant-id",
        "client-id",
        "client-secret",
    )
    assert fetcher._get_relative_url_prefix() == "/sites/123456"


def test_get_relative_url_prefix_for_non_standard_url_layout(caplog):
    fetcher = SharepointFetcherCloud(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/p/000abc123456/",
        "tenant-id",
        "client-id",
        "client-secret",
    )
    assert fetcher._get_relative_url_prefix() == "/p/000abc123456"
    assert "please verify" in caplog.text


def test_get_relative_url_prefix_shorter(caplog):
    fetcher = SharepointFetcherCloud(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/",
        "tenant-id",
        "client-id",
        "client-secret",
    )
    assert fetcher._get_relative_url_prefix() == ""
    assert "please verify" in caplog.text


def test_download_file(mocker, default_fetcher: SharepointFetcherCloud):
    mocked_connect_get_file_object = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.connect.Connect.get_file_object"
    )
    file_response = b"0x410x420x43"
    mocked_connect_get_file_object.return_value = file_response

    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    mocked_save_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcherCloud.save_file"
    )
    mocked_save_file.return_value = {}

    file_name = "test3.txt"
    res_folder = Path(os.getcwd() + "/tests/resources")
    default_fetcher._download_file(res_folder, "/sites/123456/Documents/somepath", file_name)

    mocked_connect_get_file_object.assert_called_with("somepath", "test3.txt", "Documents")
    mocked_connect_get_file_properties.assert_called_with("somepath", "test3.txt", "Documents")
    mocked_save_file.assert_has_calls(
        [
            mock.call(res_folder, "test3.txt", file_response, False),
            mock.call(
                res_folder,
                "test3.txt" + SharepointFetcherCloud.metadata_file_suffix,
                json.dumps(property_response, indent=2),
                False,
            ),
        ],
        any_order=True,
    )


def test_download_file_trailing_slash(mocker, default_fetcher: SharepointFetcherCloud):
    mocked_connect_get_file_object = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.connect.Connect.get_file_object"
    )
    file_response = b"0x410x420x43"
    mocked_connect_get_file_object.return_value = file_response

    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    mocked_save_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcherCloud.save_file"
    )
    mocked_save_file.return_value = {}

    file_name = "test3.txt"
    res_folder = Path(os.getcwd() + "/tests/resources")
    default_fetcher._download_file(res_folder, "/sites/123456/Documents/somepath/", file_name)

    mocked_connect_get_file_object.assert_called_with("somepath", "test3.txt", "Documents")
    mocked_connect_get_file_properties.assert_called_with("somepath", "test3.txt", "Documents")


def test_download_file_only_properties(mocker, default_fetcher: SharepointFetcherCloud):
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    mocked_save_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcherCloud.save_file"
    )
    mocked_save_file.return_value = {}

    default_fetcher._download_properties_only = True

    file_name = "test3.txt"
    res_folder = Path(os.getcwd() + "/tests/resources")
    default_fetcher._download_file(res_folder, "/sites/123456/Documents/somepath", file_name)

    mocked_connect_get_file_properties.assert_called_with("somepath", "test3.txt", "Documents")
    mocked_save_file.assert_has_calls(
        [
            mock.call(
                res_folder,
                "test3.txt" + SharepointFetcherCloud.metadata_file_suffix,
                json.dumps(property_response, indent=2),
                False,
            ),
        ]
    )


def test_download_file_with_empty_selectors(mocker, default_fetcher: SharepointFetcherCloud):
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    mocked_save_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcher.save_file"
    )

    mocked_connect_get_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.connect.Connect.get_file_object"
    )

    default_fetcher._download_file(
        "evidence_path/", "/sites/123456/Test1/", "File1.docx", files_selectors=[]
    )

    assert mocked_save_file.call_count == 2
    assert mocked_connect_get_file_object.call_count == 1


def test_save_file_with_bytes(requests_mock, caplog):
    output_path = Path("Downloads/DocumentA/Files")

    mocked_open = mock.mock_open()
    with mock.patch("builtins.open", mocked_open):
        SharepointFetcherCloud.save_file(
            requests_mock, output_path, "FILE.xlsx", b"x00xx", False
        )

    mocked_open.assert_called_with(Path.cwd() / output_path / "FILE.xlsx", "wb")
    handle = mocked_open()
    handle.write.assert_called_with(b"x00xx")

    assert caplog.record_tuples == [
        (
            "yaku.sharepoint_fetcher.sharepoint_fetcher",
            logging.INFO,
            f"File `FILE.xlsx` was saved in path `{output_path}`",
        )
    ]


def test_save_file_with_string(caplog):
    output_path = Path("Downloads/DocumentA/Files")

    mocked_open = mock.mock_open()
    with mock.patch("builtins.open", mocked_open):
        SharepointFetcherCloud.save_file(
            default_fetcher,
            path=output_path,
            file_name="FILE.xlsx",
            contents="{}",
            enable_logging=False,
        )

    mocked_open.assert_called_with(Path.cwd() / output_path / "FILE.xlsx", "wb")
    handle = mocked_open()
    handle.write.assert_called_with(b"{}")

    assert caplog.record_tuples == [
        (
            "yaku.sharepoint_fetcher.sharepoint_fetcher",
            logging.INFO,
            f"File `FILE.xlsx` was saved in path `{output_path}`",
        )
    ]


def test_download_folder_files_without_subfolders(mocker):
    output_dir = Path.cwd() / "tests" / "resources"
    remote_path = "Documents/shared-foss-id/"
    site_prefix = "/sites/0xe32s/"

    fetcher = SharepointFetcherCloud(
        remote_path,
        output_dir,
        "https://my.sharepoint.com" + site_prefix,
        "tenant-id",
        "client-id",
        "client-secret",
    )

    mocked_fetch_subfolders = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcherCloud._fetch_subfolders"
    )
    mocked_fetch_subfolders.return_value = []

    mocked_fetch_files = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcherCloud._fetch_files"
    )
    mocked_fetch_files.return_value = ["f1"]

    mocked_download_file = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcherCloud._download_file"
    )
    mocked_download_file.return_value = {}

    mocker.patch("os.makedirs")

    fetcher.download_folder(None)

    mocked_fetch_files.assert_called_with(site_prefix + remote_path)
    mocked_fetch_subfolders.assert_called_with("shared-foss-id/")
    mocked_download_file.assert_called_with(
        output_dir, site_prefix + remote_path, "f1", files_selectors=[]
    )


def test_get_directory_length(default_fetcher: SharepointFetcherCloud):
    relative_url = "/sites/123456/Documents/test/subfolder/"
    assert default_fetcher.get_directory_length(relative_url=relative_url) == 5


def test_get_directory_parent(default_fetcher: SharepointFetcherCloud):
    relative_url = "/sites/123456/Documents/test/subfolder/"
    parent_url = "/sites/123456/Documents/test/"
    assert default_fetcher.get_directory_parent(relative_url=relative_url) == parent_url


def test_check_dir_access(requests_mock):
    fetcher = SharepointFetcherCloud(
        "Shared Documents/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "tenant-id",
        "client-id",
        "client-secret",
    )
    requests_mock.get(
        "https://graph.microsoft.com/v1.0/sites/123456/drive/root:/Shared%20Documents/",
        status_code=500,
        json={"res": "Internal server error!"},
    )
    requests_mock.get(
        "https://graph.microsoft.com/v1.0/sites/some.server:/sites/123456",
        status_code=200,
        json={"id": "server_id,123456"},
    )
    match = 'Internal server error while accessing https://graph.microsoft.com/v1.0/sites/123456/drive/root:/Shared%20Documents/!One reason could be that your PROJECT_PATH does not start with \'Shared Documents/\' (or similar). Please check your settings!\n\nThe server\'s response was: {"res": "Internal server error!"}'
    regex = re.escape(match)
    with pytest.raises(AutopilotError, match=regex):
        fetcher.check_dir_access("Shared Documents/")


def test_download_folders_files_with_nested_folders(
    mocker, default_fetcher: SharepointFetcherCloud
):
    mocked_fetch_subfolders: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcherCloud._fetch_subfolders"
    )
    mocked_fetch_subfolders.side_effect = [
        ["/sites/123456/Documents/fossid-tools-report-ok/Test"],
        [],
    ]
    mocked_fetch_files: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.cloud.sharepoint_fetcher_cloud.SharepointFetcherCloud._fetch_files"
    )
    mocked_fetch_files.return_value = []

    mocker.patch("os.makedirs")

    default_fetcher.download_folder("/sites/123456/Documents/fossid-tools-report-ok/")

    assert mocked_fetch_files.call_count == 2
    assert mocked_fetch_subfolders.call_count == 2


def test_generate_filters_and_selectors(requests_mock):
    filter_config = [FilesSelectors("Folder1/*.docx", [])]
    folder_filters, files_selectors = SharepointFetcherCloud._generate_filters_and_selectors(
        requests_mock, filter_config
    )
    assert folder_filters == ["Folder1/"]
    assert files_selectors == {"Folder1/": filter_config}
