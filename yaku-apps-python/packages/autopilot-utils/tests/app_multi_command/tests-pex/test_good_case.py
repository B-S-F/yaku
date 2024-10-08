import subprocess


def test_pex_without_subcommand_shows_help():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_command/app_multi_command.pex",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert process.stdout.startswith("Usage:")
    assert "Help text for subcommand aaa" in process.stdout


def test_pex_executes_subcommand_aaa():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_command/app_multi_command.pex",
            "aaa",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Doing some work in aaa" in process.stdout


def test_pex_executes_subcommand_aaa_with_argument():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_command/app_multi_command.pex",
            "aaa",
            "somearg",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Doing some work in aaa" in process.stdout
    assert "with arga='somearg'" in process.stdout


def test_pex_executes_subcommand_bbb():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_multi_command/app_multi_command.pex",
            "bbb",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Doing some work in bbb" in process.stdout
