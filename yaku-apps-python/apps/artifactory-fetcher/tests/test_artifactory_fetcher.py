from collections import namedtuple
from pathlib import Path
from urllib.error import URLError

import mock
import pytest
from artifactory import ArtifactoryException
from pytest_mock import MockerFixture
from yaku.autopilot_utils.errors import AutopilotError

from yaku.artifactory_fetcher.artifactory_fetcher import (
    create_artifactory_client,
    download_file,
    get_file_checksum,
)


class TestCreateArtifactoryClient:
    def test_login_successful_but_artifactory_path_does_not_exist(self, mocker: MockerFixture):
        mocker.patch("pathlib.Path.exists", return_value=False)
        with pytest.raises(
            URLError,
            match="<urlopen error The following URL does not exist in Artifactory: https://",
        ):
            create_artifactory_client(
                artifactory_url="https://artifactory.test.com/artifactory",
                artifactory_repository_path="test_artifact_path",
                repository_name="test_repo_name",
                artifactory_username="correctUser",
                artifactory_password="correctPassword",
            )

    def test_login_successful_and_artifactory_path_exists(self, mocker: MockerFixture):
        mocker.patch("pathlib.Path.exists", return_value=True)
        path = create_artifactory_client(
            artifactory_url="https://artifactory.test.com/artifactory",
            artifactory_repository_path="test_artifact_path",
            repository_name="test_repo_name",
            artifactory_username="correctUser",
            artifactory_password="correctPassword",
        )
        assert (
            str(path)
            == "https://artifactory.test.com/artifactory/test_repo_name/test_artifact_path"
        )


class TestDownloadFile:
    def test_download_file_exists(self, mocker: MockerFixture):
        url = Path(
            "https://artifactory.test.com/artifactory"
            + "test_repo_name"
            + "test_artifact_path"
        )
        expected_sha = "shasha"

        mocker.patch("pathlib.Path.exists", return_value=True)

        mocker.patch("pathlib.Path.open", mock.mock_open())
        mocked_stat = mocker.patch("pathlib.Path.stat")
        mocked_stat.return_value = namedtuple("stat", ["sha256"])(sha256=expected_sha)

        result = download_file(
            url,
            "test_artifact_path",
            Path("output_path"),
        )

        assert expected_sha == result

    def test_download_file_does_not_exist(self, mocker: MockerFixture):
        url = Path(
            "https://artifactory.test.com/artifactory"
            + "test_repo_name"
            + "test_artifact_path"
        )
        mocker.patch("pathlib.Path.exists", return_value=False)
        with pytest.raises(
            FileNotFoundError, match="Download directory 'output_path' does not exist!"
        ):
            download_file(
                url,
                "test_artifact_path",
                Path("output_path"),
            )

    def test_download_file_ValueError(self, mocker: MockerFixture):
        url = Path(
            "https://artifactory.test.com/artifactory"
            + "test_repo_name"
            + "test_artifact_path"
        )
        mocker.patch("pathlib.Path.exists", return_value=True)
        mocked_open = mocker.patch("pathlib.Path.open")
        mocked_open.side_effect = ArtifactoryException
        with pytest.raises(
            AutopilotError,
            match="Failed to download file 'test_artifact_path'!",
        ) as exc_info:
            download_file(
                url,
                "test_artifact_path",
                Path("output_path"),
            )

        assert exc_info.value.__cause__.__class__ == ArtifactoryException


class TestGetFileChecksum:
    def test_path_does_not_exist(test, mocker: MockerFixture):
        artifactory_repository_path = "test_artifact_path"
        destination_path = Path("output_path")
        mocker.patch("pathlib.Path.exists", return_value=False)

        with pytest.raises(
            FileNotFoundError,
            match="File 'output_path/test_artifact_path' does not exist!",
        ):
            get_file_checksum(destination_path, artifactory_repository_path)

    def test_path_is_an_existing_file(test, mocker: MockerFixture):
        artifactory_repository_path = "test_artifact_path"
        destination_path = Path("output_path")
        mocker.patch("pathlib.Path.exists", return_value=True)
        mocker.patch("pathlib.Path.is_file", return_value=True)
        mocker.patch(
            "yaku.artifactory_fetcher.artifactory_fetcher.sha256sum", return_value="shasha"
        )

        result = get_file_checksum(destination_path, artifactory_repository_path)
        assert result == "shasha"

    def test_path_is_directory(test, mocker: MockerFixture):
        artifactory_repository_path = "test_artifact_path"
        destination_path = Path("output_path")
        mocker.patch("pathlib.Path.exists", return_value=True)
        mocker.patch("pathlib.Path.is_file", return_value=False)

        with pytest.raises(
            FileNotFoundError,
            match="File 'output_path/test_artifact_path' exists but is not a file!",
        ):
            get_file_checksum(destination_path, artifactory_repository_path)
