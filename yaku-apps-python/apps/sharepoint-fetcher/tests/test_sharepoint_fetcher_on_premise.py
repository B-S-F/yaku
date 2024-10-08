import json
import logging
import os
import re
from pathlib import Path, PosixPath
from typing import Any, Dict
from unittest import mock

import pytest
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise import (
    SharepointFetcherOnPremise,
)
from yaku.sharepoint_fetcher.selectors import FilesSelectors, Selector


@pytest.fixture
def default_fetcher():
    return SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "username",
        "password",
        list_title_property_map={
            "StatusList": "StatusTitle",
            "Workflow Status": "WorkflowStatus",
        },
    )


def test_initializer_args(caplog):
    SharepointFetcherOnPremise(
        "Documents/", Path("out_path"), "https://some.weird.url/", "username", "password"
    )
    assert "please verify" in caplog.text


def test_sharepoint_site_with_trailing_slash():
    url = "https://some.sharepoint.url/sites/123456/"
    sf = SharepointFetcherOnPremise(
        "Documents/", Path("out_path"), url, "username", "password"
    )
    assert sf._sharepoint_site == url[:-1]


def test_sharepoint_dir_with_site_prefix():
    remote_path = "/sites/123456/Documents/"
    sf = SharepointFetcherOnPremise(
        remote_path,
        Path("out_path"),
        "https://some.sharepoint.url/sites/123456",
        "username",
        "password",
    )
    assert sf._sharepoint_dir == "Documents/"


def test_initial_value():
    fetcher = SharepointFetcherOnPremise(
        "/Documents/shared-foss-id/",
        Path("evidence_path"),
        "https://my.sharepoint.com/sites/0xe32s/",
        "username",
        "password",
    )

    assert fetcher._relative_url_prefix == "/sites/0xe32s"


def test_filter_config_argument():
    fetcher = SharepointFetcherOnPremise(
        "/Documents/shared-foss-id/",
        Path("evidence_path"),
        "https://my.sharepoint.com/sites/0xe32s/",
        "username",
        "password",
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
    fetcher = SharepointFetcherOnPremise(
        "/Documents/shared-foss-id/",
        Path("evidence_path"),
        "https://my.sharepoint.com/sites/0xe32s/",
        "username",
        "password",
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
    fetcher = SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "username",
        "password",
    )
    assert fetcher._get_relative_url_prefix() == "/sites/123456"


def test_get_relative_url_prefix_for_non_standard_url_layout(caplog):
    fetcher = SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/p/000abc123456/",
        "username",
        "password",
    )
    assert fetcher._get_relative_url_prefix() == "/p/000abc123456"
    # assert "please verify" in caplog.text


def test_get_relative_url_prefix_shorter(caplog):
    fetcher = SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/",
        "username",
        "password",
    )
    assert fetcher._get_relative_url_prefix() == ""
    assert "please verify" in caplog.text


def test_frame_list_from_dict_files():
    response = [{"Name": "FILE3.xlsx"}, {"Name": "FILE4.png"}]
    assert SharepointFetcherOnPremise.frame_list_from_dict(response, "files") == [
        "FILE3.xlsx",
        "FILE4.png",
    ]


def test_frame_list_from_dict_folders():
    response = [{"ServerRelativeUrl": "/Documents/fossid-tools-report-ok"}]
    assert SharepointFetcherOnPremise.frame_list_from_dict(response, "folders") == [
        "/Documents/fossid-tools-report-ok"
    ]


def test_frame_list_from_dict_unknown():
    with pytest.raises(AssertionError, match="Unknown list_type: foo"):
        SharepointFetcherOnPremise.frame_list_from_dict([1, 2, 3], "foo")


def test_fetch_file_names_list(requests_mock, default_fetcher: SharepointFetcherOnPremise):
    requests_mock.get(
        "https://some.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/subfolder')/files",
        status_code=200,
        json={"d": {"results": [{"Name": "FILE1.xlsx"}, {"Name": "FILE2.jpg"}]}},
    )

    assert default_fetcher._fetch_files("/sites/123456/subfolder") == [
        "FILE1.xlsx",
        "FILE2.jpg",
    ]


def test_fetch_file_names_list_with_paginated_results(
    requests_mock, default_fetcher: SharepointFetcherOnPremise
):
    requests_mock.get(
        "https://some.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/subfolder')/files",
        status_code=200,
        json={"d": {"results": [{"Name": "FILE1.xlsx"}], "__next": "some://url"}},
    )

    requests_mock.get("", status_code=200, json={"d": {"results": [{"Name": "FILE2.jpg"}]}})

    assert default_fetcher._fetch_files("/sites/123456/subfolder") == [
        "FILE1.xlsx",
        "FILE2.jpg",
    ]


def test_fetch_folder_relative_urls_list(
    requests_mock, default_fetcher: SharepointFetcherOnPremise
):
    requests_mock.get(
        "https://some.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/subfolder')/folders",
        status_code=200,
        json={"d": {"results": [{"ServerRelativeUrl": "/Documents/fossid-tools-report-ok"}]}},
    )

    assert default_fetcher._fetch_subfolders("/sites/123456/subfolder") == [
        "/Documents/fossid-tools-report-ok"
    ]


