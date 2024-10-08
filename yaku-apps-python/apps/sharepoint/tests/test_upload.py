import mock
import pytest
from pydantic import ValidationError
from yaku.autopilot_utils.subprocess import OutputMap, parse_json_lines_into_map
from yaku.sharepoint.client.sharepoint import Settings
from yaku.sharepoint.commands.upload import upload_directory, upload_files

sharepoint_config = Settings(
    sharepoint_project_site="https://internal.company.com/sites/123456/",
    username="username",
    password="password",
)


def test_upload_files_wrong_files_arg():
    """Test upload with wrong files arg."""
    with pytest.raises(ValidationError):
        upload_files("should be a list", sharepoint_config, "Documents", False)


def test_upload_files_wrong_force_arg():
    """Test upload with wrong force arg."""
    with pytest.raises(ValidationError):
        upload_files(["my_file.txt"], sharepoint_config, "Documents", "should be a bool")


def test_upload_files_with_non_existing_file():
    """Test upload with non existing file."""
    with mock.patch("pathlib.Path.is_file", return_value=False):
        with pytest.raises(FileNotFoundError):
            upload_files(["my_file.txt"], sharepoint_config, "Documents", False)


def test_upload_files_with_existing_file(capsys):
    """Test upload with."""
    with mock.patch(
        "yaku.sharepoint.client.sharepoint.SharepointClient.upload_file", return_value=None
    ):
        assert upload_files(["_version.txt"], sharepoint_config, "Documents", True) is None
        captured = capsys.readouterr()
        outputs = OutputMap(parse_json_lines_into_map(captured.out, "output"))
        assert outputs == {
            "_version.txt": f"{sharepoint_config.sharepoint_project_site}/Documents/_version.txt",
        }


def test_upload_folder_wrong_force_arg():
    """Test upload with wrong force arg."""
    with pytest.raises(ValidationError):
        upload_directory(
            "should be a Path", sharepoint_config, "Documents", "should be a bool"
        )


def test_upload_folder_non_existing_folder():
    """Test upload with non existing folder."""
    with mock.patch("pathlib.Path.is_dir", return_value=False):
        with pytest.raises(FileNotFoundError):
            upload_directory("should be a Path", sharepoint_config, "Documents", False)


def test_uploader_folder_with_existing_folder():
    """Test upload with existing folder."""
    with mock.patch(
        "yaku.sharepoint.client.sharepoint.SharepointClient.upload_directory",
        return_value=None,
    ):
        assert (
            upload_directory("should be a Path", sharepoint_config, "Documents", True) is None
        )
