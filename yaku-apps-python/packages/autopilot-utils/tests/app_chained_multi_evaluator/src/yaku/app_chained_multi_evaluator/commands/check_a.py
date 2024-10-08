import click
from loguru import logger
from yaku.autopilot_utils.results import RESULTS, Result

click_name = "check_a"

click_setup = [
    click.argument("arg_a", required=False),
    click.option("--fail", is_flag=True),
    click.option("--red", is_flag=True),
]


def click_command(arg_a: str, fail: bool, red: bool):
    logger.info(f"Doing some work in {click_name}")
    if fail:
        raise Exception("Failing as requested...")
    logger.info("Should be doing something useful here")
    if arg_a is not None:
        logger.info(f"with {arg_a=}")
    RESULTS.append(
        Result(criterion="Criterion A", fulfilled=not red, justification="Works in test")
    )
