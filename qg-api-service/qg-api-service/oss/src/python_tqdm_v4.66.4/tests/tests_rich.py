# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

"""Test `tqdm.rich`."""
from .tests_tqdm import importorskip


def test_rich_import():
    """Test `tqdm.rich` import"""
    importorskip('tqdm.rich')
