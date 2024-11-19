# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

"""Test `tqdm.tk`."""
from .tests_tqdm import importorskip


def test_tk_import():
    """Test `tqdm.tk` import"""
    importorskip('tqdm.tk')
