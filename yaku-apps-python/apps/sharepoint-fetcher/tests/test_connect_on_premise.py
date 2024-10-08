import json
import re
from unittest import mock
from urllib.parse import quote

import pytest
import requests
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.sharepoint_fetcher.on_premise.connect import Connect


@pytest.fixture
def connect():
    return Connect("https://some.sharepoint.server/sites/123456/", "username", "password")


def test_initial_value():
    url = "https://sharepoint.com"
    connect = Connect(url, "username", "password")
    assert connect._sharepoint_site == url
    assert connect._session.headers == {"Accept": "application/json;odata=verbose"}


def test_force_ip(mocker):
    connect = Connect(
        "https://some.sharepoint.server/sites/123456/",
        "username",
        "password",
        force_ip="10.0.0.1",
    )

    mocked_get_additional_file_properties: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    mocked_get_file_size_from_properties: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_file_size_from_properties"
    )
    response_properties = {"d": {"vti_x005f_filesize": 0}}
    mocked_get_additional_file_properties.return_value = mock.Mock(content=response_properties)
    mocked_get_file_size_from_properties.return_value = 0

    mocked_get_request: mock.MagicMock = mocker.patch.object(connect._session, "get")
    connect.get_file_object("/sites/123456", "File.txt")

    mocked_get_request.assert_called_with(
        "https://10.0.0.1/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/File.txt')/$value",
        headers={"Host": "some.sharepoint.server"},
        verify=False,
    )


def test_exchange_hostname_by_forced_ip_address(connect: Connect):
    url = "https://foo.bar/path/to/somewhere?foo=foo.bar"
    connect._force_ip = "127.0.0.1"
    url, host = connect._exchange_hostname_by_forced_ip_address(url)

    assert url == "https://127.0.0.1/path/to/somewhere?foo=foo.bar"
    assert host == "foo.bar"


def test_missing_trailing_slash_in_url():
    url = "https://sharepoint.com/"
    connect = Connect(url, "username", "password")
    assert connect._sharepoint_site == url[:-1]


def test_get_paginated_results(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.fake.url",
        status_code=200,
        json={
            "d": {
                "results": [{"File": "A.txt"}],
                "__next": "https://some.fake.url?page=2",
            }
        },
    )
    requests_mock.get(
        "https://some.fake.url?page=2",
        status_code=200,
        json={"d": {"results": [{"File": "B.txt"}]}},
    )

    result = connect._get_paginated_results("https://some.fake.url")

    assert len(result) == 2
    assert result[0] == {"File": "A.txt"}
    assert result[1] == {"File": "B.txt"}


def test_check_folder_access_and_presence_with_401(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')",
        status_code=401,
        json={"res": "Unauthorized access!"},
    )

    url_path = "/sites/123456/test"

    with pytest.raises(AutopilotConfigurationError):
        connect.check_folder_access_and_presence(url_path, url_path)

    assert requests_mock.call_count == 1
    requested_url = requests_mock.last_request.url
    assert url_path in requested_url


def test_check_folder_access_and_presence_with_403(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')",
        status_code=403,
        json={"res": "Forbidden!"},
    )

    url_path = "/sites/123456/test"
    with pytest.raises(AutopilotConfigurationError):
        connect.check_folder_access_and_presence(url_path, url_path)
    assert requests_mock.call_count == 1
    requested_url = requests_mock.last_request.url
    assert url_path in requested_url


def test_check_folder_access_and_presence_with_500(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')",
        status_code=500,
        json={"res": "Internal server error!"},
    )

    url_path = "/sites/123456/test"
    assert connect.check_folder_access_and_presence(url_path, url_path) is True


def test_check_folder_access_and_presence_not_exists(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')",
        status_code=200,
        json={"d": ["_meta"]},
    )

    assert (
        connect.check_folder_access_and_presence("/sites/123456/test", "/sites/123456/test")
        is True
    )


def test_check_folder_access_and_presence_parent_exists(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')",
        status_code=200,
        json={"d": ["_meta", {"Files": ["a", "b"]}]},
    )
    parent_folder = "/sites/123456/test"
    relative_url = "/sites/123456/test/subfolder"
    match = f"The directory {parent_folder} exists and can be accessed, but {relative_url} leads to a non-existing directory! One reason could be that the directory does not exist or you do not have permissions to access that directory path!"
    regex = re.escape(match)
    with pytest.raises(AutopilotError, match=regex):
        connect.check_folder_access_and_presence(parent_folder, relative_url)


def test_check_folder_access_and_presence_authorized(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')",
        status_code=200,
        json={"d": ["_meta", {"Files": ["a", "b"]}]},
    )

    assert (
        connect.check_folder_access_and_presence("/sites/123456/test", "/sites/123456/test")
        is None
    )


def test_check_folder_access_and_presence_with_invalid_json_response(
    mocker: mock.Mock, connect: Connect
):
    mocked_get_request: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get"
    )

    mocked_get_request.return_value = mocker.Mock()
    mocked_get_request.return_value.text = (
        "<html><body><h1>Error: something went wrong</h1></body></html>"
    )
    mocked_get_request.return_value.json.side_effect = requests.exceptions.JSONDecodeError(
        "msg", "doc", 0
    )

    with pytest.raises(RuntimeError, match="<h1>Error: something went wrong</h1>"):
        connect.check_folder_access_and_presence("/sites/123456/test", "/sites/123456/test")


