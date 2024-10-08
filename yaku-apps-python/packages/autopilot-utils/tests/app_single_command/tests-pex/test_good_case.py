import subprocess


def test_pex_runs_normally():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_single_command/app_single_command.pex",
            "--no-colors",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Inside click_command" in process.stdout
    assert "Should be doing something useful here" in process.stdout
