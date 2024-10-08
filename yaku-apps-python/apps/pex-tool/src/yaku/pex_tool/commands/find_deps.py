import re
import zipfile
from pathlib import Path

import click
from loguru import logger
from packaging.specifiers import SpecifierSet
from packaging.version import parse

from ..utils.wheels import as_json, get_wheels_info_from_pex_file

click_name = "find-deps"
click_help_text = "Look for a certain library/dependency in all pex files in a folder."

click_setup = [
    click.option(
        "-d",
        "--dir",
        help="Starting directory for scanning recursively for pex files.",
        required=True,
        type=click.Path(exists=True, path_type=Path),
    ),
    click.option(
        "-l",
        "--lib",
        help="Library to look for. Can be an expression like `requests<=1.27`, "
        "but make sure to properly protect it from shell redirection!",
        required=True,
    ),
    click.option(
        "-o",
        "--output",
        help="Write JSON output to this file.",
        required=False,
        type=click.Path(path_type=Path),
    ),
]


def find_pex_files(path: Path):
    return list(filter(lambda x: x.suffix == ".pex", path.rglob("*")))


def normalize_package_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def matches_wheel(package_name: str, version_spec: str | None, wheel_metadata: dict):
    specifier_set = None
    if version_spec is not None:
        specifier_set = SpecifierSet(version_spec)
    if normalize_package_name(wheel_metadata["name"]) == normalize_package_name(package_name):
        if specifier_set is None:
            return True
        elif parse(wheel_metadata["version"]) in specifier_set:
            return True
    return False


def click_command(dir: Path, lib: str, output: Path | None):
    parts = re.match(
        "^(?P<name>([A-Z0-9]*|[A-Z0-9][A-Z0-9._-]*[A-Z0-9]))"
        "(?P<spec>\\s*((?P<op>~=|==|!=|<=|>=|<|>|===)\\s*.*))?",
        lib,
        re.IGNORECASE,
    )
    if not parts:
        raise ValueError(
            f"Could not parse package spec: {lib}. Please make sure that it is in the correct "
            "format, e.g. see https://packaging.python.org/en/latest/specifications/version-specifiers/"
        )
    lib_name = parts.group("name")
    lib_version_spec = parts.group("spec")
    pex_files = find_pex_files(dir)
    result = []
    for pex_file in pex_files:
        with zipfile.ZipFile(pex_file, "r") as f:
            wheels = get_wheels_info_from_pex_file(zipfile.Path(f), with_license_texts=False)
            filtered_wheels = filter(
                lambda w: matches_wheel(lib_name, lib_version_spec, w), wheels
            )
            for w in filtered_wheels:
                result.append(
                    {
                        "pex_file": str(pex_file),
                        "dependency": {"name": w["name"], "version": w["version"]},
                    }
                )
    if output is None:
        print(as_json(result))
    else:
        logger.info("Writing output to {file}", file=output)
        output.write_text(as_json(result), encoding="utf8")
