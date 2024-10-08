import subprocess


def test_pex_exits_with_nonzero_in_case_of_exception():
    returncode = subprocess.call(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "hello", "--fail"],
        encoding="utf-8",
    )
    assert returncode != 0


def test_pex_exits_with_zero_in_case_of_input_validation_error():
    process = subprocess.run(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "hello", "ed"],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert (
        "Input validation failed for ('name',): ensure this value has at least 3 characters."
        in process.stdout
    )
