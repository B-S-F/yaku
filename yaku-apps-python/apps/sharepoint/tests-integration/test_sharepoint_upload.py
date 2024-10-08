import os
import subprocess
import tempfile
from pathlib import Path

import pytest
from yaku.sharepoint.client.sharepoint import Settings, SharepointClient

APP_NAME = "sharepoint"
APP__NAME = APP_NAME.replace("-", "_")

sharepoint_client: SharepointClient = None


def setup_test_env() -> Path:
    sharepoint_client = SharepointClient(Settings())
    tmp_dir = tempfile.mkdtemp()
    sharepoint_path = "Documents"
    sharepoint_client.upload_directory(Path(tmp_dir), sharepoint_path)
    return Path(tmp_dir)


def teardown_test_env(tmp_dir: Path):
    sharepoint_client = SharepointClient(Settings())
    sharepoint_client.delete_folder(f"Documents/{tmp_dir.stem}")
    for root, dirs, files in os.walk(tmp_dir, topdown=False):
        for name in files:
            os.remove(os.path.join(root, name))
        for name in dirs:
            os.rmdir(os.path.join(root, name))


@pytest.fixture
def resource_file():
    tmp_dir = setup_test_env()
    yield tmp_dir
    teardown_test_env(tmp_dir)


class TestUploadFiles:
    def test_should_upload_file(self, resource_file):
        file_to_upload = resource_file / "test.txt"
        file_to_upload.write_text("test")
        sharepoint_path = f"Documents/{resource_file.stem}"
        output = subprocess.check_output(
            [
                f"apps.{APP_NAME}/{APP_NAME}.pex",
                "upload-files",
                "--file",
                str(file_to_upload),
                "--sharepoint-path",
                sharepoint_path,
            ],
            encoding="utf-8",
        ).split("\n")
        assert f"Uploading {str(file_to_upload)}" in output
        assert "Upload complete" in output

    def test_should_upload_multiple_files(self, resource_file):
        file_to_upload = resource_file / "test.txt"
        file_to_upload.write_text("test")
        file_to_upload2 = resource_file / "test2.txt"
        file_to_upload2.write_text("test2")
        sharepoint_path = f"Documents/{resource_file.stem}"
        output = subprocess.check_output(
            [
                f"apps.{APP_NAME}/{APP_NAME}.pex",
                "upload-files",
                "--file",
                str(file_to_upload),
                "--file",
                str(file_to_upload2),
                "--sharepoint-path",
                sharepoint_path,
            ],
            encoding="utf-8",
        ).split("\n")
        assert f"Uploading {str(file_to_upload)}" in output
        assert f"Uploading {str(file_to_upload2)}" in output
        assert "Upload complete" in output

    def test_should_overwrite_file_with_force(self, resource_file):
        file_to_upload = resource_file / "test.txt"
        file_to_upload.write_text("test")
        sharepoint_path = f"Documents/{resource_file.stem}"
        subprocess.check_output(
            [
                f"apps.{APP_NAME}/{APP_NAME}.pex",
                "upload-files",
                "--file",
                str(file_to_upload),
                "--sharepoint-path",
                sharepoint_path,
            ],
            encoding="utf-8",
        )
        output = subprocess.check_output(
            [
                f"apps.{APP_NAME}/{APP_NAME}.pex",
                "upload-files",
                "--file",
                str(file_to_upload),
                "--sharepoint-path",
                sharepoint_path,
                "--force",
            ],
            encoding="utf-8",
        ).split("\n")
        assert f"Uploading {str(file_to_upload)}" in output
        assert "Upload complete" in output


@pytest.fixture
def resource_folder():
    tmp_dir = setup_test_env()
    yield tmp_dir
    teardown_test_env(tmp_dir)


class TestUploadFolder:
    def test_should_upload_folder(self, resource_folder):
        sharepoint_path = f"Documents/{resource_folder.stem}"
        output = subprocess.check_output(
            [
                f"apps.{APP_NAME}/{APP_NAME}.pex",
                "upload-folder",
                str(resource_folder),
                "--sharepoint-path",
                sharepoint_path,
            ],
            encoding="utf-8",
        ).split("\n")
        assert f"Uploading folder {str(resource_folder)}" in output
        assert "Upload complete" in output

    def test_should_overwrite_folder_with_force(self, resource_folder):
        sharepoint_path = f"Documents/{resource_folder.stem}"
        subprocess.check_output(
            [
                f"apps.{APP_NAME}/{APP_NAME}.pex",
                "upload-folder",
                str(resource_folder),
                "--sharepoint-path",
                sharepoint_path,
            ],
            encoding="utf-8",
        )
        output = subprocess.check_output(
            [
                f"apps.{APP_NAME}/{APP_NAME}.pex",
                "upload-folder",
                str(resource_folder),
                "--sharepoint-path",
                sharepoint_path,
                "--force",
            ],
            encoding="utf-8",
        ).split("\n")
        assert f"Uploading folder {str(resource_folder)}" in output
        assert "Upload complete" in output

    def test_should_upload_folder_recursively(self, resource_folder):
        subfolder = resource_folder / "subfolder"
        subfolder.mkdir()
        file_to_upload = subfolder / "test.txt"
        file_to_upload.write_text("test")
        subfolder2 = subfolder / "subfolder2"
        subfolder2.mkdir()
        file_to_upload2 = subfolder2 / "test2.txt"
        file_to_upload2.write_text("test2")
        sharepoint_path = f"Documents/{resource_folder.stem}"
        output = subprocess.check_output(
            [
                f"apps.{APP_NAME}/{APP_NAME}.pex",
                "upload-folder",
                str(resource_folder),
                "--sharepoint-path",
                sharepoint_path,
            ],
            encoding="utf-8",
        ).split("\n")
        assert f"Uploading folder {str(resource_folder)}" in output
        assert f"Uploading folder {str(subfolder)}" in output
        assert f"Uploading folder {str(subfolder2)}" in output
        assert f"Uploading file {str(file_to_upload)}" in output
        assert f"Uploading file {str(file_to_upload2)}" in output
        assert "Upload complete" in output