def test_download_file(mocker, default_fetcher: SharepointFetcherOnPremise):
    # mock get_file_object
    mocked_connect_get_file_object = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )
    file_response = b"0x410x420x43"
    mocked_connect_get_file_object.return_value = file_response

    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock save_file
    mocked_save_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.save_file"
    )
    mocked_save_file.return_value = {}

    file_name = "test3.txt"
    res_folder = Path(os.getcwd() + "/tests/resources")
    default_fetcher._download_file(res_folder, "/sites/123456/Documents/somepath", file_name)

    mocked_connect_get_file_object.assert_called_with(
        "/sites/123456/Documents/somepath", "test3.txt"
    )
    mocked_connect_get_file_properties.assert_called_with(
        "/sites/123456/Documents/somepath", "test3.txt"
    )
    mocked_save_file.assert_has_calls(
        [
            mock.call(res_folder, "test3.txt", file_response, False),
            mock.call(
                res_folder,
                "test3.txt" + SharepointFetcherOnPremise.metadata_file_suffix,
                json.dumps(property_response, indent=2),
                True,
            ),
        ],
        any_order=True,
    )


def test_download_file_trailing_slash(mocker, default_fetcher: SharepointFetcherOnPremise):
    # mock get_file_object
    mocked_connect_get_file_object = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )
    file_response = b"0x410x420x43"
    mocked_connect_get_file_object.return_value = file_response

    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock save_file
    mocked_save_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.save_file"
    )
    mocked_save_file.return_value = {}

    file_name = "test3.txt"
    res_folder = Path(os.getcwd() + "/tests/resources")
    default_fetcher._download_file(res_folder, "/sites/123456/Documents/somepath/", file_name)

    mocked_connect_get_file_object.assert_called_with(
        "/sites/123456/Documents/somepath", "test3.txt"
    )
    mocked_connect_get_file_properties.assert_called_with(
        "/sites/123456/Documents/somepath", "test3.txt"
    )


def test_download_file_only_properties(mocker, default_fetcher: SharepointFetcherOnPremise):
    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock save_file
    mocked_save_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcher.save_file"
    )
    mocked_save_file.return_value = {}

    # set the necessary flag for disabling file download but only properties
    default_fetcher._download_properties_only = True

    file_name = "test3.txt"
    res_folder = Path(os.getcwd() + "/tests/resources")
    default_fetcher._download_file(res_folder, "/sites/123456/Documents/somepath", file_name)

    mocked_connect_get_file_properties.assert_called_with(
        "/sites/123456/Documents/somepath", "test3.txt"
    )
    mocked_save_file.assert_has_calls(
        [
            mock.call(
                res_folder,
                "test3.txt" + SharepointFetcherOnPremise.metadata_file_suffix,
                json.dumps(property_response, indent=2),
                True,
            ),
        ]
    )


def test_download_file_with_empty_selectors(
    mocker, default_fetcher: SharepointFetcherOnPremise
):
    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock save_file
    mocked_save_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcher.save_file"
    )

    # mock get_file_object
    mocked_connect_get_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )

    default_fetcher._download_file(
        "evidence_path/", "/sites/123456/Test1/", "File1.docx", files_selectors=[]
    )

    assert mocked_save_file.call_count == 2
    assert mocked_connect_get_file_object.call_count == 1


def test_download_file_with_simple_equality_selector(
    mocker, default_fetcher: SharepointFetcherOnPremise, tmp_path: Path
):
    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some_property": "some_data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock get_file_object
    mocked_connect_get_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )
    mocked_connect_get_file_object.return_value = b""

    default_fetcher._download_file(
        tmp_path,
        "/sites/123456/Test1/",
        "File1.docx",
        files_selectors=[
            FilesSelectors("Test1/*", [Selector("some_property", "equals", "some_data")])
        ],
    )

    assert (tmp_path / ("File1.docx" + default_fetcher.metadata_file_suffix)).exists()
    assert (tmp_path / "File1.docx").exists()
    assert mocked_connect_get_file_object.call_count == 1


def test_download_file_with_invalid_property_selector(
    mocker, default_fetcher: SharepointFetcherOnPremise, tmp_path: Path
):
    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some_property": "some_data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock get_file_object
    mocked_connect_get_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )
    mocked_connect_get_file_object.return_value = b""

    with pytest.raises(AutopilotConfigurationError, match="unknown_property"):
        default_fetcher._download_file(
            tmp_path,
            "/sites/123456/Test1/",
            "File1.docx",
            files_selectors=[
                FilesSelectors(
                    "Test1/*", [Selector("unknown_property", "equals", "some_data")]
                )
            ],
        )

    # property file should still exist so that we can manually debug the unknown property issue
    assert (tmp_path / ("File1.docx" + default_fetcher.metadata_file_suffix)).exists()
    assert not (tmp_path / "File1.docx").exists()
    assert mocked_connect_get_file_object.call_count == 0


