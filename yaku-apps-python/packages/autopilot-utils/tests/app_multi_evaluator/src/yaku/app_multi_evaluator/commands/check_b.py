from typing import Tuple

import click
from loguru import logger
from yaku.autopilot_utils.results import RESULTS, Result, ResultsCollector

click_name = "check_b"
click_setup = [
    click.argument("arg_b", required=False),
]


def click_evaluator_callback(results: ResultsCollector) -> Tuple[str, str]:
    logger.info("Aggregating results to check_b evaluator status/reason")
    if all([r.fulfilled for r in results]):
        return "GREEN", "All criteria are fulfilled."
    return "RED", "Not all criteria are fulfilled!"


def click_command(arg_b: str):
    logger.info(f"Doing some work in {click_name}")
    if arg_b is not None:
        logger.info(f"with {arg_b=}")
    RESULTS.append(
        Result(criterion="A criterion", fulfilled=True, justification="Always works")
    )