def test_get_folders(requests_mock, connect: Connect):
    response = {"d": {"results": [{"Title": "SomeFolder"}]}}
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')/folders",
        json=response,
        status_code=200,
    )

    assert connect.get_folders("/sites/123456/test") == response["d"]["results"]

    assert requests_mock.call_count == 1
    requested_url = requests_mock.last_request.url
    assert "/_api/web/GetFolder" in requested_url
    assert requested_url.endswith("/folders")


def test_get_files(requests_mock, connect: Connect):
    response = {"d": {"results": [{"Title": "SomeFile.docx", "Modified": "never"}]}}
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')/files",
        json=response,
        status_code=200,
    )

    assert connect.get_files("/sites/123456/test") == response["d"]["results"]

    assert requests_mock.call_count == 1
    requested_url = requests_mock.last_request.url
    assert "/_api/web/GetFolder" in requested_url
    assert requested_url.endswith("/files")


def test_get_files_with_paginated_results(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/test')/files",
        json={
            "d": {
                "results": [{"Title": "SomeFile.docx"}],
                "__next": "https://some.fake.url/to/page/2",
            }
        },
        status_code=200,
    )

    requests_mock.get(
        "https://some.fake.url/to/page/2",
        json={"d": {"results": [{"Title": "SecondFile.docx"}]}},
        status_code=200,
    )

    assert connect.get_files("/sites/123456/test") == [
        {"Title": "SomeFile.docx"},
        {"Title": "SecondFile.docx"},
    ]

    assert requests_mock.call_count == 2
    second_requested_url = requests_mock.last_request.url
    assert second_requested_url == "https://some.fake.url/to/page/2"


def test_get_file_object(mocker, connect: Connect):
    mocked_get_request: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get"
    )
    mocked_get_additional_file_properties: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_additional_file_properties"
    )
    mocked_get_file_size_from_properties: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get_file_size_from_properties"
    )
    byte = b"0x0x0xf2d2"
    response = {"content": byte}
    response_properties = {"d": {"vti_x005f_filesize": 1}}
    mocked_get_request.return_value = mock.Mock(content=response)
    mocked_get_additional_file_properties.return_value = mock.Mock(content=response_properties)
    mocked_get_file_size_from_properties.return_value = 1

    assert connect.get_file_object("/sites/123456/test", "test3") == response

    assert mocked_get_request.call_count == 1
    requested_url = mocked_get_request.call_args.args[0]
    assert "/_api/web/GetFile" in requested_url
    assert requested_url.endswith("/$value")


def test_get_file_properties(mocker, connect: Connect):
    mocked_get_request: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get"
    )
    response = {
        "d": {
            "__metadata": {
                "id": "d430a23d-4c6c-4d27-969f-4268232639f6",
                "uri": "https://some.server/sites/144287/_api/Web/Lists(guid'f884354b-e050-4a49-a36e-5361e3dc48a6')/Items(4973)",
                "etag": '"3"',
                "type": "SP.Data.DocumentsItem",
            },
            "Versions": {
                "__deferred": {
                    "uri": "https://some.server/sites/144287/_api/Web/Lists(guid'f884354b-e050-4a49-a36e-5361e3dc48a6')/Items(4973)/Versions"
                }
            },
            "ContentTypeId": "0x01010079C2150534271841997CA4BF28B151E90100307EA83ED42A584099D189C52F07585A",
            "Title": None,
            "URL": None,
            "CSC": "2",
            "ASC": "2",
            "ISC": "3",
            "ILMItemType": "ConceptualItem",
            "ILMRevision": None,
            "ID": 4973,
            "AuthorId": 1690,
            "Modified": "2022-06-08T15:10:56",
            "OData__UIVersionString": "2.0",
            "GUID": "8503c0e2-f541-4d7d-93cb-2a2453aae191",
        }
    }
    mocked_get_request.return_value = mock.Mock(
        content=json.dumps(response), json=lambda: response
    )

    assert connect.get_file_properties("/sites/123456/test", "test3") == response["d"]

    assert mocked_get_request.call_count == 1
    requested_url = mocked_get_request.call_args.args[0]
    assert "/_api/web/GetFile" in requested_url


def test_get_additional_file_properties(mocker, connect: Connect):
    mocked_get_request: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get"
    )

    response = {
        "d": {
            "__metadata": {
                "id": "https://some.server/sites/175012/_api/web/GetFileByServerRelativeUrl('/sites/123456/test/test3')/Properties",
                "uri": "https://some.server/sites/175012/_api/web/GetFileByServerRelativeUrl('/sites/123456/test/test3')/Properties",
                "type": "SP.PropertyValues",
            },
            "vti_x005f_filesize": 1234,
        }
    }

    mocked_get_request.return_value = mock.Mock(
        content=json.dumps(response), json=lambda: response
    )

    json_response = connect._get_additional_file_properties("/sites/123456/test", "test3")
    assert json_response == response["d"]

    assert mocked_get_request.call_count == 1
    requested_url = mocked_get_request.call_args.args[0]
    assert "/Properties" in requested_url