def test_download_file_with_custom_property_value(mocker, tmp_path: Path):
    evidence_folder = tmp_path
    my_fetcher = SharepointFetcherOnPremise(
        "/sites/123456/Documents/",
        evidence_folder,
        "https://my.sharepoint.com/sites/123456/",
        "username",
        "password",
    )

    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some_property": "some_data", "WorkOnStatusId": 2}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock get_file_object
    mocked_connect_get_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )
    mocked_connect_get_file_object.return_value = b""

    # put custom property file into tmp_path and tell it the properties reader instance
    custom_prop_def_file = evidence_folder / my_fetcher.custom_property_definitions_filename
    custom_prop_def_file.write_text(
        json.dumps({"WorkOn Status": {"1": "enum-title-for-id-1", "2": "enum-title-for-id-2"}})
    )
    my_fetcher._properties_reader.custom_property_definitions_file = custom_prop_def_file
    my_fetcher._properties_reader.add_list_to_property_mapping(
        "WorkOn Status", "WorkOnStatusId"
    )

    my_fetcher._download_file(
        evidence_folder,
        "/sites/123456/Test1/",
        "File1.docx",
        files_selectors=[
            FilesSelectors(
                "Test1/*", [Selector("WorkOn Status", "equals", "enum-title-for-id-2")]
            )
        ],
    )

    assert (tmp_path / ("File1.docx" + my_fetcher.metadata_file_suffix)).exists()
    assert (tmp_path / "File1.docx").exists()
    assert mocked_connect_get_file_object.call_count == 1


def test_download_file_with_unmatched_custom_property_value(mocker, tmp_path: Path):
    evidence_folder = tmp_path
    my_fetcher = SharepointFetcherOnPremise(
        "/sites/123456/Documents/",
        evidence_folder,
        "https://my.sharepoint.com/sites/123456/",
        "username",
        "password",
    )

    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some_property": "some_data", "WorkOnStatusId": 1}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock get_file_object
    mocked_connect_get_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )
    mocked_connect_get_file_object.return_value = b""

    # put custom property file into tmp_path and tell it the properties reader instance
    custom_prop_def_file = evidence_folder / my_fetcher.custom_property_definitions_filename
    custom_prop_def_file.write_text(
        json.dumps({"WorkOn Status": {"1": "enum-title-for-id-1", "2": "enum-title-for-id-2"}})
    )
    my_fetcher._properties_reader.custom_property_definitions_file = custom_prop_def_file
    my_fetcher._properties_reader.add_list_to_property_mapping(
        "WorkOn Status", "WorkOnStatusId"
    )

    my_fetcher._download_file(
        evidence_folder,
        "/sites/123456/Test1/",
        "File1.docx",
        files_selectors=[
            FilesSelectors(
                "Test1/*", [Selector("WorkOn Status", "equals", "enum-title-for-id-2")]
            )
        ],
    )

    assert not (evidence_folder / ("File1.docx" + my_fetcher.metadata_file_suffix)).exists()
    assert not (evidence_folder / "File1.docx").exists()
    assert mocked_connect_get_file_object.call_count == 0


def test_download_file_with_unmatched_simple_equality_selector(
    mocker, default_fetcher: SharepointFetcherOnPremise, tmp_path: Path
):
    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some_property": "some_data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock get_file_object
    mocked_connect_get_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )
    mocked_connect_get_file_object.return_value = b""

    default_fetcher._download_file(
        tmp_path,
        "/sites/123456/Test1/",
        "File1.docx",
        files_selectors=[
            FilesSelectors("Test1/*", [Selector("some_property", "equals", "some_other_data")])
        ],
    )

    assert not (tmp_path / ("File1.docx" + default_fetcher.metadata_file_suffix)).exists()
    assert not (tmp_path / "File1.docx").exists()
    assert mocked_connect_get_file_object.call_count == 0


def test_download_file_with_one_matched_and_one_unmatched_selectors(
    mocker, default_fetcher: SharepointFetcherOnPremise, tmp_path: Path
):
    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some_property": "some_data", "some_number": 5}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_file_object
    mocked_connect_get_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_object"
    )
    mocked_connect_get_file_object.return_value = b""

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_object: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    mocked_connect_get_additional_file_object.return_value = (
        1,
        {"d": {"vti_x005f_filesize": 1}},
    )

    default_fetcher._download_file(
        tmp_path,
        "/sites/123456/Test1/",
        "File1.docx",
        files_selectors=[
            FilesSelectors(
                "Test1/*",
                [
                    Selector("some_property", "equals", "some_data"),
                    Selector("some_number", "is-equal", 4),
                ],
            )
        ],
    )

    assert not (tmp_path / ("File1.docx" + default_fetcher.metadata_file_suffix)).exists()
    assert not (tmp_path / "File1.docx").exists()
    assert mocked_connect_get_file_object.call_count == 0


