import pkgutil
import sys
import textwrap
from pathlib import Path

from loguru import logger
from yaku.autopilot_utils.cli_base import (
    CliModule,
    VersionedClickCommandProvider,
    make_autopilot_app,
    read_version_from_package,
)

HELP_TEXT = r"""
Usage: papsr PYTHONFILE [ARGS]

Loads a Yaku app from a Python module file. Then passes the extra args to the
loaded app.  The module must contain a `CLI` class which has all necessary
fields:

- click_help_text - displays command line usage info
- version - version of the CLI
- click_name - name of the CLI
- click_setup - list of `click.Argument` or `click.Option` instances
- click_command - main CLI function, gets the parameters defined in `click_setup`
- click_evaluator_callback - gets a list of results collected in `click_command`
  and must return a tuple with a status string and a reason string.
"""


SAMPLE_CODE = r"""
import click
from loguru import logger

from yaku.autopilot_utils.results import DEFAULT_EVALUATOR, RESULTS, Result

class CLI:
    click_help_text = "Some sample CLI"
    version = "0.1"
    click_name = "samplecli"
    click_setup = [click.option("--fail", required=False, is_flag=True)]

    def click_command(fail):
        logger.debug("Inside click_command function")
        RESULTS.append(
            Result(
                criterion="Fail flag was not set",
                fulfilled=not fail,
                justification=f"Fail flag was set to: {fail}",
            )
        )

    click_evaluator_callback = DEFAULT_EVALUATOR
"""


def make_click_app(cli: VersionedClickCommandProvider):
    cli_main = make_autopilot_app(
        provider=cli,
        version_callback=lambda: cli.version,
    )
    return cli_main


def get_cli_from_module(module: CliModule) -> VersionedClickCommandProvider:
    try:
        return module.CLI
    except AttributeError:
        raise RuntimeError(f"Provided module `{module}` must have a CLI class!")


def load_module(p: Path):
    sys.path.append(str(p.parent))
    return __import__(p.stem)


def load_cli(cli_module_file: Path) -> VersionedClickCommandProvider:
    if not cli_module_file.exists():
        raise FileNotFoundError(f"Could not find CLI module file {cli_module_file}")

    cli_module = load_module(cli_module_file)

    try:
        cli_module.__file__
    except AttributeError:
        raise ImportError(
            f"Cannot import module `{cli_module_file.resolve()}`! "
            f"It is shadowed by the built-in module `{cli_module.__name__}`. "
            f"Please rename your file `{cli_module_file}` to a unique name!"
        )
    if Path(cli_module.__file__).resolve() != cli_module_file.resolve():
        raise ImportError(
            f"Cannot import module `{cli_module_file.resolve()}`! "
            f"It is shadowed by the built-in module `{cli_module.__file__}`. "
            f"Please rename your file `{cli_module_file}` to a unique name!"
        )
    cli = get_cli_from_module(cli_module)
    return cli


def main():
    if len(sys.argv) == 1:
        sys.stderr.write(HELP_TEXT)
        sys.stderr.write("\nSee below for sample code:\n")
        sys.stderr.write(textwrap.indent(SAMPLE_CODE, "    "))
        logger.disable("yaku.autopilot_utils")
        version = read_version_from_package("yaku.papsr")()
        logger.enable("yaku.autopilot_utils")
        sys.stderr.write(f"\n\nVersion: {version}\n")
        sys.stderr.write("Builtin packages:\n")
        installed_packages = list(pkgutil.iter_modules())
        for p in sorted(installed_packages, key=lambda p: p.name):
            if sys.prefix in p.module_finder.path:  # type: ignore
                continue
            if p.name.startswith("__"):
                continue
            sys.stderr.write(f"- {p.name}\n")
        sys.exit(1)
    if len(sys.argv) == 2 and sys.argv[1] in ["--version"]:
        version = read_version_from_package("yaku.papsr")()
        sys.stdout.write(f"{version}")
        sys.exit(0)

    cli = load_cli(Path(sys.argv[1]))
    return make_click_app(cli)(sys.argv[2:])


if __name__ == "__main__":
    main()
