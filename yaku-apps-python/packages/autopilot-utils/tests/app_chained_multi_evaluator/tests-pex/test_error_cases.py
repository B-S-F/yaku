import subprocess


def test_pex_exits_with_nonzero_in_case_of_exception_in_subcommand():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_chained_multi_evaluator/app_chained_multi_evaluator.pex",
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
    assert "status" not in process.stdout
    assert "reason" not in process.stdout
