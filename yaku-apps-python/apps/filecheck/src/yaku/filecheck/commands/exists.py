from pathlib import Path

import click
from loguru import logger
from yaku.autopilot_utils.results import RESULTS, Output, Result


def validate_file(ctx, param, value):
    value = value.strip()
    if not value:
        raise click.MissingParameter("Argument cannot be empty!", ctx, param)
    return Path(value)


click_name = "exists"
click_setup = [
    click.option("--glob", required=False, is_flag=True),
    click.argument(
        "file",
        required=True,
        type=click.Path(exists=False),
        callback=validate_file,
    ),
]


def click_command(glob: bool, file: Path) -> None:
    """Check existence of file."""
    logger.debug("Checking existence of file '{file}'...", file=file)
    verify_that_file_exists(file, glob)


def verify_that_file_exists(file: Path, glob: bool) -> None:
    if glob:
        results = list(file.parent.glob(file.name))
        nr_of_results = len(results)
        fulfilled = nr_of_results > 0
        if fulfilled:
            justification = (
                f"{nr_of_results} file(s) were found matching glob pattern `{file}`."
            )
            print(Output("files_found", [str(r) for r in results]).to_json())
            print(Output("count", nr_of_results).to_json())
        else:
            justification = f"No files were found matching glob pattern `{file}`!"
    else:
        fulfilled = file.exists()
        if fulfilled:
            justification = f"File `{file}` exists."
            print(Output("file_found", str(file)).to_json())
        else:
            justification = f"File `{file}` doesn't exist!"

    RESULTS.append(
        Result(
            criterion=f"File `{file}` must exist.",
            fulfilled=fulfilled,
            justification=justification,
            metadata={"check": "exist"},
        )
    )
