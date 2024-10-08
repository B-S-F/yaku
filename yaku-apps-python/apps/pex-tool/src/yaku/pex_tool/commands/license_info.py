import zipfile
from pathlib import Path

import click
from loguru import logger

from ..utils.wheels import (
    as_json,
    get_nested_distinfo,
    get_pex_info,
    get_pex_wheel,
    get_wheels_info_from_pex_file,
)

click_name = "license-info"
click_help_text = "List all packages and licenses of the PEX file (wheels+pex+vendored)."

click_setup = [
    click.option(
        "-f",
        "--file",
        help="Pex file.",
        required=True,
        type=click.Path(exists=True, path_type=Path),
    ),
    click.option(
        "-o",
        "--output",
        help="Write JSON output to this file.",
        required=False,
        type=click.Path(path_type=Path),
    ),
]


def click_command(file: Path, output: Path | None):
    wheel_infos = []
    with zipfile.ZipFile(file, "r") as pex_file:
        # get info about contained wheels
        wheels = get_wheels_info_from_pex_file(
            zipfile.Path(pex_file),
            with_license_texts=True,
        )
        wheel_infos.extend(wheels)
        logger.debug(
            "Found included wheel distributions in file {pex_file}: {wheel_names}",
            pex_file=pex_file.filename,
            wheel_names=[w["Name"] for w in wheels],
        )

        # get used pex version
        pex_info = get_pex_info(zipfile.Path(pex_file))
        pex_version = pex_info["build_properties"]["pex_version"]
        logger.debug("Found pex bootstrapping code in version {v}", v=pex_version)

        # get info about contained pex bootstrapping and vendored libraries
        pex_wheel_path = get_pex_wheel(pex_version)
        with zipfile.ZipFile(str(pex_wheel_path), "r") as pex_wheel_file:
            nested_wheels = get_nested_distinfo(
                zipfile.Path(pex_wheel_file), with_license_texts=True
            )
            logger.debug(
                "Found nested wheels inside pex: {names}",
                names=[w["Name"] for w in nested_wheels],
            )
            wheel_infos.extend(nested_wheels)

    if output is None:
        print(as_json(wheel_infos))
    else:
        logger.info("Writing output to {file}", file=output)
        output.write_text(as_json(wheel_infos), encoding="utf8")
