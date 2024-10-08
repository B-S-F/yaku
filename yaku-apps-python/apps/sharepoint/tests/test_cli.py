import os
from pathlib import Path
from unittest import mock

from click.testing import CliRunner
from yaku.sharepoint.cli import upload_files, upload_folder


@mock.patch.dict(
    os.environ,
    {
        "SHAREPOINT_PROJECT_SITE": "https://company.sharepoint.com/sites/123456/",
        "SHAREPOINT_USERNAME": "username",
        "SHAREPOINT_PASSWORD": "password",
        "SHAREPOINT_FORCE_IP": "",
    },
)
def test_upload_single_file(mocker, requests_mock):
    file_name = "test.txt"
    mocked_file_path = mocker.patch("pathlib.Path.is_file", return_value=True)
    mocked_file_content = mocker.patch("pathlib.Path.read_bytes", return_value=b"test")
    mocked_post_form_digest_value = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/contextinfo",
        json={"d": {"GetContextWebInformation": {"FormDigestValue": "test"}}},
    )
    mocked_post_upload_file = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents')/Files/add(url='{file_name}',overwrite=false)",
        json={"FormDigestValue": "test"},
    )
    output = CliRunner().invoke(
        upload_files, ["--file", file_name, "--sharepoint-path", "Documents"]
    )
    assert output.exit_code == 0
    assert mocked_file_path.called
    assert mocked_file_content.called
    assert mocked_post_form_digest_value.called
    assert mocked_post_upload_file.called
    assert mocked_post_upload_file.last_request.headers["X-RequestDigest"] == "test"
    assert mocked_post_upload_file.last_request.headers["Content-Length"] == "4"
    assert mocked_post_upload_file.last_request.body == b"test"


@mock.patch.dict(
    os.environ,
    {
        "SHAREPOINT_PROJECT_SITE": "https://company.sharepoint.com/sites/123456/",
        "SHAREPOINT_USERNAME": "username",
        "SHAREPOINT_PASSWORD": "password",
        "SHAREPOINT_FORCE_IP": "",
    },
)
def test_upload_single_file_with_sharepoint_path(mocker, requests_mock):
    file_name = "test.txt"
    mocked_file_path = mocker.patch("pathlib.Path.is_file", return_value=True)
    mocked_file_content = mocker.patch("pathlib.Path.read_bytes", return_value=b"test")
    mocked_post_form_digest_value = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/contextinfo",
        json={"d": {"GetContextWebInformation": {"FormDigestValue": "test"}}},
    )
    mocked_post_upload_file = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents/are/here')/Files/add(url='{file_name}',overwrite=false)",
        json={"FormDigestValue": "test"},
    )
    output = CliRunner().invoke(
        upload_files, ["--file", file_name, "--sharepoint-path", "Documents/are/here"]
    )
    assert output.exit_code == 0
    assert mocked_file_path.called
    assert mocked_file_content.called
    assert mocked_post_form_digest_value.called
    assert mocked_post_upload_file.called
    assert mocked_post_upload_file.last_request.headers["X-RequestDigest"] == "test"
    assert mocked_post_upload_file.last_request.headers["Content-Length"] == "4"
    assert mocked_post_upload_file.last_request.body == b"test"


@mock.patch.dict(
    os.environ,
    {
        "SHAREPOINT_PROJECT_SITE": "https://company.sharepoint.com/sites/123456/",
        "SHAREPOINT_USERNAME": "username",
        "SHAREPOINT_PASSWORD": "password",
        "SHAREPOINT_FORCE_IP": "",
    },
)
def test_upload_single_file_with_force(mocker, requests_mock):
    file_name = "test.txt"
    mocked_file_path = mocker.patch("pathlib.Path.is_file", return_value=True)
    mocked_file_content = mocker.patch("pathlib.Path.read_bytes", return_value=b"test")
    mocked_post_form_digest_value = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/contextinfo",
        json={"d": {"GetContextWebInformation": {"FormDigestValue": "test"}}},
    )
    mocked_post_upload_file = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents')/Files/add(url='{file_name}',overwrite=true)",
        json={"FormDigestValue": "test"},
    )
    output = CliRunner().invoke(
        upload_files, ["--file", file_name, "--sharepoint-path", "Documents", "--force"]
    )
    assert output.exit_code == 0
    assert mocked_file_path.called
    assert mocked_file_content.called
    assert mocked_post_form_digest_value.called
    assert mocked_post_upload_file.called
    assert mocked_post_upload_file.last_request.headers["X-RequestDigest"] == "test"
    assert mocked_post_upload_file.last_request.headers["Content-Length"] == "4"
    assert mocked_post_upload_file.last_request.body == b"test"