def test_save_file_with_bytes(requests_mock, caplog):
    output_path = Path("Downloads/DocumentA/Files")

    mocked_open = mock.mock_open()
    with mock.patch("builtins.open", mocked_open):
        SharepointFetcherOnPremise.save_file(
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
        SharepointFetcherOnPremise.save_file(
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
    fetcher = SharepointFetcherOnPremise(
        remote_path,
        output_dir,
        "https://my.sharepoint.com" + site_prefix,
        "username",
        "password",
    )

    mocked_fetch_subfolders = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_subfolders"
    )
    mocked_fetch_subfolders.return_value = []

    mocked_fetch_files = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_files"
    )
    mocked_fetch_files.return_value = ["f1"]

    mocked_download_file = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._download_file"
    )
    mocked_download_file.return_value = {}

    mocker.patch("os.makedirs")

    fetcher.download_folder()

    mocked_fetch_files.assert_called_with(site_prefix + remote_path)
    mocked_fetch_subfolders.assert_called_with(site_prefix + remote_path)
    mocked_download_file.assert_called_with(
        output_dir, site_prefix + remote_path, "f1", files_selectors=[]
    )


def test_download_folders_files_with_nested_folders(
    mocker, default_fetcher: SharepointFetcherOnPremise
):
    mocked_fetch_subfolders: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_subfolders"
    )
    mocked_fetch_subfolders.side_effect = [
        ["/sites/123456/Documents/fossid-tools-report-ok/Test"],
        [],
    ]
    mocked_fetch_files: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_files"
    )
    mocked_fetch_files.return_value = []

    mocker.patch("os.makedirs")

    default_fetcher.download_folder("/sites/123456/Documents/fossid-tools-report-ok/")

    assert mocked_fetch_files.call_count == 2
    assert mocked_fetch_subfolders.call_count == 2


def test_get_directory_length(default_fetcher: SharepointFetcherOnPremise):
    relative_url = "/sites/123456/Documents/test/subfolder/"
    assert default_fetcher.get_directory_length(relative_url=relative_url) == 5


def test_get_directory_parent(default_fetcher: SharepointFetcherOnPremise):
    relative_url = "/sites/123456/Documents/test/subfolder/"
    parent_url = "/sites/123456/Documents/test/"
    assert default_fetcher.get_directory_parent(relative_url=relative_url) == parent_url


def test_check_dir_access(requests_mock):
    fetcher = SharepointFetcherOnPremise(
        "Documents/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "username",
        "password",
    )
    requests_mock.get(
        "https://some.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/Documents/')",
        status_code=500,
        json={"res": "Internal server error!"},
    )
    match = "Internal server error while accessing /sites/123456/Documents/! One reason could be that your PROJECT_PATH does not start with 'Documents/' (or similar). Please check your settings!"
    regex = re.escape(match)
    with pytest.raises(AutopilotError, match=regex):
        fetcher.check_dir_access("")


@pytest.mark.parametrize(
    ("filter_expressions", "expected_fetch_calls", "expected_download_calls"),
    [
        # download file from root folder
        (
            ["*"],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/")],
            [
                mock.call(
                    PosixPath("evidence_path"),
                    "/sites/123456/Documents/fossid-tools-report-ok/",
                    "FileInRootFolder.pdf",
                    files_selectors=[FilesSelectors(filter="*", selectors=[])],
                )
            ],
        ),
        # download file from one subfolder
        (
            ["Test1/*"],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/")],
            [
                mock.call(
                    PosixPath("evidence_path/Test1"),
                    "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
                    "File1.docx",
                    files_selectors=[FilesSelectors(filter="Test1/*", selectors=[])],
                )
            ],
        ),
        # download only certain file suffixes
        (
            ["Test1/*.docx"],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/")],
            [
                mock.call(
                    PosixPath("evidence_path/Test1"),
                    "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
                    "File1.docx",
                    files_selectors=[FilesSelectors(filter="Test1/*.docx", selectors=[])],
                )
            ],
        ),
        # download only certain matching file pattern
        (
            ["Test1/File*.docx"],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/")],
            [
                mock.call(
                    PosixPath("evidence_path/Test1"),
                    "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
                    "File1.docx",
                    files_selectors=[FilesSelectors(filter="Test1/File*.docx", selectors=[])],
                )
            ],
        ),
    ],
)
def test_download_folders_with_folder_filter_expression(
    mocker, filter_expressions, expected_fetch_calls, expected_download_calls
):
    default_fetcher = SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "username",
        "password",
        list_title_property_map={
            "StatusList": "StatusTitle",
            "Workflow Status": "WorkflowStatus",
        },
        filter_config=[
            FilesSelectors(
                expression,
                [],
            )
            for expression in filter_expressions
        ],
    )

    # prevent creation of local directories
    mocker.patch("os.makedirs")

    # mock save_file
    mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.save_file"
    )

    # mock fetch_subfolders
    mocked_fetch_subfolders: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_subfolders"
    )

    def fetch_subfolders_mock(remote_path: str):
        if remote_path == "/sites/123456/Documents/fossid-tools-report-ok/":
            return [
                "/sites/123456/Documents/fossid-tools-report-ok/Test1",
                "/sites/123456/Documents/fossid-tools-report-ok/Test2",
            ]
        elif remote_path == "/sites/123456/Documents/fossid-tools-report-ok/Test1/":
            return ["/sites/123456/Documents/fossid-tools-report-ok/Test1/Test11"]
        else:
            return []

    mocked_fetch_subfolders.side_effect = fetch_subfolders_mock

    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock download_file
    mocked_download_file = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._download_file"
    )

    # mock fetch_files
    mocked_fetch_files: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_files"
    )

    def fetch_files_mock(remote_path: str):
        if remote_path == "/sites/123456/Documents/fossid-tools-report-ok/":
            return ["FileInRootFolder.pdf"]
        elif remote_path.endswith("/sites/123456/Documents/fossid-tools-report-ok/Test1/"):
            return ["File1.docx"]
        elif remote_path.endswith(
            "/sites/123456/Documents/fossid-tools-report-ok/Test1/Test11/"
        ):
            return ["File11.docx"]
        elif remote_path.endswith("/sites/123456/Documents/fossid-tools-report-ok/Test2/"):
            return ["File2.docx"]
        return []

    mocked_fetch_files.side_effect = fetch_files_mock

    default_fetcher.download_folder()

    mocked_fetch_files.assert_has_calls(expected_fetch_calls)
    assert mocked_fetch_files.call_count == len(
        expected_fetch_calls
    ), f"There are extra calls in {mocked_fetch_files.call_args_list}"

    mocked_download_file.assert_has_calls(expected_download_calls)
    assert mocked_download_file.call_count == len(expected_download_calls)


