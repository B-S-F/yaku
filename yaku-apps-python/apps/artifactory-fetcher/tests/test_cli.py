import os
from pathlib import Path

import mock
import pytest
from yaku.artifactory_fetcher.cli import CLI
from yaku.autopilot_utils.errors import AutopilotFailure


@mock.patch.dict(
    os.environ,
    {
        "evidence_path": "test/notOK/",
    },
)
def test_trigger_fetcher_download_file_FileNotFoundError(mocker: mock):
    mocked_1 = mocker.patch("yaku.artifactory_fetcher.cli.create_artifactory_client")
    mocked_1.return_value = "https://some.url"
    mocked_exists = mocker.patch.object(Path, "exists")
    mocked_exists.return_value = False
    with pytest.raises(FileNotFoundError):
        CLI.click_command(
            username="correctUser",
            password="correctPassword",
            url="https://artifactory.test.com/artifactory",
            path="test_artifact_path",
            repository="test_repo_name",
        )


@mock.patch.dict(
    os.environ,
    {
        "evidence_path": "test/notOK/",
    },
)
def test_trigger_fetcher_get_file_checksum_FileNotFoundError(mocker):
    mocked_1 = mocker.patch("yaku.artifactory_fetcher.cli.create_artifactory_client")
    mocked_1.return_value = "https://url"
    mocked_2 = mocker.patch("yaku.artifactory_fetcher.cli.download_file")
    mocked_2.return_value = "checksumValue"
    mocked_exists = mocker.patch.object(Path, "exists")
    mocked_exists.return_value = False
    with pytest.raises(FileNotFoundError):
        CLI.click_command(
            username="correctUser",
            password="correctPassword",
            url="https://artifactory.test.com/artifactory",
            path="test_artifact_path",
            repository="test_repo_name",
        )


@mock.patch.dict(
    os.environ,
    {
        "evidence_path": "output_path/",
    },
)
def test_trigger_fetcher_get_file_checksum_ok(mocker, capsys):
    mocked_1 = mocker.patch("yaku.artifactory_fetcher.cli.create_artifactory_client")
    mocked_1.return_value = "https://url"
    mocked_2 = mocker.patch("yaku.artifactory_fetcher.cli.download_file")
    mocked_2.return_value = "checksumValue"
    mocked_3 = mocker.patch("yaku.artifactory_fetcher.cli.get_file_checksum")
    mocked_3.return_value = "checksumValue"
    CLI.click_command(
        username="correctUser",
        password="correctPassword",
        url="https://artifactory.test.com/artifactory",
        path="test_artifact_path",
        repository="test_repo_name",
    )
    out = capsys.readouterr().out
    assert '{"output": {"fetched": "output_path/test_artifact_path"}}' in out


@mock.patch.dict(
    os.environ,
    {
        "evidence_path": "test/notOK/",
    },
)
def test_trigger_fetcher_get_file_checksum_not_ok(mocker):
    mocked_1 = mocker.patch("yaku.artifactory_fetcher.cli.create_artifactory_client")
    mocked_1.return_value = "https://url"
    mocked_2 = mocker.patch("yaku.artifactory_fetcher.cli.download_file")
    mocked_2.return_value = "checksumValue"
    mocked_3 = mocker.patch("yaku.artifactory_fetcher.cli.get_file_checksum")
    mocked_3.return_value = "differentChecksumValue"
    with pytest.raises(AutopilotFailure, match="Fetched file is corrupted."):
        CLI.click_command(
            username="correctUser",
            password="correctPassword",
            url="https://artifactory.test.com/artifactory",
            path="test_artifact_path",
            repository="test_repo_name",
        )
