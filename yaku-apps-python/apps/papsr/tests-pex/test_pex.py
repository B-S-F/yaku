import importlib.resources
import subprocess
from pathlib import Path

from yaku.autopilot_utils.results import assert_result_status
from yaku.papsr.cli import SAMPLE_CODE

APP_NAME = "papsr"
APP__NAME = APP_NAME.replace("-", "_")


def test_pex_version():
    file_version = importlib.resources.read_text(f"yaku.{APP__NAME}", "_version.txt")
    output = subprocess.check_output(
        [f"apps.{APP_NAME}/{APP_NAME}.pex", "--version"], encoding="utf-8"
    )

    assert output.strip() == file_version.strip()


def test_pex_shows_usage_info_when_run_without_arguments():
    result = subprocess.run(
        [f"apps.{APP_NAME}/{APP_NAME}.pex"], encoding="utf-8", capture_output=True
    )

    assert result.returncode != 0
    assert result.stderr.strip().startswith("Usage:")


def test_pex_can_load_and_execute_cli_from_module(tmp_path: Path):
    sample_file = tmp_path / "sample_cli.py"
    sample_file.write_text(SAMPLE_CODE)

    result = subprocess.run(
        [f"apps.{APP_NAME}/{APP_NAME}.pex", str(sample_file)],
        encoding="utf-8",
        capture_output=True,
    )

    assert_result_status(result.stdout, "GREEN", reason="Fail flag was set to: False")

    result = subprocess.run(
        [f"apps.{APP_NAME}/{APP_NAME}.pex", str(sample_file), "--fail"],
        encoding="utf-8",
        capture_output=True,
    )
    assert_result_status(result.stdout, "RED", reason=".*But: Fail flag was set to: True")
