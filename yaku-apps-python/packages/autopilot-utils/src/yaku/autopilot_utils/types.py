# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

from typing import Callable, Optional, Protocol


class ClickSubCommandProvider(Protocol):
    click_name: str
    click_setup: Optional[list[Callable]]
    click_command: Optional[Callable]


class ClickCommandProvider(Protocol):
    click_name: str
    click_help_text: str = ""
    # click_setup: Optional[list[Callable]]
    # click_command: Optional[Callable]
    # click_evaluator_callback: Optional[ResultHandler]
    # click_subcommands: Optional[List[ClickSubCommandProvider]]


class VersionedClickCommandProvider(ClickCommandProvider):
    version: str


class CliModule(Protocol):
    """Type for a CLI provider given in :py:func:`make_autopilot_app`. Must have a `CLI` attribute."""

    CLI: VersionedClickCommandProvider
