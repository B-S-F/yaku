import json
import os
import subprocess
from pathlib import Path

import mock
import pytest

APP_NAME = "sharepoint-fetcher"

SHAREPOINT_FETCHER_TENANT_ID = os.environ["SHAREPOINT_TENANT_ID"]
SHAREPOINT_FETCHER_CLIENT_ID = os.environ["SHAREPOINT_CLIENT_ID"]
SHAREPOINT_FETCHER_CLIENT_SECRET = os.environ["SHAREPOINT_CLIENT_SECRET"]


SHAREPOINT_FETCHER_PROJECT_PATH_FILE = "Shared Documents/Instruction/deployment.yaml"
SHAREPOINT_FETCHER_PROJECT_PATH_FOLDER = "Shared Documents/Instruction/"
SHAREPOINT_FETCHER_PROJECT_SITE = os.environ["SHAREPOINT_CLOUD_FETCHER_PROJECT_SITE"]


@pytest.fixture
def evidence_path(tmp_path) -> Path:
    with mock.patch.dict(os.environ, {"evidence_path": str(tmp_path)}):
        yield tmp_path


def get_fetched_path_from_jsonline(output: str) -> str:
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


def test_should_fetch_file(evidence_path: Path):
    output = subprocess.run(
        [
            f"apps.{APP_NAME}/{APP_NAME}.pex",
            "--project-site",
            SHAREPOINT_FETCHER_PROJECT_SITE,
            "--project-path",
            SHAREPOINT_FETCHER_PROJECT_PATH_FILE,
            "--is-cloud",
            "True",
            "--tenant-id",
            SHAREPOINT_FETCHER_TENANT_ID,
            "--client-id",
            SHAREPOINT_FETCHER_CLIENT_ID,
            "--client-secret",
            SHAREPOINT_FETCHER_CLIENT_SECRET,
        ],
        capture_output=True,
        encoding="utf-8",
    )

    print("Error is: ")
    print(output.stderr)
    print("Output is: ")
    print(output.stdout)
    assert "Configuring SharePoint Fetcher" in output.stdout
    assert "File `deployment.yaml.__properties__.json` was saved in path" in output.stdout
    assert Path("deployment.yaml").exists()
    assert Path("deployment.yaml.__properties__.json").exists()
    assert "File `deployment.yaml` was saved in path" in output.stdout
    assert '{"output": {"fetched":' in output.stdout


def test_should_fetch_file_properties_only(evidence_path: Path):
    output = subprocess.run(
        [
            f"apps.{APP_NAME}/{APP_NAME}.pex",
            "--project-site",
            SHAREPOINT_FETCHER_PROJECT_SITE,
            "--project-path",
            SHAREPOINT_FETCHER_PROJECT_PATH_FILE,
            "--is-cloud",
            "True",
            "--download-properties-only",
            "True",
            "--tenant-id",
            SHAREPOINT_FETCHER_TENANT_ID,
            "--client-id",
            SHAREPOINT_FETCHER_CLIENT_ID,
            "--client-secret",
            SHAREPOINT_FETCHER_CLIENT_SECRET,
        ],
        capture_output=True,
        encoding="utf-8",
    )

    print("Error is: ")
    print(output.stderr)
    print("Output is: ")
    print(output.stdout)
    assert "Configuring SharePoint Fetcher" in output.stdout
    assert "File `deployment.yaml.__properties__.json` was saved in path" in output.stdout
    assert "File `deployment.yaml` was saved in path" not in output.stdout
    assert Path("deployment.yaml.__properties__.json").exists()
    assert '{"output": {"fetched":' in output.stdout


def test_should_fetch_folder(evidence_path: Path):
    output = subprocess.run(
        [
            f"apps.{APP_NAME}/{APP_NAME}.pex",
            "--project-site",
            SHAREPOINT_FETCHER_PROJECT_SITE,
            "--project-path",
            SHAREPOINT_FETCHER_PROJECT_PATH_FOLDER,
            "--is-cloud",
            "True",
            "--tenant-id",
            SHAREPOINT_FETCHER_TENANT_ID,
            "--client-id",
            SHAREPOINT_FETCHER_CLIENT_ID,
            "--client-secret",
            SHAREPOINT_FETCHER_CLIENT_SECRET,
        ],
        capture_output=True,
        encoding="utf-8",
    )

    print("Error is: ")
    print(output.stderr)
    print("Output is: ")
    print(output.stdout)
    assert "Configuring SharePoint Fetcher" in output.stdout
    assert "was saved in path" in output.stdout
    assert '{"output": {"fetched":' in output.stdout
    assert Path("deployment.yaml").exists()
    assert Path("deployment.yaml.__properties__.json").exists()


def test_should_fetch_folder_properties_only(evidence_path: Path):
    output = subprocess.run(
        [
            f"apps.{APP_NAME}/{APP_NAME}.pex",
            "--project-site",
            SHAREPOINT_FETCHER_PROJECT_SITE,
            "--project-path",
            SHAREPOINT_FETCHER_PROJECT_PATH_FOLDER,
            "--is-cloud",
            "True",
            "--download-properties-only",
            "True",
            "--tenant-id",
            SHAREPOINT_FETCHER_TENANT_ID,
            "--client-id",
            SHAREPOINT_FETCHER_CLIENT_ID,
            "--client-secret",
            SHAREPOINT_FETCHER_CLIENT_SECRET,
        ],
        capture_output=True,
        encoding="utf-8",
    )

    print("Error is: ")
    print(output.stderr)
    print("Output is: ")
    print(output.stdout)
    assert "Configuring SharePoint Fetcher" in output.stdout
    assert "was saved in path" in output.stdout
    assert '{"output": {"fetched":' in output.stdout
    assert Path("deployment.yaml.__properties__.json").exists()
