from pathlib import Path

import click
from loguru import logger
from yaku.autopilot_utils.results import RESULTS, Result

click_name = "size"
click_setup = [
    click.argument("file", required=True, type=click.Path(exists=True, path_type=Path)),
    click.option("--min", required=False, type=int),
    click.option("--max", required=False, type=int),
]


def click_command(file: Path, min: int, max: int) -> None:
    """Check size of file."""
    logger.debug("Checking size of file `{file}`...", file=file)
    verify_size_of_file(file, min_size=min, max_size=max)


def verify_size_of_file(file: Path, min_size: int | None, max_size: int | None) -> None:
    file_size = file.stat().st_size
    criteria = []
    fulfilled = True
    if min_size is not None:
        if file_size < min_size:
            fulfilled = False
        criteria.append(f"should be at least {min_size} bytes large")
    if max_size is not None:
        if file_size > max_size:
            fulfilled = False
        criteria.append(f"should not be larger than {max_size} bytes")
    RESULTS.append(
        Result(
            criterion=f"File `{file}` " + " and ".join(criteria) + ".",
            fulfilled=fulfilled,
            justification=f"File `{file}` has a size of {file_size} bytes.",
            metadata={"check": "size"},
        )
    )
