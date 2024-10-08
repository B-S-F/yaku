import subprocess
from typing import List

from yaku.autopilot_utils.subprocess import (
    Result,
    parse_json_lines,
    parse_json_lines_into_list,
    parse_json_lines_into_map,
)


def test_demo_multistep_process_runs_fine():
    result = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_subprocess_steps/app_subprocess_steps.pex",
            "GREEN",
            "YELLOW",
        ],
        encoding="utf-8",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    outputs = parse_json_lines_into_map(result.stdout, "output")
    results: List[Result] = parse_json_lines_into_list(result.stdout, "result", cls=Result)
    status = parse_json_lines(result.stdout, "status")

    assert status == "YELLOW"

    assert len(results) == 2
    assert results[0].criterion == "crit from step 0"
    assert results[0].fulfilled == True
    assert results[0].justification == "just0"
    assert results[1].criterion == "crit from step 1"
    assert results[1].fulfilled == True
    assert results[1].justification == "just1"
    assert len(outputs) == 4
    assert outputs == {
        "prelim_output_from_step_0": "value_0",
        "output_key_from_step_0": "output_value_0",
        "prelim_output_from_step_1": "value_1",
        "output_key_from_step_1": "output_value_1",
    }


def test_demo_multistep_process_runs_fine_even_with_two_reds():
    result = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_subprocess_steps/app_subprocess_steps.pex",
            "RED",
            "RED",
        ],
        encoding="utf-8",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    outputs = parse_json_lines_into_map(result.stdout, "output")
    results: List[Result] = parse_json_lines_into_list(result.stdout, "result", cls=Result)
    status = parse_json_lines(result.stdout, "status")

    assert status == "RED"

    assert len(results) == 2
    assert results[0].criterion == "crit from step 0"
    assert results[0].fulfilled == False
    assert results[0].justification == "just0"
    assert results[1].criterion == "crit from step 1"
    assert results[1].fulfilled == False
    assert results[1].justification == "just1"
    assert len(outputs) == 4
    assert outputs == {
        "prelim_output_from_step_0": "value_0",
        "output_key_from_step_0": "output_value_0",
        "prelim_output_from_step_1": "value_1",
        "output_key_from_step_1": "output_value_1",
    }


def test_demo_multistep_process_failure_shows_outputs_but_no_results():
    result = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_subprocess_steps/app_subprocess_steps.pex",
            "FAILED",
            "GREEN",
        ],
        encoding="utf-8",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    status = parse_json_lines(result.stdout, "status")
    outputs = parse_json_lines_into_map(result.stdout, "output")
    results: List[Result] = parse_json_lines_into_list(result.stdout, "result", cls=Result)

    assert status == "FAILED"
    assert len(results) == 0
    assert len(outputs) == 1
    assert outputs == {
        "prelim_output_from_step_0": "value_0",
    }
    assert "stdout output of step 0" in result.stdout
    assert "stdout output of step 1" not in result.stdout


def test_demo_multistep_process_error_shows_outputs_but_no_results():
    result = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_subprocess_steps/app_subprocess_steps.pex",
            "GREEN",
            "ERROR",
        ],
        encoding="utf-8",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    assert result.returncode == 1

    outputs = parse_json_lines_into_map(result.stdout, "output")
    results: List[Result] = parse_json_lines_into_list(result.stdout, "result", cls=Result)

    # the status=ERROR is later added by Onyx, not visible here yet!
    assert len(results) == 0
    assert len(outputs) == 3
    assert outputs == {
        "prelim_output_from_step_0": "value_0",
        "output_key_from_step_0": "output_value_0",
        "prelim_output_from_step_1": "value_1",
    }
    assert "stdout output of step 0" in result.stdout
    assert "stderr output of step 0" in result.stderr
    assert "stdout output of step 1" in result.stdout
    assert "stderr output of step 1" in result.stdout


def test_demo_multistep_process_failure_in_last_step_shows_correct_failed_status_and_no_result_details():
    result = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_subprocess_steps/app_subprocess_steps.pex",
            "GREEN",
            "FAILED",
        ],
        encoding="utf-8",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    assert result.returncode == 0

    status = parse_json_lines(result.stdout, "status")
    assert status == "FAILED"

    results: List[Result] = parse_json_lines_into_list(result.stdout, "result", cls=Result)
    assert len(results) == 0
