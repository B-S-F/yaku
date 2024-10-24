import importlib.resources
import subprocess

APP_NAME = "security-scanner"
APP__NAME = APP_NAME.replace("-", "_")


def test_pex_version_flag():
    file_version = importlib.resources.read_text(f"yaku.{APP__NAME}", "_version.txt")
    output = subprocess.check_output(
        [f"apps.{APP_NAME}/{APP_NAME}.pex", "--version"], encoding="utf-8"
    )

    assert output.strip() == file_version.strip()


def test_pex_help_flag():
    output = subprocess.check_output(
        [f"apps.{APP_NAME}/{APP_NAME}.pex", "--help"], encoding="utf-8"
    )

    assert output.strip().startswith("Usage: ")
