# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

import importlib


def test_version():
    import yaku.autopilot_utils

    file_version = importlib.resources.read_text(
        "yaku.autopilot_utils", "_version.txt"
    ).strip()

    assert yaku.autopilot_utils.__version__ == file_version
