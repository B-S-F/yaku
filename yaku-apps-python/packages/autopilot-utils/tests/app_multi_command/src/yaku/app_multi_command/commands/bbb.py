# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

import click
from loguru import logger

click_name = "bbb"
click_setup = [
    click.argument("argb", required=False),
]


def click_command(argb: str):
    logger.info("Doing some work in bbb")
