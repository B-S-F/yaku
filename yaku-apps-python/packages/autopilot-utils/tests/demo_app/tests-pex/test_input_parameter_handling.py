import os
import subprocess


def test_pex_prefers_cli_args_over_env_vars():
    my_env = os.environ.copy()
    my_env["HELLO_NAME"] = "Donald Duck"

    output = subprocess.check_output(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "hello", "Obelix"],
        encoding="utf-8",
        env=my_env,
    )
    assert "Hello Obelix" in output


def test_pex_can_read_from_cli_args():
    output = subprocess.check_output(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "hello", "Asterix"],
        encoding="utf-8",
    )
    assert "Hello Asterix" in output


def test_pex_can_read_from_env_vars():
    my_env = os.environ.copy()
    my_env["HELLO_NAME"] = "Donald Duck"

    output = subprocess.check_output(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "hello"],
        encoding="utf-8",
        env=my_env,
    )
    assert "Hello Donald Duck" in output
