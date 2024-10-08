import subprocess


def test_pex_runs_normally_with_green_result():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_single_evaluator/app_single_evaluator.pex",
            "--no-colors",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Inside click_command" in process.stdout
    assert "Doing some evaluations" in process.stdout
    assert "GREEN" in process.stdout


def test_pex_runs_normally_with_red_result():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_single_evaluator/app_single_evaluator.pex",
            "--no-colors",
            "--red",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Inside click_command" in process.stdout
    assert "Doing some evaluations" in process.stdout
    assert "RED" in process.stdout