@pytest.mark.parametrize(
    ("filter_expressions", "expected_fetch_calls", "expected_download_calls"),
    [
        # TODO: make this test pass (add feature to check if a filter expression doesn't match any existing folder)
        # download file from subfolder and one non-existing folder
        # (
        #     ["Test1/*", "Test3/*"],
        #     [mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/")],
        #     [
        #         mock.call(
        #             PosixPath("evidence_path/Test1"),
        #             "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
        #             "File1.docx",
        #             files_selectors=[FilesSelectors(filter="Test1/*", selectors=[])],
        #         )
        #     ],
        # ),
        # TODO: make this test pass (add feature to check if a filter expression doesn't match any existing folder)
        # download from two non-existing folders
        # (["Test3/*", "Test4/*"], [], []),
        # download only certain suffix which doesn't match any file
        (
            ["Test1/*.suffix"],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/")],
            [],
        ),
        # download only certain file pattern which doesn't match any file
        (
            ["Test1/Prefix_*.suffix"],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/")],
            [],
        ),
    ],
)
def test_download_folders_with_folder_filter_expression_with_no_wildcard_match(
    mocker, filter_expressions, expected_fetch_calls, expected_download_calls, caplog
):
    default_fetcher = SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "username",
        "password",
        list_title_property_map={
            "StatusList": "StatusTitle",
            "Workflow Status": "WorkflowStatus",
        },
        filter_config=[
            FilesSelectors(
                expression,
                [],
            )
            for expression in filter_expressions
        ],
    )

    # prevent creation of local directories
    mocker.patch("os.makedirs")
    mocker.patch("os.listdir")
    mocker.patch("shutil.rmtree")

    # mock save_file
    mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.save_file"
    )

    # mock fetch_subfolders
    mocked_fetch_subfolders: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_subfolders"
    )

    def fetch_subfolders_mock(remote_path: str):
        if remote_path == "/sites/123456/Documents/fossid-tools-report-ok/":
            return [
                "/sites/123456/Documents/fossid-tools-report-ok/Test1",
                "/sites/123456/Documents/fossid-tools-report-ok/Test2",
            ]
        elif remote_path == "/sites/123456/Documents/fossid-tools-report-ok/Test1/":
            return ["/sites/123456/Documents/fossid-tools-report-ok/Test1/Test11"]
        else:
            return []

    mocked_fetch_subfolders.side_effect = fetch_subfolders_mock

    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )
    property_response = {"some": "json-data"}
    mocked_connect_get_file_properties.return_value = property_response

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock download_file
    mocked_download_file = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._download_file"
    )

    # mock fetch_files
    mocked_fetch_files: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_files"
    )

    def fetch_files_mock(remote_path: str):
        if remote_path == "/sites/123456/Documents/fossid-tools-report-ok/":
            return ["FileInRootFolder.pdf"]
        elif remote_path.endswith("/sites/123456/Documents/fossid-tools-report-ok/Test1/"):
            return ["File1.docx"]
        elif remote_path.endswith(
            "/sites/123456/Documents/fossid-tools-report-ok/Test1/Test11/"
        ):
            return ["File11.docx"]
        elif remote_path.endswith("/sites/123456/Documents/fossid-tools-report-ok/Test2/"):
            return ["File2.docx"]
        return []

    mocked_fetch_files.side_effect = fetch_files_mock

    default_fetcher.download_folder()

    assert "Some file filters for" in caplog.text
    assert "didn't match any file! Those filters were:" in caplog.text

    mocked_fetch_files.assert_has_calls(expected_fetch_calls)
    assert mocked_fetch_files.call_count == len(
        expected_fetch_calls
    ), f"There are extra calls in {mocked_fetch_files.call_args_list}"

    mocked_download_file.assert_has_calls(expected_download_calls)
    assert mocked_download_file.call_count == len(expected_download_calls)


