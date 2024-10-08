import click
from loguru import logger
from yaku.autopilot_utils.results import RESULTS, Result

click_name = "check"
click_setup = [
    click.argument("sequence"),
]


def click_command(sequence: str):
    """Simulate some checks."""
    logger.info(f"Starting '{click_name}' command...")
    for i, s in enumerate(sequence):
        if s not in ("y", "n"):
            logger.warning(
                "Ignoring sequence character {s} for fulfillment value. Only 'y' or 'n' are allowed."
            )
            continue

        result = Result(
            criterion=f"Criterion {i}", fulfilled=(s == "y"), justification="As given."
        )
        logger.info(f"Producing result: {result}")
        RESULTS.append(result)

    logger.info(f"Finished '{click_name}' command...")
