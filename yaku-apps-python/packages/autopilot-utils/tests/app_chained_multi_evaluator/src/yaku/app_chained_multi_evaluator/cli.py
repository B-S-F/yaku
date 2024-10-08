from typing import Tuple

import click
from loguru import logger
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import ResultsCollector

from .commands import check_a, check_b


class CLI:
    click_name = "app_multi_evaluator"
    click_help_text = (
        "Simple demo program for test purposes with two evaluators as subcommands."
    )

    click_setup = [
        click.option("--fail", is_flag=True),
    ]

    click_subcommands = [check_a, check_b]

    @staticmethod
    def click_evaluator_callback(results: ResultsCollector) -> Tuple[str, str]:
        logger.info("Aggregating results to final evaluator status/reason")
        if all([r.fulfilled for r in results]):
            return "GREEN", "All criteria are fulfilled."
        return "RED", "Not all criteria are fulfilled!"


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    cli()