@pytest.mark.parametrize("must_have_items", [(False,), (True,)])
def test_get_site_lists(mocker, connect: Connect, must_have_items):
    mocked_get_request: mock.MagicMock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.connect.Connect._get"
    )
    response = {
        "d": {
            "results": [
                {
                    "ItemCount": 0,
                    "Title": "emptyList",
                },
                {
                    "ItemCount": 4,
                    "Title": "ListWithFourItems",
                },
                {
                    "ItemCount": 18,
                    "Title": "List with 18 items",
                },
                {
                    "ItemCount": 0,
                    "Title": "Empty List",
                },
            ]
        }
    }
    mocked_get_request.return_value = mock.Mock(
        content=json.dumps(response), json=lambda: response
    )

    assert connect.verify_site_lists(
        titles=["emptyList", "ListWithFourItems", "List with 18 items"],
        must_have_items=must_have_items,
    ) == [
        r["Title"]
        for r in response["d"]["results"]
        if (not must_have_items or r["ItemCount"] > 0)
    ]

    assert mocked_get_request.call_count == 1
    requested_url = mocked_get_request.call_args.args[0]
    assert requested_url.endswith("/_api/web/Lists")


def test_get_site_lists_with_paginated_results(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/Lists",
        json={
            "d": {
                "results": [
                    {"ItemCount": 1, "Title": "FirstItem"},
                ],
                "__next": "https://some.fake.url/to/next/page",
            }
        },
    )
    requests_mock.get(
        "https://some.fake.url/to/next/page",
        json={
            "d": {
                "results": [
                    {"ItemCount": 1, "Title": "SecondItem"},
                ],
            }
        },
    )

    assert connect.verify_site_lists(
        titles=["FirstItem", "SecondItem"],
    ) == ["FirstItem", "SecondItem"]

    assert requests_mock.call_count == 2
    requested_second_url = requests_mock.last_request.url
    assert requested_second_url == ("https://some.fake.url/to/next/page")


def test_get_items_for_list(requests_mock, connect: Connect):
    response = {
        "d": {
            "results": [
                {
                    "Id": 24,
                    "RevisionStatus": "Valid",
                },
                {
                    "Id": 25,
                    "RevisionStatus": "Invalid",
                },
                {
                    "Id": 26,
                    "RevisionStatus": "Invalid",
                },
                {
                    "Id": 27,
                    "RevisionStatus": "Valid",
                },
                {
                    "Id": 28,
                    "RevisionStatus": "Invalid",
                },
                {
                    "Id": 29,
                    "RevisionStatus": "Invalid",
                },
                {
                    "Id": 30,
                    "RevisionStatus": "Draft",
                },
                {
                    "Id": 31,
                    "RevisionStatus": "Draft",
                },
                {
                    "Id": 32,
                    "RevisionStatus": "Valid",
                },
                {
                    "Id": 33,
                    "RevisionStatus": "Valid",
                },
                {
                    "Id": 34,
                    "RevisionStatus": "Invalid",
                },
                {
                    "Id": 35,
                    "RevisionStatus": "Invalid",
                },
            ]
        }
    }

    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/Lists/GetByTitle('Revision%20Status')/items",
        json=response,
    )

    list_title = "Revision Status"
    list_item_title_property = "RevisionStatus"
    assert connect.get_items_for_list(list_title, list_item_title_property) == {
        24: "Valid",
        25: "Invalid",
        26: "Invalid",
        27: "Valid",
        28: "Invalid",
        29: "Invalid",
        30: "Draft",
        31: "Draft",
        32: "Valid",
        33: "Valid",
        34: "Invalid",
        35: "Invalid",
    }

    assert requests_mock.call_count == 1
    requested_url = requests_mock.last_request.url
    assert "/_api/web/Lists/GetByTitle" in requested_url
    assert quote(list_title) in requested_url
    assert requested_url.endswith("/items")


def test_get_items_for_list_with_paginated_results(requests_mock, connect: Connect):
    requests_mock.get(
        "https://some.sharepoint.server/sites/123456/_api/web/Lists/GetByTitle('Revision%20Status')/items",
        json={
            "d": {
                "results": [
                    {
                        "Id": 1,
                        "RevisionStatus": "Valid",
                    },
                ],
                "__next": "https://some.fake.url/to/page/2",
            }
        },
    )
    requests_mock.get(
        "https://some.fake.url/to/page/2",
        json={
            "d": {
                "results": [
                    {
                        "Id": 2,
                        "RevisionStatus": "Invalid",
                    },
                ]
            }
        },
    )

    list_title = "Revision Status"
    list_item_title_property = "RevisionStatus"
    assert connect.get_items_for_list(list_title, list_item_title_property) == {
        1: "Valid",
        2: "Invalid",
    }

    assert requests_mock.call_count == 2
    requested_second_url = requests_mock.last_request.url
    assert "https://some.fake.url/to/page/2" == requested_second_url