@pytest.mark.parametrize(
    ("filter_expressions", "expected_fetch_calls", "expected_download_calls"),
    [
        # download file from root folder
        (
            [("*", [])],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/")],
            [
                mock.call(
                    PosixPath("evidence_path"),
                    "/sites/123456/Documents/fossid-tools-report-ok/",
                    "FileInRootFolder.pdf",
                    files_selectors=[FilesSelectors(filter="*", selectors=[])],
                )
            ],
        ),
        # download file from one subfolder
        (
            [("Test1/*", [])],
            [
                mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/"),
            ],
            [
                mock.call(
                    PosixPath("evidence_path/Test1"),
                    "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
                    "File1A.docx",
                    files_selectors=[FilesSelectors(filter="Test1/*", selectors=[])],
                ),
                mock.call(
                    PosixPath("evidence_path/Test1"),
                    "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
                    "File1B.docx",
                    files_selectors=[FilesSelectors(filter="Test1/*", selectors=[])],
                ),
            ],
        ),
        # download only certain file suffixes
        (
            [("Test1/*.docx", [])],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/")],
            [
                mock.call(
                    PosixPath("evidence_path/Test1"),
                    "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
                    "File1A.docx",
                    files_selectors=[FilesSelectors(filter="Test1/*.docx", selectors=[])],
                ),
                mock.call(
                    PosixPath("evidence_path/Test1"),
                    "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
                    "File1B.docx",
                    files_selectors=[FilesSelectors(filter="Test1/*.docx", selectors=[])],
                ),
            ],
        ),
        # download only certain matching file pattern
        (
            [("Test1/File*A.docx", [])],
            [mock.call("/sites/123456/Documents/fossid-tools-report-ok/Test1/")],
            [
                mock.call(
                    PosixPath("evidence_path/Test1"),
                    "/sites/123456/Documents/fossid-tools-report-ok/Test1/",
                    "File1A.docx",
                    files_selectors=[FilesSelectors(filter="Test1/File*A.docx", selectors=[])],
                )
            ],
        ),
    ],
)
def test_download_folders_with_folder_filter_expression_and_selectors(
    mocker, filter_expressions, expected_fetch_calls, expected_download_calls
):
    default_fetcher = SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "username",
        "password",
        list_title_property_map={
            "StatusList": "StatusTitle",
            "Workflow Status": "WorkflowStatus",
        },
        filter_config=[
            FilesSelectors(
                filter,
                selectors,
            )
            for (filter, selectors) in filter_expressions
        ],
    )

    # prevent creation of local directories
    mocker.patch("os.makedirs")

    # mock save_file
    mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.save_file"
    )

    # mock fetch_subfolders
    mocked_fetch_subfolders: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_subfolders"
    )

    def fetch_subfolders_mock(remote_path: str):
        if remote_path == "/sites/123456/Documents/fossid-tools-report-ok/":
            return [
                "/sites/123456/Documents/fossid-tools-report-ok/Test1",
                "/sites/123456/Documents/fossid-tools-report-ok/Test2",
            ]
        elif remote_path == "/sites/123456/Documents/fossid-tools-report-ok/Test1/":
            return ["/sites/123456/Documents/fossid-tools-report-ok/Test1/Test11"]
        else:
            return []

    mocked_fetch_subfolders.side_effect = fetch_subfolders_mock

    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )

    def get_file_properties_mock(relative_url: str, file_name: str) -> Dict[str, Any]:
        if file_name == "FileInRootFolder.pdf":
            return {"PropABC": "A", "Prop123": "1"}
        elif file_name == "File1A.docx":
            return {"PropABC": "A", "Prop123": "1"}
        elif file_name == "File1B.docx":
            return {"PropABC": "B", "Prop123": "1"}
        elif file_name == "File11.docx":
            return {"Prop123": "11"}
        elif file_name == "File2.docx":
            return {"Prop123": "2"}
        return {}

    mocked_connect_get_file_properties.return_value = get_file_properties_mock

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock download_file
    mocked_download_file = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._download_file"
    )
    mocked_download_file.return_value = True

    # mock fetch_files
    mocked_fetch_files: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_files"
    )

    def fetch_files_mock(remote_path: str):
        if remote_path == "/sites/123456/Documents/fossid-tools-report-ok/":
            return ["FileInRootFolder.pdf"]
        elif remote_path.endswith("/sites/123456/Documents/fossid-tools-report-ok/Test1/"):
            return ["File1A.docx", "File1B.docx"]
        elif remote_path.endswith(
            "/sites/123456/Documents/fossid-tools-report-ok/Test1/Test11/"
        ):
            return ["File11.docx"]
        elif remote_path.endswith("/sites/123456/Documents/fossid-tools-report-ok/Test2/"):
            return ["File2.docx"]
        return []

    mocked_fetch_files.side_effect = fetch_files_mock

    default_fetcher.download_folder()

    mocked_fetch_files.assert_has_calls(expected_fetch_calls)
    assert mocked_fetch_files.call_count == len(
        expected_fetch_calls
    ), f"There are extra calls in {mocked_fetch_files.call_args_list}"

    mocked_download_file.assert_has_calls(expected_download_calls)
    assert mocked_download_file.call_count == len(expected_download_calls)


