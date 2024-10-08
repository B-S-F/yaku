import importlib.resources
import subprocess


def test_pex_version_flag():
    file_version = importlib.resources.read_text(
        "yaku.app_super_simple_evaluator", "_version.txt"
    )
    output = subprocess.check_output(
        [
            "packages.autopilot-utils.tests.app_super_simple_evaluator/app_super_simple_evaluator.pex",
            "--version",
        ],
        encoding="utf-8",
    )

    assert output.strip() == file_version.strip()


def test_pex_help_flag():
    output = subprocess.check_output(
        [
            "packages.autopilot-utils.tests.app_super_simple_evaluator/app_super_simple_evaluator.pex",
            "--help",
        ],
        encoding="utf-8",
    )

    assert output.strip().startswith("Usage: ")