@mock.patch.dict(
    os.environ,
    {
        "SHAREPOINT_PROJECT_SITE": "https://company.sharepoint.com/sites/123456/",
        "SHAREPOINT_USERNAME": "username",
        "SHAREPOINT_PASSWORD": "password",
        "SHAREPOINT_FORCE_IP": "",
    },
)
def test_upload_multiple_files(mocker, requests_mock):
    file_name_1 = "test1.txt"
    file_name_2 = "test2.txt"
    mocked_file_path = mocker.patch("pathlib.Path.is_file", return_value=True)
    mocked_file_content = mocker.patch("pathlib.Path.read_bytes", return_value=b"test")
    mocked_post_form_digest_value = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/contextinfo",
        json={"d": {"GetContextWebInformation": {"FormDigestValue": "test"}}},
    )
    mocked_post_upload_file = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents')/Files/add(url='{file_name_1}',overwrite=false)",
        json={"FormDigestValue": "test"},
    )
    mocked_post_upload_file = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents')/Files/add(url='{file_name_2}',overwrite=false)",
        json={"FormDigestValue": "test"},
    )
    output = CliRunner().invoke(
        upload_files,
        ["--file", file_name_1, "--file", file_name_2, "--sharepoint-path", "Documents"],
    )
    assert output.exit_code == 0
    assert mocked_file_path.called
    assert mocked_file_content.called
    assert mocked_post_form_digest_value.called
    assert mocked_post_upload_file.called
    assert mocked_post_upload_file.last_request.headers["X-RequestDigest"] == "test"
    assert mocked_post_upload_file.last_request.headers["Content-Length"] == "4"
    assert mocked_post_upload_file.last_request.body == b"test"


@mock.patch.dict(
    os.environ,
    {
        "SHAREPOINT_PROJECT_SITE": "https://company.sharepoint.com/sites/123456/",
        "SHAREPOINT_USERNAME": "username",
        "SHAREPOINT_PASSWORD": "password",
        "SHAREPOINT_FORCE_IP": "",
    },
)
def test_upload_empty_folder(mocker, requests_mock):
    folder_name = "test"
    mocked_is_dir = mocker.patch("pathlib.Path.is_dir")
    mocked_iterdir = mocker.patch("pathlib.Path.iterdir")
    mocked_is_dir.side_effect = [True]
    mocked_iterdir.side_effect = [[]]
    mocked_post_form_digest_value = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/contextinfo",
        json={"d": {"GetContextWebInformation": {"FormDigestValue": "test"}}},
    )
    mocked_post_folder = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/web/folders",
        json={"FormDigestValue": "test"},
        status_code=201,
    )
    output = CliRunner().invoke(upload_folder, [folder_name, "--sharepoint-path", "Documents"])
    print(output)
    assert output.exit_code == 0
    assert mocked_is_dir.called
    assert mocked_iterdir.called
    assert mocked_post_form_digest_value.called
    assert mocked_post_folder.called
    assert mocked_post_folder.last_request.headers["X-RequestDigest"] == "test"
    assert (
        mocked_post_folder.last_request.body
        == "{'__metadata': {'type': 'SP.Folder'},'ServerRelativeUrl': 'Documents/test'}"
    )
    assert (
        mocked_post_folder.last_request.headers["Content-Type"]
        == "application/json;odata=verbose"
    )