def test_download_folders_with_folder_filter_expression_and_selectors_plus_last_modified(
    mocker, caplog
):
    default_fetcher = SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "username",
        "password",
        list_title_property_map={
            "StatusList": "StatusTitle",
            "Workflow Status": "WorkflowStatus",
        },
        filter_config=[
            FilesSelectors(
                "*.pdf",
                [Selector(property="PropABC", operator="equals", other_value="AB")],
                title="Some file title",
                onlyLastModified=True,
            )
        ],
    )

    # prevent creation of local directories
    mocker.patch("os.makedirs")

    # mock fetch_subfolders
    mocked_fetch_subfolders: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_subfolders"
    )
    mocked_fetch_subfolders.return_value = []

    # mock fetch_files
    mocked_fetch_files: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_files"
    )

    def fetch_files_mock(remote_path: str):
        if remote_path == "/sites/123456/Documents/fossid-tools-report-ok/":
            return ["FileA.pdf", "File B.pdf", "FileC.pdf", "FileD.pdf"]
        return []

    mocked_fetch_files.side_effect = fetch_files_mock

    # mock save_file
    mocked_save_file = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.save_file"
    )

    # mock unlink
    mocked_path_unlink: mock.Mock = mocker.patch.object(default_fetcher, "_unlink_local_file")

    # mock get_file_properties
    mocked_connect_get_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties"
    )

    def get_file_properties_mock(relative_url: str, file_name: str) -> Dict[str, Any]:
        if file_name == "FileA.pdf":
            return {"PropABC": "AB"}
        elif file_name == "File B.pdf":
            return {"PropABC": "AB"}
        elif file_name == "FileC.pdf":
            return {"PropABC": "C"}
        return {}

    mocked_connect_get_file_properties.side_effect = get_file_properties_mock

    # mock get_additional_file_properties
    mocked_connect_get_additional_file_properties = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    additional_property_response = (1, {"d": {"vti_x005f_filesize": 1}})
    mocked_connect_get_additional_file_properties.return_value = additional_property_response

    # mock get_file_property
    mocked_get_file_property = mocker.patch.object(
        default_fetcher._properties_reader, "get_file_property"
    )

    def get_file_property_mock(relative_url: str, property_name):
        assert property_name in ("PropABC", "Modified")
        if str(relative_url).endswith("FileA.pdf"):
            return {"PropABC": "AB", "Modified": "2020-08-10T00:00:00"}[property_name]
        if str(relative_url).endswith("File B.pdf"):
            return {"PropABC": "AB", "Modified": "2020-08-10T11:11:11"}[property_name]
        assert property_name == "PropABC"
        if str(relative_url).endswith("FileC.pdf"):
            return "C"
        return ""

    mocked_get_file_property.side_effect = get_file_property_mock

    # mock get_file_object
    mocked_get_file_object = mocker.patch.object(default_fetcher._connect, "get_file_object")
    mocked_get_file_object.return_value = ""

    default_fetcher.download_folder()

    # if 'File A' in captured.out:
    assert (
        f"Some file title: <{default_fetcher._sharepoint_site}/{default_fetcher._sharepoint_dir}File%20B.pdf>"
        in caplog.text
    )

    mocked_save_file.assert_has_calls(
        [
            mock.call(
                PosixPath("evidence_path"),
                "FileA.pdf.__properties__.json",
                '{\n  "PropABC": "AB"\n}',
                True,
            ),
            mock.call(PosixPath("evidence_path"), "FileA.pdf", "", False),
            mock.call(
                PosixPath("evidence_path"),
                "File B.pdf.__properties__.json",
                '{\n  "PropABC": "AB"\n}',
                True,
            ),
            mock.call(PosixPath("evidence_path"), "File B.pdf", "", False),
            mock.call(
                PosixPath("evidence_path"),
                "FileC.pdf.__properties__.json",
                '{\n  "PropABC": "C"\n}',
                True,
            ),
            mock.call(
                PosixPath("evidence_path"),
                "FileD.pdf.__properties__.json",
                "{}",
                True,
            ),
        ]
    )

    mocked_path_unlink.assert_has_calls(
        [
            mock.call(PosixPath("evidence_path/FileC.pdf.__properties__.json")),
            mock.call(PosixPath("evidence_path/FileD.pdf.__properties__.json")),
            mock.call(PosixPath("evidence_path/FileA.pdf")),
        ],
    )


