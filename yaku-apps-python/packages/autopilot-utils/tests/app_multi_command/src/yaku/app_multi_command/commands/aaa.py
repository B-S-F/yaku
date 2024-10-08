import click
from loguru import logger

click_name = "aaa"

click_help_text = "Help text for subcommand aaa"

click_setup = [
    click.argument("arga", required=False),
    click.option("--fail", is_flag=True),
]


def click_command(arga: str, fail: bool):
    logger.info("Doing some work in aaa")
    if fail:
        raise Exception("Failing as requested...")
    logger.info("Should be doing something useful here")
    if arga is not None:
        logger.info(f"with {arga=}")
