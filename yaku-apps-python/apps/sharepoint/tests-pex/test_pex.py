import importlib.resources
import subprocess

APP_NAME = "sharepoint"
APP__NAME = APP_NAME.replace("-", "_")


def test_pex_version():
    file_version = importlib.resources.read_text(f"yaku.{APP__NAME}", "_version.txt")
    output = subprocess.check_output(
        [f"apps.{APP_NAME}/{APP_NAME}.pex", "--version"], encoding="utf-8"
    )

    assert output.strip() == file_version.strip()
