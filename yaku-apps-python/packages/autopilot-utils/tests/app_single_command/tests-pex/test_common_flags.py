# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

import importlib.resources
import subprocess


def test_pex_version_flag():
    file_version = importlib.resources.read_text("yaku.app_single_command", "_version.txt")
    output = subprocess.check_output(
        [
            "packages.autopilot-utils.tests.app_single_command/app_single_command.pex",
            "--version",
        ],
        encoding="utf-8",
        stderr=subprocess.STDOUT,
    )

    assert output.strip() == file_version.strip()


def test_pex_help_flag():
    output = subprocess.check_output(
        [
            "packages.autopilot-utils.tests.app_single_command/app_single_command.pex",
            "--help",
        ],
        encoding="utf-8",
        stderr=subprocess.STDOUT,
    )

    assert output.strip().startswith("Usage: ")
