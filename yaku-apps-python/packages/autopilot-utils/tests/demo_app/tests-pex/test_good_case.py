import subprocess


def test_pex_runs_normally_on_correct_hello_arguments():
    returncode = subprocess.call(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "hello", "world"],
        encoding="utf-8",
    )
    assert returncode == 0
