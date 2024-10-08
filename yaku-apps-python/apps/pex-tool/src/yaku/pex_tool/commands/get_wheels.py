import zipfile
from pathlib import Path

import click
from loguru import logger

from ..utils.wheels import as_json, get_wheels_info_from_pex_file

click_name = "get-wheels"
click_help_text = "List all contained wheel distributions inside a PEX file."

click_setup = [
    click.option(
        "-f",
        "--file",
        help="Pex file.",
        required=True,
        type=click.Path(exists=True, path_type=Path),
    ),
    click.option(
        "-l",
        "--include-licenses",
        help="Include license texts.",
        required=False,
        is_flag=True,
    ),
    click.option(
        "-o",
        "--output",
        help="Write JSON output to this file.",
        required=False,
        type=click.Path(path_type=Path),
    ),
]


def click_command(file: Path, include_licenses: bool, output: Path | None):
    with zipfile.ZipFile(file, "r") as pex_file:
        result = get_wheels_info_from_pex_file(
            zipfile.Path(pex_file),
            with_license_texts=include_licenses,
        )
        if output is None:
            print(as_json(result))
        else:
            logger.info("Writing output to {file}", file=output)
            output.write_text(as_json(result), encoding="utf8")
