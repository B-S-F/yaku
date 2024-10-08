import json
import subprocess


def test_pex_produces_result_output_in_JSON_line():
    process = subprocess.run(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "check", "yyy"],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    lines_found = 0
    print(process.stdout)
    for line in process.stdout.split("\n"):
        if line.startswith("{"):
            data = json.loads(line)
            if "result" in data:
                result = data["result"]
                assert result["criterion"]
                assert result["fulfilled"]
                assert result["justification"]
                lines_found += 1

    assert lines_found == 3


def test_pex_produces_status_and_reason_as_JSON_lines():
    process = subprocess.run(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "check", "yyy"],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    found_reasons = 0
    found_status = 0
    for line in process.stdout.split("\n"):
        if line.startswith("{"):
            data = json.loads(line)
            if "reason" in data:
                assert data["reason"] == "All criteria were fulfilled."
                found_reasons += 1
            if "status" in data:
                assert data["status"] == "GREEN"
                found_status += 1

    assert found_reasons == 1
    assert found_status == 1


def test_pex_produces_status_and_reason_as_JSON_lines_even_for_YELLOW():
    process = subprocess.run(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "check", "ynnyy"],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    found_reasons = 0
    found_status = 0
    for line in process.stdout.split("\n"):
        if line.startswith("{"):
            data = json.loads(line)
            if "reason" in data:
                assert data["reason"] == "At least half of the criteria were fulfilled."
                found_reasons += 1
            if "status" in data:
                assert data["status"] == "YELLOW"
                found_status += 1

    assert found_reasons == 1
    assert found_status == 1


def test_pex_produces_status_and_reason_as_JSON_lines_even_for_RED():
    process = subprocess.run(
        ["packages.autopilot-utils.tests.demo_app/demo.pex", "check", "ynnyynn"],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    found_reasons = 0
    found_status = 0
    for line in process.stdout.split("\n"):
        if line.startswith("{"):
            data = json.loads(line)
            if "reason" in data:
                assert data["reason"] == "Not half of the criteria were fulfilled!"
                found_reasons += 1
            if "status" in data:
                assert data["status"] == "RED"
                found_status += 1

    assert found_reasons == 1
    assert found_status == 1
