from pathlib import Path
from unittest import mock

import pytest
from pydantic import ValidationError
from requests import Response
from requests.exceptions import HTTPError
from yaku.sharepoint.client.sharepoint import Settings, SharepointClient

valid_connect_config = Settings(
    sharepoint_project_site="https://my.sharepoint.com",
    username="username",
    password="password",
    force_ip=None,
)


class TestSharepointInit:
    def test_invalid_url(self):
        """Test init with wrong sharepoint config."""
        with pytest.raises(ValidationError):
            SharepointClient(
                Settings(
                    sharepoint_project_site="invalid_url",
                    username="username",
                    password="password",
                )
            )

        with pytest.raises(ValidationError):
            SharepointClient(
                Settings(sharepoint_project_site="", username="username", password="password")
            )

    def test_invalid_force_ip(self):
        """Test init with wrong sharepoint config."""
        with pytest.raises(ValidationError):
            SharepointClient(
                Settings(
                    sharepoint_project_site="https://my.sharepoint.com",
                    username="username",
                    password="password",
                    force_ip="invalid_force_ip",
                )
            )

    def test_valid_config(self):
        """Test init with wrong sharepoint path."""
        assert SharepointClient(valid_connect_config) is not None


class TestFormDigestValue:
    def test_all_working(self, mocker):
        """Test _get_form_digest_value."""
        client = SharepointClient(valid_connect_config)
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 200
        mocked_post_request.return_value.content = b"test"
        mocked_post_request.return_value.json.return_value = {
            "d": {"GetContextWebInformation": {"FormDigestValue": "test"}}
        }
        assert client._get_form_digest_value() == "test"
        assert mocked_post_request.call_count == 1
        assert (
            mocked_post_request.call_args[0][0] == "https://my.sharepoint.com/_api/contextinfo"
        )
        assert (
            mocked_post_request.call_args[1]["headers"]["Accept"]
            == "application/json;odata=verbose"
        )

    def test_handles_exception(self, mocker):
        """Test _get_form_digest_value."""
        client = SharepointClient(valid_connect_config)
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.side_effect = HTTPError("test")
        with pytest.raises(HTTPError) as excinfo:
            client._get_form_digest_value()
        assert str(excinfo.value) == "test"
        assert mocked_post_request.call_count == 1
        assert (
            mocked_post_request.call_args[0][0] == "https://my.sharepoint.com/_api/contextinfo"
        )
        assert (
            mocked_post_request.call_args[1]["headers"]["Accept"]
            == "application/json;odata=verbose"
        )

    def test_handles_invalid_status(self, mocker):
        """Test _get_form_digest_value."""
        client = SharepointClient(valid_connect_config)
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 500
        mocked_post_request.return_value.content = b"test"
        with pytest.raises(HTTPError) as excinfo:
            client._get_form_digest_value()
        assert str(excinfo.value) == "Sharepoint server response status code was 500"
        assert mocked_post_request.call_count == 1
        assert (
            mocked_post_request.call_args[0][0] == "https://my.sharepoint.com/_api/contextinfo"
        )
        assert (
            mocked_post_request.call_args[1]["headers"]["Accept"]
            == "application/json;odata=verbose"
        )

    def test_handles_invalid_response(self, mocker):
        """Test _get_form_digest_value."""
        client = SharepointClient(valid_connect_config)
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 200
        mocked_post_request.return_value.content = b"test"
        mocked_post_request.return_value.json.return_value = {
            "d": {"GetContextWebInformation": {}}
        }
        with pytest.raises(HTTPError) as excinfo:
            client._get_form_digest_value()
        assert (
            str(excinfo.value)
            == "Sharepoint server response did not contain form digest value"
        )
        assert mocked_post_request.call_count == 1
        assert (
            mocked_post_request.call_args[0][0] == "https://my.sharepoint.com/_api/contextinfo"
        )
        assert (
            mocked_post_request.call_args[1]["headers"]["Accept"]
            == "application/json;odata=verbose"
        )