def test_download_folders_with_file_filters_and_partial_matches_on_comment_message(
    requests_mock, mocker, caplog
):
    default_fetcher = SharepointFetcherOnPremise(
        "Documents/fossid-tools-report-ok/",
        Path("evidence_path"),
        "https://some.server/sites/123456/",
        "username",
        "password",
        list_title_property_map={
            "StatusList": "StatusTitle",
            "Workflow Status": "WorkflowStatus",
        },
        filter_config=[
            FilesSelectors(
                "*.xls",
                [],
                onlyLastModified=False,
            ),
            FilesSelectors(
                "*.pdf",
                [],
                onlyLastModified=True,
            ),
        ],
    )

    # prevent creation of local directories
    mocker.patch("os.makedirs")
    mocker.patch("os.listdir")
    mocker.patch("shutil.rmtree")

    # mock fetch_subfolders
    mocked_fetch_subfolders: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_subfolders"
    )
    mocked_fetch_subfolders.return_value = []

    # mock fetch_files
    mocked_fetch_files: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._fetch_files"
    )

    def fetch_files_mock(remote_path: str):
        if remote_path == "/sites/123456/Documents/fossid-tools-report-ok/":
            return ["FileA.pdf", "FileB.pdf", "FileC.pdf", "FileD.pdf"]
        return []

    mocked_fetch_files.side_effect = fetch_files_mock

    # mock save_file
    mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.save_file"
    )

    # mock unlink
    mocker.patch.object(default_fetcher, "_unlink_local_file")

    # mock get_file_properties
    mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_file_properties",
        return_value={},
    )

    # mock get_file_property
    mocker.patch.object(
        default_fetcher._properties_reader, "get_file_property", return_value=""
    )

    # mock get_additional_file_properties
    mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties",
        return_value=(1234, {"d": {"vti_x005f_filesize": 1234}}),
    )

    # mock get_file_object
    mocker.patch.object(default_fetcher._connect, "get_file_object", return_value="")

    default_fetcher.download_folder()
    assert "Some file filters for `<root path>` didn't match any file!" in caplog.text
    assert "Those filters were: FilesSelector(filter: `*.xls`, selectors: [])" in caplog.text


# TODO: add test for downloading from folder with file property selectors
# TODO: and with invalid selectors (like invalid property names, etc.)


def test_download_custom_property_definitions(
    default_fetcher: SharepointFetcherOnPremise, mocker
):
    expected_json_data = {
        "StatusList": {
            "1": "Valid",
            "2": "Draft",
        },
        "Workflow Status": {
            "1": "History",
            "2": "No workflow",
        },
    }

    mocked_verify_site_lists: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.verify_site_lists"
    )
    mocked_verify_site_lists.return_value = ["StatusList", "Workflow Status"]

    mocked_get_items_for_list: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_items_for_list"
    )
    mocked_get_items_for_list.side_effect = [
        {1: "Valid", 2: "Draft"},
        {1: "History", 2: "No workflow"},
    ]

    mocked_open = mock.mock_open()
    with mock.patch("builtins.open", mocked_open):
        default_fetcher.download_custom_property_definitions()

    mocked_verify_site_lists.assert_called_once()
    assert mocked_get_items_for_list.call_count == 2

    output_path = default_fetcher._destination_path
    property_definitions_filename = (
        SharepointFetcherOnPremise.custom_property_definitions_filename
    )
    mocked_open.assert_called_with(
        Path.cwd() / output_path / property_definitions_filename, "wb"
    )
    handle = mocked_open()
    written_json_data = json.loads(handle.write.call_args.args[0])
    assert expected_json_data == written_json_data


def test_download_custom_property_definitions_with_invalid_list_data(
    default_fetcher: SharepointFetcherOnPremise, mocker
):
    expected_json_data = {
        "StatusList": {
            "1": "Valid",
            "2": "Draft",
        },
    }

    mocked_verify_site_lists: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.verify_site_lists"
    )
    mocked_verify_site_lists.return_value = ["StatusList", "Workflow Status"]

    mocked_get_items_for_list: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect.get_items_for_list"
    )

    def mocked_return_items_for_list(list_title, list_item_title_property):
        if list_title == "StatusList":
            assert list_item_title_property == "StatusTitle"
            return {1: "Valid", 2: "Draft"}
        else:
            raise KeyError()

    mocked_get_items_for_list.side_effect = mocked_return_items_for_list

    mocked_open = mock.mock_open()
    with mock.patch("builtins.open", mocked_open):
        default_fetcher.download_custom_property_definitions()

    mocked_verify_site_lists.assert_called_once()
    assert mocked_get_items_for_list.call_count == 2

    output_path = default_fetcher._destination_path
    property_definitions_filename = (
        SharepointFetcherOnPremise.custom_property_definitions_filename
    )
    mocked_open.assert_called_with(
        Path.cwd() / output_path / property_definitions_filename, "wb"
    )
    handle = mocked_open()
    written_json_data = json.loads(handle.write.call_args.args[0])
    assert expected_json_data == written_json_data


def test_generate_filters_and_selectors(requests_mock):
    filter_config = [FilesSelectors("Folder1/*.docx", [])]
    (
        folder_filters,
        files_selectors,
    ) = SharepointFetcherOnPremise._generate_filters_and_selectors(
        requests_mock, filter_config
    )
    assert folder_filters == ["Folder1/"]
    assert files_selectors == {"Folder1/": filter_config}


def test_generate_filters_and_selectors_with_duplicate_folders(requests_mock):
    filter_config = [
        FilesSelectors("Folder1/*.docx", []),
        FilesSelectors("Folder1/*.pdf", []),
    ]
    (
        folder_filters,
        files_selectors,
    ) = SharepointFetcherOnPremise._generate_filters_and_selectors(
        requests_mock, filter_config
    )
    assert folder_filters == ["Folder1/"]
    assert files_selectors == {"Folder1/": filter_config}