@mock.patch.dict(
    os.environ,
    {
        "SHAREPOINT_PROJECT_SITE": "https://company.sharepoint.com/sites/123456/",
        "SHAREPOINT_USERNAME": "username",
        "SHAREPOINT_PASSWORD": "password",
        "SHAREPOINT_FORCE_IP": "",
    },
)
def test_upload_folder_with_files(mocker, requests_mock):
    folder_name = "test"
    file_name_1 = "test1.txt"
    file_name_2 = "test2.txt"
    mocked_folder_path = mocker.patch("pathlib.Path.is_dir")
    mocked_iterdir = mocker.patch("pathlib.Path.iterdir")
    mocked_is_file = mocker.patch("pathlib.Path.is_file")
    mocked_file_content = mocker.patch("pathlib.Path.read_bytes")
    mocked_folder_path.side_effect = [True]
    mocked_iterdir.side_effect = [[Path(file_name_1), Path(file_name_2)]]
    mocked_is_file.side_effect = [True, True, True, True]
    mocked_file_content.side_effect = [b"test", b"test"]
    mocked_post_form_digest_value = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/contextinfo",
        json={"d": {"GetContextWebInformation": {"FormDigestValue": "test"}}},
    )
    mocked_post_folder = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/web/folders",
        json={"FormDigestValue": "test"},
        status_code=201,
    )
    mocked_post_file_1 = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents/test')/Files/add(url='{file_name_1}',overwrite=false)",
        json={"FormDigestValue": "test"},
    )
    mocked_post_file_2 = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents/test')/Files/add(url='{file_name_2}',overwrite=false)",
        json={"FormDigestValue": "test"},
    )
    output = CliRunner().invoke(upload_folder, [folder_name, "--sharepoint-path", "Documents"])
    assert output.exit_code == 0
    assert mocked_post_folder.call_count == 1
    assert mocked_post_file_1.call_count == 1
    assert mocked_post_file_2.call_count == 1
    assert mocked_post_form_digest_value.call_count == 3
    assert mocked_post_folder.last_request.headers["X-RequestDigest"] == "test"
    assert (
        mocked_post_folder.last_request.body
        == "{'__metadata': {'type': 'SP.Folder'},'ServerRelativeUrl': 'Documents/test'}"
    )
    assert (
        mocked_post_folder.last_request.headers["Content-Type"]
        == "application/json;odata=verbose"
    )
    assert mocked_post_file_1.last_request.headers["X-RequestDigest"] == "test"
    assert mocked_post_file_1.last_request.headers["Content-Length"] == "4"
    assert mocked_post_file_1.last_request.body == b"test"
    assert mocked_post_file_2.last_request.headers["X-RequestDigest"] == "test"
    assert mocked_post_file_2.last_request.headers["Content-Length"] == "4"
    assert mocked_post_file_2.last_request.body == b"test"


@mock.patch.dict(
    os.environ,
    {
        "SHAREPOINT_PROJECT_SITE": "https://company.sharepoint.com/sites/123456/",
        "SHAREPOINT_USERNAME": "username",
        "SHAREPOINT_PASSWORD": "password",
        "SHAREPOINT_FORCE_IP": "",
    },
)
def test_upload_folder_with_nested_structure(mocker, requests_mock):
    folder_name_1 = "test"
    folder_name_2 = "test2"
    file_name_1 = "test1.txt"
    file_name_2 = "test2.txt"
    mocked_is_dir = mocker.patch("pathlib.Path.is_dir")
    mocked_iterdir = mocker.patch("pathlib.Path.iterdir")
    mocked_is_file = mocker.patch("pathlib.Path.is_file")
    mocked_file_content = mocker.patch("pathlib.Path.read_bytes")
    mocked_is_dir.side_effect = [True, True]
    mocked_iterdir.side_effect = [
        [Path(file_name_1), Path(folder_name_2)],
        [Path(file_name_2)],
    ]
    mocked_is_file.side_effect = [True, True, False, True, True]
    mocked_file_content.side_effect = [b"test", b"test"]
    mocked_post_form_digest_value = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/contextinfo",
        json={"d": {"GetContextWebInformation": {"FormDigestValue": "test"}}},
    )
    mocked_post_folder = requests_mock.post(
        "https://company.sharepoint.com/sites/123456/_api/web/folders",
        json={"FormDigestValue": "test"},
        status_code=201,
    )
    mocked_post_file_1 = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents/test')/Files/add(url='{file_name_1}',overwrite=false)",
        json={"FormDigestValue": "test"},
    )
    mocked_post_file_2 = requests_mock.post(
        f"https://company.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('Documents/test/test2')/Files/add(url='{file_name_2}',overwrite=false)",
        json={"FormDigestValue": "test"},
    )
    output = CliRunner().invoke(
        upload_folder, [folder_name_1, "--sharepoint-path", "Documents"]
    )
    assert output.exit_code == 0
    assert mocked_post_folder.call_count == 2
    assert mocked_post_file_1.call_count == 1
    assert mocked_post_file_2.call_count == 1
    assert mocked_post_form_digest_value.call_count == 4
    assert mocked_post_folder.last_request.headers["X-RequestDigest"] == "test"
    assert (
        mocked_post_folder.last_request.body
        == "{'__metadata': {'type': 'SP.Folder'},'ServerRelativeUrl': 'Documents/test/test2'}"
    )
    assert (
        mocked_post_folder.last_request.headers["Content-Type"]
        == "application/json;odata=verbose"
    )
    assert mocked_post_file_1.last_request.headers["X-RequestDigest"] == "test"
    assert mocked_post_file_1.last_request.headers["Content-Length"] == "4"
    assert mocked_post_file_1.last_request.body == b"test"
    assert mocked_post_file_2.last_request.headers["X-RequestDigest"] == "test"
    assert mocked_post_file_2.last_request.headers["Content-Length"] == "4"
    assert mocked_post_file_2.last_request.body == b"test"