class TestSharepointUploadFile:
    def test_upload_file(
        self,
    ):
        return "test_upload_file"

    def test_non_existing_file(self):
        """Test upload with non existing file."""
        client = SharepointClient(valid_connect_config)
        with mock.patch("pathlib.Path.is_file", return_value=False):
            with pytest.raises(FileNotFoundError):
                client.upload_file(Path("should be a Path"), "Documents", False)

    def test_exception_in_get_form_digest_value(self, mocker):
        """Test upload with an exception from _get_form_digest_value."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocker.patch("pathlib.Path.is_file", return_value=True)
        mocker.patch("pathlib.Path.read_bytes", return_value=b"test")
        mocked_get_form_digest.side_effect = HTTPError("test")
        with pytest.raises(HTTPError) as excinfo:
            client.upload_file(Path("_version.txt"), "Documents", False)
        assert str(excinfo.value) == "test"
        assert mocked_get_form_digest.call_count == 1

    def test_bad_status_when_uploading(self, mocker):
        """Test upload with bad status when uploading."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocker.patch("pathlib.Path.is_file", return_value=True)
        mocker.patch("pathlib.Path.read_bytes", return_value=b"test")
        mocked_get_form_digest.return_value = "test"
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 400
        mocked_post_request.return_value.json.return_value = {
            "error": {"message": {"value": "test"}}
        }
        with pytest.raises(HTTPError) as excinfo:
            client.upload_file(Path("_version.txt"), "Documents", False)
        assert (
            str(excinfo.value)
            == "Uploading file _version.txt to https://my.sharepoint.com/_api/web/GetFolderByServerRelativeUrl('Documents') failed with 400 test"
        )
        assert mocked_get_form_digest.call_count == 1
        assert mocked_post_request.call_count == 1

    def test_all_working(self, mocker):
        """Test upload with all steps working as expected."""
        client = SharepointClient(valid_connect_config)
        mocker.patch("pathlib.Path.is_file", return_value=True)
        mocker.patch("pathlib.Path.read_bytes", return_value=b"test")
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 200
        mocked_post_request.return_value.content = b"test"
        mocked_post_request.return_value.json.return_value = {
            "d": {"GetContextWebInformation": {"FormDigestValue": "test"}}
        }
        assert client.upload_file(Path("_version.txt"), "Documents", True) is None
        assert mocked_post_request.call_count == 2
        assert (
            mocked_post_request.call_args[0][0]
            == "https://my.sharepoint.com/_api/web/GetFolderByServerRelativeUrl('Documents')/Files/add(url='_version.txt',overwrite=true)"
        )
        assert mocked_post_request.call_args[1]["data"] == b"test"
        assert mocked_post_request.call_args[1]["headers"]["X-RequestDigest"] == "test"

    def test_all_working_with_force_ip(self, mocker):
        """Test upload with all steps working as expected even if given a force_ip."""
        client = SharepointClient(valid_connect_config)
        client._force_ip = "1.1.1.1"
        mocker.patch("pathlib.Path.is_file", return_value=True)
        mocker.patch("pathlib.Path.read_bytes", return_value=b"test")
        mocked_post_request: mock.Mock = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 200
        mocked_post_request.return_value.content = b"test"
        mocked_post_request.return_value.json.return_value = {
            "d": {"GetContextWebInformation": {"FormDigestValue": "test"}}
        }
        assert client.upload_file(Path("_version.txt"), "Documents", True) is None
        assert mocked_post_request.call_count == 2
        mocked_post_request.assert_has_calls(
            [
                mock.call(
                    f"https://{client._force_ip}/_api/contextinfo",
                    headers={
                        "Accept": "application/json;odata=verbose",
                        "Host": "my.sharepoint.com",
                    },
                    data=None,
                    verify=False,
                ),
                mock.call().json(),
                mock.call(
                    f"https://{client._force_ip}/_api/web/GetFolderByServerRelativeUrl('Documents')/Files/add(url='_version.txt',overwrite=true)",
                    headers={
                        "Accept": "application/json;odata=verbose",
                        "X-RequestDigest": "test",
                        "Content-Length": "4",
                        "Host": "my.sharepoint.com",
                    },
                    data=b"test",
                    verify=False,
                ),
            ]
        )
        assert mocked_post_request.call_args[1]["data"] == b"test"
        assert mocked_post_request.call_args[1]["headers"]["X-RequestDigest"] == "test"
        assert mocked_post_request.call_args[1]["headers"]["Host"] == "my.sharepoint.com"


