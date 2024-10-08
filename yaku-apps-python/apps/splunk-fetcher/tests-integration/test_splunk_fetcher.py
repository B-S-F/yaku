import json
import os
import subprocess
from pathlib import Path

import mock
import pytest

APP_NAME = "splunk-fetcher"

SPLUNK_APP_NAME = "search"
USERNAME = os.environ["SPLUNK_USERNAME"]
PASSWORD = os.environ["SPLUNK_PASSWORD"]
QUERY = "|  inputlookup geo_attr_countries |  eval numb=len(country) |  eval numby=numb*3 |  fields country, numb"
HOST = os.environ["SPLUNK_SERVER"]
RESULT_FILE = "result.json"
PORT = "8089"


@pytest.fixture
def evidence_path(tmp_path) -> Path:
    with mock.patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
        yield tmp_path


def get_fetched_path_from_jsonline(output: str) -> str:
    """Parse all JSON lines and extract output.fetched."""
    for line in output.split("\n"):
        try:
            jsonline = json.loads(line)
            if "output" in jsonline:
                if "fetched" in jsonline["output"]:
                    fetched_path = jsonline["output"]["fetched"]
                    return fetched_path
        except json.decoder.JSONDecodeError:
            continue
    raise ValueError("Could not parse output.fetch from JSON lines:\n\n" + output)


def test_should_fetch_data_success(evidence_path: Path):
    output_path = evidence_path / RESULT_FILE

    output = subprocess.run(
        [
            f"apps.{APP_NAME}/{APP_NAME}.pex",
            "--app",
            SPLUNK_APP_NAME,
            "--username",
            USERNAME,
            "--password",
            PASSWORD,
            "--query",
            QUERY,
            "--host",
            HOST,
            "--port",
            PORT,
            "--result-file",
            RESULT_FILE,
        ],
        capture_output=True,
        encoding="utf-8",
    )

    assert "Output path is: ", output_path in output.stdout
    assert "Fetching Splunk data" in output.stdout
    fetched_path = get_fetched_path_from_jsonline(output.stdout)
    assert fetched_path == str(output_path)
    fetched_data = json.loads(output_path.read_text())
    assert "messages" in fetched_data
    assert "results" in fetched_data
    assert len(fetched_data["results"]) > 0


def test_should_fetch_data_one_shot(evidence_path: Path):
    output_path = evidence_path / RESULT_FILE

    output = subprocess.run(
        [
            f"apps.{APP_NAME}/{APP_NAME}.pex",
            "--app",
            SPLUNK_APP_NAME,
            "--username",
            USERNAME,
            "--password",
            PASSWORD,
            "--host",
            HOST,
            "--port",
            PORT,
            "--query",
            QUERY,
            "--one-shot",
            "--result-file",
            RESULT_FILE,
        ],
        capture_output=True,
        encoding="utf-8",
    )

    assert "Output path is: ", output_path in output.stdout
    fetched_path = get_fetched_path_from_jsonline(output.stdout)
    assert fetched_path == str(output_path)
    fetched_data = json.loads(output_path.read_text())
    assert "messages" in fetched_data
    assert "results" in fetched_data
    assert len(fetched_data["results"]) > 0


def test_should_fetch_data_csv_format(evidence_path: Path):
    output_path = evidence_path / RESULT_FILE

    output = subprocess.run(
        [
            f"apps.{APP_NAME}/{APP_NAME}.pex",
            "--app",
            SPLUNK_APP_NAME,
            "--username",
            USERNAME,
            "--password",
            PASSWORD,
            "--host",
            HOST,
            "--port",
            PORT,
            "--query",
            QUERY,
            "--output-format",
            "csv",
            "--result-file",
            RESULT_FILE,
        ],
        capture_output=True,
        encoding="utf-8",
    )

    assert "Output path is: ", output_path in output.stdout
    fetched_path = get_fetched_path_from_jsonline(output.stdout)
    assert fetched_path == str(output_path)
    assert output_path.read_text().startswith("country,numb\n")


def test_should_check_result_length_if_validation_query_was_passed(evidence_path: Path):
    output_path = evidence_path / RESULT_FILE

    output = subprocess.run(
        [
            f"apps.{APP_NAME}/{APP_NAME}.pex",
            "--app",
            SPLUNK_APP_NAME,
            "--username",
            USERNAME,
            "--password",
            PASSWORD,
            "--query",
            QUERY,
            "--validate-results",
            "--host",
            HOST,
            "--port",
            PORT,
            "--result-file",
            RESULT_FILE,
        ],
        capture_output=True,
        encoding="utf-8",
    )

    assert "Output path is: ", output_path in output.stdout
    assert "Fetching Splunk data" in output.stdout
    assert "Validation succeeded" in output.stdout
    assert "255" in output.stdout
    fetched_path = get_fetched_path_from_jsonline(output.stdout)
    assert fetched_path == str(output_path)
    fetched_data = json.loads(output_path.read_text())
    assert "messages" in fetched_data
    assert "results" in fetched_data
    assert len(fetched_data["results"]) > 0
