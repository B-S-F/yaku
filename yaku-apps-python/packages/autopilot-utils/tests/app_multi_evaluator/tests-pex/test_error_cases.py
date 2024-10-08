import subprocess

from yaku.autopilot_utils.results import assert_no_result_status, assert_result_status


def test_pex_exits_with_nonzero_in_case_of_exception_in_subcommand():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_evaluator/app_multi_evaluator.pex",
            "--no-colors",
            "check_a",
            "--fail",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode != 0
    assert process.stderr == ""
    assert "Failing as requested..." in process.stdout
    assert "Traceback" in process.stdout
    assert "Should be doing something useful here" not in process.stdout

    assert_no_result_status(process.stdout)


def test_pex_treats_chained_subcommands_as_autopilot_failure():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_evaluator/app_multi_evaluator.pex",
            "--no-colors",
            "check_a",
            "x",
            "check_b",
            "y",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert_result_status(
        process.stdout, "FAILED", reason="Got unexpected extra arguments \\(check_b y\\)"
    )