class TestSharepointUploadDirectory:
    def test_non_existing_folder(self, mocker):
        """Test upload with non existing folder."""
        client = SharepointClient(valid_connect_config)
        mocked_is_dir = mocker.patch("pathlib.Path.is_dir", return_value=False)
        with pytest.raises(FileNotFoundError):
            client.upload_directory(Path("should be a Path"), "Documents", False)
        assert mocked_is_dir.call_count == 1

    def test_exception_in_get_form_digest_value(self, mocker):
        """Test upload with an exception from _get_form_digest_value."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocked_is_dir = mocker.patch("pathlib.Path.is_dir", return_value=True)
        mocked_get_form_digest.side_effect = HTTPError("test")
        with pytest.raises(HTTPError) as excinfo:
            client.upload_directory(Path("test"), "Documents", False)
        assert str(excinfo.value) == "test"
        assert mocked_get_form_digest.call_count == 1
        assert mocked_is_dir.call_count == 1

    def test_bad_status_when_uploading(self, mocker):
        """Test upload with bad status when uploading."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocked_get_form_digest.return_value = "test"
        mocked_is_dir = mocker.patch("pathlib.Path.is_dir", return_value=True)
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 400
        mocked_post_request.return_value.json.return_value = {
            "error": {"message": {"value": "test"}}
        }
        with pytest.raises(HTTPError) as excinfo:
            client.upload_directory(Path("test"), "Documents", False)
        assert (
            str(excinfo.value)
            == "Creating folder test at https://my.sharepoint.com/_api/web/folders failed with 400 test"
        )
        assert mocked_get_form_digest.call_count == 1
        assert mocked_post_request.call_count == 1
        assert mocked_is_dir.call_count == 1

    def test_all_working(self, mocker):
        """Test upload with all steps working as expected."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocked_is_dir = mocker.patch("pathlib.Path.is_dir", return_value=True)
        mocked_iterdir = mocker.patch("pathlib.Path.iterdir", return_value=[])
        mocked_get_form_digest.return_value = "test"
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 201
        mocked_post_request.return_value.content = b"test"
        assert client.upload_directory(Path("test"), "Documents", True) is None
        assert mocked_get_form_digest.call_count == 1
        assert mocked_is_dir.call_count == 1
        assert mocked_iterdir.call_count == 1
        assert mocked_post_request.call_count == 1
        assert (
            mocked_post_request.call_args[0][0] == "https://my.sharepoint.com/_api/web/folders"
        )
        assert (
            mocked_post_request.call_args[1]["data"]
            == "{'__metadata': {'type': 'SP.Folder'},'ServerRelativeUrl': 'Documents/test'}"
        )
        assert mocked_post_request.call_args[1]["headers"]["X-RequestDigest"] == "test"

    def test_upload_one_directory_with_multiple_files(self, mocker):
        """Test upload with all steps working as expected."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocked_is_dir = mocker.patch("pathlib.Path.is_dir")
        mocked_is_dir.side_effect = [True]
        mocked_iterdir = mocker.patch("pathlib.Path.iterdir")
        mocked_iterdir.side_effect = [[Path("test1.txt"), Path("test2.txt")]]
        mocked_is_file = mocker.patch("pathlib.Path.is_file")
        mocked_is_file.side_effect = [True, True]
        mocked_get_form_digest.return_value = "test"
        mocked_upload_file = mocker.patch.object(client, "upload_file")
        mocked_upload_file.return_value = None
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 201
        mocked_post_request.return_value.content = b"test"
        assert client.upload_directory(Path("test"), "Documents", True) is None
        assert mocked_get_form_digest.call_count == 1
        assert mocked_is_dir.call_count == 1
        assert mocked_iterdir.call_count == 1
        assert mocked_upload_file.call_count == 2
        assert mocked_post_request.call_count == 1
        assert (
            mocked_post_request.call_args_list[0][0][0]
            == "https://my.sharepoint.com/_api/web/folders"
        )
        assert (
            mocked_post_request.call_args_list[0][1]["data"]
            == "{'__metadata': {'type': 'SP.Folder'},'ServerRelativeUrl': 'Documents/test'}"
        )

    def test_upload_nested_directory_with_multiple_files(self, mocker):
        """Test upload with all steps working as expected."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocked_get_form_digest.return_value = "test"
        mocked_upload_file = mocker.patch.object(client, "upload_file")
        mocked_upload_file.return_value = None
        mocked_post_request = mocker.patch.object(client._session, "post")
        mocked_post_request.return_value.status_code = 201
        mocked_post_request.return_value.content = b"test"
        mocked_is_dir = mocker.patch("pathlib.Path.is_dir")
        mocked_is_file = mocker.patch("pathlib.Path.is_file")
        mocked_iterdir = mocker.patch("pathlib.Path.iterdir")
        mocked_is_file.side_effect = [False, False, True, True]
        mocked_is_dir.side_effect = [True, True, True, True, True, False]
        mocked_iterdir.side_effect = [
            [Path("test2")],
            [Path("test2/test3")],
            [Path("file1.txt"), Path("file2.txt")],
        ]
        assert client.upload_directory(Path("test"), "Documents", True) is None
        assert mocked_post_request.call_count == 3
        assert mocked_upload_file.call_count == 2
        assert (
            mocked_post_request.call_args_list[0][0][0]
            == "https://my.sharepoint.com/_api/web/folders"
        )
        assert (
            mocked_post_request.call_args_list[0][1]["data"]
            == "{'__metadata': {'type': 'SP.Folder'},'ServerRelativeUrl': 'Documents/test'}"
        )
        assert (
            mocked_post_request.call_args_list[1][0][0]
            == "https://my.sharepoint.com/_api/web/folders"
        )
        assert (
            mocked_post_request.call_args_list[1][1]["data"]
            == "{'__metadata': {'type': 'SP.Folder'},'ServerRelativeUrl': 'Documents/test/test2'}"
        )
        assert (
            mocked_post_request.call_args_list[2][0][0]
            == "https://my.sharepoint.com/_api/web/folders"
        )
        assert (
            mocked_post_request.call_args_list[2][1]["data"]
            == "{'__metadata': {'type': 'SP.Folder'},'ServerRelativeUrl': 'Documents/test/test2/test3'}"
        )
        assert mocked_upload_file.call_args_list[0][0][0] == Path("file1.txt")
        assert mocked_upload_file.call_args_list[0][0][1] == "Documents/test/test2/test3"
        assert mocked_upload_file.call_args_list[1][0][0] == Path("file2.txt")
        assert mocked_upload_file.call_args_list[1][0][1] == "Documents/test/test2/test3"


class TestSharepointClientDeleteFolder:
    def test_exception_in_form_digest(self, mocker):
        """Test exception in form digest."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocked_get_form_digest.side_effect = HTTPError("test")
        with pytest.raises(HTTPError) as excinfo:
            client.delete_folder("test")
        assert "test" in str(excinfo.value)

    def test_exception_in_delete_folder(self, mocker):
        """Test exception in delete folder."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocked_get_form_digest.return_value = "test"
        mocked_delete_request = mocker.patch.object(client._session, "post")
        mocked_delete_request.side_effect = HTTPError("test")
        with pytest.raises(HTTPError) as excinfo:
            client.delete_folder("test")
        assert "test" in str(excinfo.value)

    def test_delete_folder(self, mocker):
        """Test delete folder."""
        client = SharepointClient(valid_connect_config)
        mocked_get_form_digest = mocker.patch.object(client, "_get_form_digest_value")
        mocked_get_form_digest.return_value = "test"
        mocked_delete_request = mocker.patch.object(client._session, "post")
        mocked_delete_request.return_value.status_code = 200
        mocked_delete_request.return_value.content = b"test"
        assert client.delete_folder("test") is None
        assert mocked_delete_request.call_count == 1
        assert (
            mocked_delete_request.call_args_list[0][0][0]
            == "https://my.sharepoint.com/_api/web/GetFolderByServerRelativeUrl('test')"
        )


@pytest.mark.parametrize(
    ("status_code", "content", "expected"),
    [
        (400, b'{ "error": { "message": { "value": "test" } } }', "400 test"),
        (
            401,
            b'{ "error": { "message": { "value": "Unauthorized" } } }',
            "401 Unauthorized\nPlease check if your credentials are correct.",
        ),
        (
            403,
            b'{ "error": { "message": { "value": "Forbidden" } } }',
            "403 Forbidden\nPlease check if you have write permissions.",
        ),
        (
            404,
            b'{ "error": { "message": { "value": "Not Found" } } }',
            "404 Not Found\nPlease check if the sharepoint path exists and you have write permissions.",
        ),
        (
            500,
            b'{ "error": { "message": { "value": "Internal Server Error" } } }',
            "500 Internal Server Error\nPlease check if your sharepoint server is reachable.",
        ),
    ],
)
def test_get_sharepoint_error_message(status_code, content, expected):
    client = SharepointClient(valid_connect_config)
    response: Response = Response()
    response.status_code = status_code
    response._content = content
    assert client._get_sharepoint_error_message(response) == expected
