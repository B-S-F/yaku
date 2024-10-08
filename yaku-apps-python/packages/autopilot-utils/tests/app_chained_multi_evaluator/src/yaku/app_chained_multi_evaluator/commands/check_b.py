import click
from loguru import logger
from yaku.autopilot_utils.results import RESULTS, Result

click_name = "check_b"
click_setup = [
    click.argument("arg_b", required=False),
]


def click_command(arg_b: str):
    logger.info(f"Doing some work in {click_name}")
    if arg_b is not None:
        logger.info(f"with {arg_b=}")
    RESULTS.append(
        Result(criterion="Criterion B", fulfilled=True, justification="Always works")
    )
