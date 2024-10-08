import itertools
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import click
import mock
import pytest
from click import UsageError
from click.testing import CliRunner
from mock import Mock, patch
from yaku.autopilot_utils.results import assert_result_status
from yaku.splunk_fetcher.cli import (
    DEFAULT_END_TIME,
    DEFAULT_ONE_SHOT,
    DEFAULT_OUTPUT_FORMAT,
    DEFAULT_PORT,
    DEFAULT_RESULT_FILE,
    DEFAULT_START_TIME,
    check_inputs,
    get_output_path,
    main,
    validate_date_time,
)

DEFAULT_HOST = "splunk.example.com"
DEFAULT_FILE = "some_file.txt"
DEFAULT_QUERY = "some query"
DEFAULT_APP = "some_app"
DEFAULT_USERNAME = "username"
DEFAULT_PASSWORD = "password"


def make_args(exclude: List[str] = None, override: Dict[str, Any] = None) -> List[str]:
    possible_args = {
        "--file": DEFAULT_FILE,
        "--query": DEFAULT_QUERY,
        "--app": DEFAULT_APP,
        "--username": DEFAULT_USERNAME,
        "--password": DEFAULT_PASSWORD,
        "--output-format": DEFAULT_OUTPUT_FORMAT,
        "--host": DEFAULT_HOST,
        "--port": DEFAULT_PORT,
        "--result-file": DEFAULT_RESULT_FILE,
    }
    if exclude:
        for e in exclude:
            del possible_args[e]
    if override:
        for o in override:
            possible_args[o] = override[o]
    return ["--no-colors"] + list(
        itertools.chain.from_iterable([[k, v] for k, v in possible_args.items()])
    )


def test_validate_date_time():
    input_date_time = "2023-06-07 10:30:00"
    expected_output = datetime(2023, 6, 7, 10, 30).isoformat()
    assert validate_date_time(None, None, input_date_time) == expected_output


def test_validate_date_time_invalid_input():
    invalid_input = "invalid_date_time"
    with pytest.raises(UsageError):
        validate_date_time(None, None, invalid_input)


