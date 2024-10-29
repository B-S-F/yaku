import logging
import os
import sys

import click
from pydantic import ValidationError

from .client.sharepoint import Settings
from .commands.upload import upload_directory as upload_directory_command
from .commands.upload import upload_files as upload_files_command

COLORS_ENABLED = True


def print_version(ctx, param, value):
    import importlib.resources

    if not value or ctx.resilient_parsing:
        return
    version = importlib.resources.read_text("yaku.sharepoint", "_version.txt")
    click.echo(version.strip())
    ctx.exit()


@click.group(invoke_without_command=True, no_args_is_help=True)
@click.option(
    "--version",
    is_flag=True,
    callback=print_version,
    expose_value=False,
    is_eager=True,
    help="Output version information and exit",
)
def sharepoint():
    pass


@sharepoint.command(no_args_is_help=True)
@click.option("file", "--file", multiple=True, help="File to upload", required=True)
@click.option(
    "sharepoint_path", "--sharepoint-path", "-p", help="SharePoint path", required=True
)
@click.option(
    "force",
    "--force",
    "-f",
    is_flag=True,
    default=False,
    help="Force upload even if file exists",
)
@click.option(
    "--colors/--no-colors",
    default=True,
    help="Enable or disable colors in output",
)
def upload_files(file: list[str], sharepoint_path: str, force: bool, colors: bool):
    """Upload files to SharePoint."""
    global COLORS_ENABLED
    COLORS_ENABLED = colors
    upload_files_command(file, Settings(), sharepoint_path, force)


@sharepoint.command(no_args_is_help=True)
@click.argument("folder")
@click.option(
    "sharepoint_path", "--sharepoint-path", "-p", help="SharePoint path", required=True
)
@click.option(
    "force",
    "--force",
    "-f",
    is_flag=True,
    default=False,
    help="Force upload even if folder exists",
)
@click.option(
    "--colors/--no-colors",
    default=True,
    help="Enable or disable colors in output",
)
def upload_folder(folder: str, sharepoint_path: str, force: bool, colors: bool):
    """Upload a folder to SharePoint."""
    global COLORS_ENABLED
    COLORS_ENABLED = colors
    upload_directory_command(folder, Settings(), sharepoint_path, force)


if __name__ == "__main__":
    log_level = os.getenv("LOG_LEVEL", "INFO")
    if log_level == "DEBUG":
        logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    else:
        logging.basicConfig(stream=sys.stdout, level=logging.INFO, format="%(message)s")
    try:
        sharepoint()
    except ValidationError as e:
        if COLORS_ENABLED:
            click.secho(f"Configuration Error: {e}", fg="red", err=True)
        else:
            click.secho(f"Configuration Error: {e}", err=True)
        if log_level == "DEBUG":
            raise e
        exit(1)
    except Exception as e:
        if COLORS_ENABLED:
            click.secho(f"Error: {e}", fg="red", err=True)
        else:
            click.secho(f"Error: {e}", err=True)
        if log_level == "DEBUG":
            raise e
        exit(1)
