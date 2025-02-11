# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

import subprocess

from yaku.autopilot_utils.results import assert_result_status


def test_pex_runs_normally_with_green_result():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_super_simple_evaluator/app_super_simple_evaluator.pex",
            "--no-colors",
        ],
        encoding="utf-8",
        capture_output=True,
    )
    assert process.returncode == 0
    assert process.stderr == ""
    assert "Inside click_command" in process.stdout
    assert "Doing some evaluations" in process.stdout
    assert_result_status(process.stdout, "GREEN")


def test_pex_runs_normally_with_red_result():
    process = subprocess.run(
        [
            "packages.autopilot-utils.tests.app_super_simple_evaluator/app_super_simple_evaluator.pex",
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
    assert_result_status(process.stdout, "RED")