class TestMain:
    def test_main_reads_from_query_file_if_given(self, tmp_path: Path, mocker: mock):
        runner = CliRunner()
        with runner.isolated_filesystem(temp_dir=tmp_path):
            with patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
                query_file = tmp_path / "query.txt"
                query_file.write_text("my query in a file")

                mocker.patch("yaku.splunk_fetcher.cli.check_inputs")
                mocked_fetch_splunk_data = mocker.patch(
                    "yaku.splunk_fetcher.cli.fetch_splunk_data"
                )
                mocker.patch("yaku.splunk_fetcher.cli.write_output_file")
                mocker.patch("yaku.splunk_fetcher.cli.create_outputs")

                result = runner.invoke(
                    main,
                    args=[
                        *make_args(exclude=["--query"], override={"--file": str(query_file)})
                    ],
                )
                assert result.exit_code == 0
                mocked_fetch_splunk_data.assert_called_with(
                    "my query in a file",
                    DEFAULT_USERNAME,
                    DEFAULT_PASSWORD,
                    None,
                    DEFAULT_HOST,
                    DEFAULT_PORT,
                    DEFAULT_OUTPUT_FORMAT,
                    DEFAULT_APP,
                    DEFAULT_ONE_SHOT,
                    DEFAULT_START_TIME,
                    DEFAULT_END_TIME,
                    False,
                )

    @pytest.mark.parametrize(
        "host",
        [
            "some.host",
            "some.host:8888",
            "https://some.host",
            "http://some.host",
            "https://some.host:8888",
            "https://some.host:8888/de-DE/app/DOMAIN/search",
        ],
    )
    def test_main_cleans_up_hostname_argument(self, tmp_path: Path, mocker: mock, host: str):
        runner = CliRunner()
        with runner.isolated_filesystem(temp_dir=tmp_path):
            with patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
                mocker.patch("yaku.splunk_fetcher.cli.check_inputs")
                mocked_fetch_splunk_data = mocker.patch(
                    "yaku.splunk_fetcher.cli.fetch_splunk_data"
                )
                mocker.patch("yaku.splunk_fetcher.cli.write_output_file")
                mocker.patch("yaku.splunk_fetcher.cli.create_outputs")

                result = runner.invoke(
                    main,
                    args=[*make_args(exclude=["--file"], override={"--host": host})],
                )
                assert result.exit_code == 0
                mocked_fetch_splunk_data.assert_called_with(
                    DEFAULT_QUERY,
                    DEFAULT_USERNAME,
                    DEFAULT_PASSWORD,
                    None,
                    "some.host",
                    DEFAULT_PORT,
                    DEFAULT_OUTPUT_FORMAT,
                    DEFAULT_APP,
                    DEFAULT_ONE_SHOT,
                    DEFAULT_START_TIME,
                    DEFAULT_END_TIME,
                    False,
                )

    def test_main_does_not_overwrite_output_file_without_force_flag(
        self, tmp_path: Path, mocker: mock
    ):
        runner = CliRunner()
        with runner.isolated_filesystem(temp_dir=tmp_path):
            with patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
                (tmp_path / DEFAULT_RESULT_FILE).write_text("Original text")

                mocker.patch("yaku.splunk_fetcher.cli.check_inputs")
                mocked_fetch_splunk_data: Mock = mocker.patch(
                    "yaku.splunk_fetcher.cli.fetch_splunk_data"
                )
                mocked_fetch_splunk_data.return_value = "fetched data"
                mocked_create_outputs: Mock = mocker.patch(
                    "yaku.splunk_fetcher.cli.create_outputs"
                )
                mocker.patch("pathlib.Path.exists", return_value=True)

                # call once without "--force" flag
                result = runner.invoke(main, args=[*make_args(exclude=["--file"])])

                assert_result_status(
                    result.output,
                    "FAILED",
                    reason="File .* already exists.*pass the --force flag.",
                )
                assert (tmp_path / DEFAULT_RESULT_FILE).read_text() == "Original text"
                assert result.exit_code == 0
                mocked_fetch_splunk_data.assert_not_called()

                # now call with "--force" flag
                result = runner.invoke(
                    main, args=["--force"] + [*make_args(exclude=["--file"])]
                )

                assert result.exit_code == 0
                mocked_fetch_splunk_data.assert_called_once()
                mocked_create_outputs.assert_called_once()
                assert (tmp_path / DEFAULT_RESULT_FILE).read_text() == "fetched data"

    def test_main_no_app(self, tmp_path):
        runner = CliRunner()

        with patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
            result = runner.invoke(main, args=[*make_args(exclude=["--file", "--app"])])
            assert result.exit_code == 0
            assert_result_status(result.stdout, "FAILED", reason="Missing parameter: app")

    def test_main_no_query(self, tmp_path):
        runner = CliRunner()

        with patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
            result = runner.invoke(main, args=[*make_args(exclude=["--query", "--file"])])
            assert result.exit_code == 0
            assert_result_status(
                result.stdout, "FAILED", reason="Please provide either a query or a file"
            )

    def test_main_wrong_start_time(self, tmp_path):
        runner = CliRunner()

        with patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
            result = runner.invoke(
                main,
                args=[
                    *make_args(
                        exclude=["--file"], override={"--start-time": "2023-wrong-time-format"}
                    )
                ],
            )
            assert result.exit_code == 0
            assert_result_status(
                result.stdout, "FAILED", reason="Please provide a valid date time"
            )

    def test_main_wrong_end_time(self, tmp_path):
        runner = CliRunner()

        with patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
            result = runner.invoke(
                main,
                args=[
                    *make_args(
                        exclude=["--file"],
                        override={
                            "--start-time": "2023-07-31T00:00:00",
                            "--end-time": "2023-wrong-time-format",
                        },
                    )
                ],
            )
            assert result.exit_code == 0
            assert_result_status(
                result.stdout, "FAILED", reason="Please provide a valid date time"
            )

    def test_check_inputs_no_query_file(self):
        with patch.dict(os.environ, {"evidence_path": "."}):
            with pytest.raises(
                click.UsageError, match="Please provide either a query or a file"
            ):
                check_inputs(None, None, "username", "password", "token", "app")

    def test_check_inputs_no_username_no_password_no_token(self):
        with patch.dict(os.environ, {"evidence_path": "."}):
            with pytest.raises(
                click.UsageError,
                match=r"Please provide either a token \(and no username\) or a username with a password",
            ):
                check_inputs(None, "file", None, None, None, "app")

    def test_check_inputs_no_password_no_token(self):
        with patch.dict(os.environ, {"evidence_path": "."}):
            with pytest.raises(
                click.UsageError,
                match=r"Please provide either a token \(and no username\) or a username with a password",
            ):
                check_inputs(None, "file", "username", None, None, "app")

    def test_check_inputs_no_username_no_token(self):
        with patch.dict(os.environ, {"evidence_path": "."}):
            with pytest.raises(
                click.UsageError,
                match=r"Please provide either a token \(and no username\) or a username with a password",
            ):
                check_inputs(None, "file", None, "password", None, "app")

    def test_check_inputs_no_app(self):
        with patch.dict(os.environ, {"evidence_path": "."}):
            with pytest.raises(click.UsageError, match="Please provide an app"):
                check_inputs(None, "file", "username", "password", None, None)

    def test_get_output_path_no_evidence_path(self):
        with patch.dict(os.environ, {}, clear=True):
            assert get_output_path("result_file") == Path("result_file")

    def test_get_output_path_with_evidence_path(self):
        with patch.dict(os.environ, {"evidence_path": "some_path"}):
            assert get_output_path("result_file") == Path("some_path/result_file")
