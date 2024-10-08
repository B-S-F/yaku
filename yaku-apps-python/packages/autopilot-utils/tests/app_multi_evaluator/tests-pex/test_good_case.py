import subprocess


def test_pex_without_subcommand_shows_help():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_evaluator/app_multi_evaluator.pex",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert process.stdout.startswith("Usage:")


def test_pex_executes_subcommand_a():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_evaluator/app_multi_evaluator.pex",
            "check_a",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Doing some work in check_" in process.stdout
    assert "status" in process.stdout
    assert "reason" in process.stdout


def test_pex_executes_subcommand_a_with_argument():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_evaluator/app_multi_evaluator.pex",
            "check_a",
            "somearg",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Doing some work in check_" in process.stdout
    assert "with arg_a='somearg'" in process.stdout
    assert "status" in process.stdout
    assert "reason" in process.stdout


def test_pex_executes_subcommand_b():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_evaluator/app_multi_evaluator.pex",
            "check_b",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Doing some work in check_b" in process.stdout
    assert "status" in process.stdout
    assert "reason" in process.stdout


def test_pex_runs_check_a_normally_with_green_result():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_evaluator/app_multi_evaluator.pex",
            "--no-colors",
            "check_a",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Doing some work in check_a" in process.stdout
    assert "GREEN" in process.stdout
    assert "status" in process.stdout
    assert "reason" in process.stdout


def test_pex_runs_check_a_normally_with_red_result():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_evaluator/app_multi_evaluator.pex",
            "--no-colors",
            "check_a",
            "--red",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Doing some work in check_a" in process.stdout
    assert "RED" in process.stdout
    assert "status" in process.stdout
    assert "reason" in process.stdout
