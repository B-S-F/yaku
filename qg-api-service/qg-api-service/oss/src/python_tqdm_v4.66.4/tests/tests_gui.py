# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

"""Test `tqdm.gui`."""
from .tests_tqdm import importorskip


def test_gui_import():
    """Test `tqdm.gui` import"""
    importorskip('tqdm.gui')
