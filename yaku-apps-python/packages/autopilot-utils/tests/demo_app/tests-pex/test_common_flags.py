import importlib.resources
import subprocess


def test_pex_version_flag():
    file_version = importlib.resources.read_text("yaku.demo", "_version.txt")
    output = subprocess.check_output(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "--version"], encoding="utf-8"
    )

    assert output.strip() == file_version.strip()


def test_pex_help_flag():
    output = subprocess.check_output(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "--help"], encoding="utf-8"
    )

    assert output.strip().startswith("Usage: ")
