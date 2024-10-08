import json
import os
import re
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

import click
from dateutil.parser import parse
from loguru import logger
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.errors import AutopilotConfigurationError

from .commands import (
    create_outputs,
    fetch_splunk_data,
    parse_result_filename,
    write_output_file,
)

DEFAULT_PORT = 8089
DEFAULT_RESULT_FILE = "result_file.json"
DEFAULT_OUTPUT_FORMAT = "json"
DEFAULT_ONEQ_UPLOAD = False
DEFAULT_ANIMATIONS = True
DEFAULT_ONE_SHOT = False
DEFAULT_START_TIME = (datetime.now() - timedelta(days=1)).isoformat()
DEFAULT_END_TIME = datetime.now().isoformat()


def show_deprecation_message(ctx, option: click.Option, value):
    if ctx.get_parameter_source(option.name) != click.core.ParameterSource.DEFAULT:
        logger.warning(
            "Argument '{name}' is not used anymore. Please remove it!", name=option.name
        )
    return value


def validate_date_time(_, __, input: str):
    try:
        return parse(input).isoformat()
    except ValueError:
        raise click.UsageError("Please provide a valid date time")


def validate_hostname(ctx, param, value: str):
    """
    Sanitize hostname.

    The argument should only contain the host name, no protocol prefix and
    no port number.

    This function splits anything irrelevant away from the URL/hostname.
    """
    if re.match("https?://", value):
        url_parts = urlparse(value)
        return url_parts.hostname
    else:
        hostname, _, _ = value.partition(":")
        return hostname


class CLI:
    click_name = "splunk-fetcher"
    click_help_text = "Fetch Splunk query result as JSON or CSV"

    click_setup = [
        click.option("-q", "--query", help="Splunk query"),
        click.option(
            "--validate-results",
            help="Validate the number of received results. Does not work with one shot searches",
            default=False,
            is_flag=True,
        ),
        click.option("-f", "--file", help="File that contains the Splunk query"),
        click.option("-a", "--app", help="Splunk app name", required=True),
        click.option("-u", "--username", help="Splunk username"),
        click.option("-p", "--password", help="Splunk password"),
        click.option("-t", "--token", help="Splunk token"),
        click.option(
            "-h",
            "--host",
            help="Splunk host e.g. splunk.example.com",
            required=True,
            callback=validate_hostname,
        ),
        click.option("-P", "--port", help="Splunk port", default=DEFAULT_PORT),
        click.option(
            "-o",
            "--output-format",
            default=DEFAULT_OUTPUT_FORMAT,
            help="Output format",
            show_default=True,
            type=click.Choice(["json", "csv", "xml"], case_sensitive=False),
        ),
        click.option(
            "--force",
            is_flag=True,
            help="Force the overwrite of the output file",
            default=False,
        ),
        click.option(
            "-r",
            "--result-file",
            help="Splunk result file",
            default=DEFAULT_RESULT_FILE,
            callback=parse_result_filename,
        ),
        click.option(
            "--oneq-upload",
            is_flag=True,
            help="Upload the result to OneQ",
            default=DEFAULT_ONEQ_UPLOAD,
        ),
        click.option(
            "--animations/--no-animations",
            help="Disable animations",
            default=DEFAULT_ANIMATIONS,
            callback=show_deprecation_message,
        ),
        click.option(
            "--one-shot/--no-one-shot",
            help="One shot search",
            default=DEFAULT_ONE_SHOT,
        ),
        click.option(
            "--start-time",
            help="Start time for one shot search e.g. 2021-01-01",
            default=DEFAULT_START_TIME,
            callback=validate_date_time,
        ),
        click.option(
            "--end-time",
            help="End time for one shot search e.g. 2021-01-01",
            default=DEFAULT_END_TIME,
            callback=validate_date_time,
        ),
        click.option("--since", help="Set the start time to <since> days ago"),
    ]

    @staticmethod
    def click_command(
        query,
        validate_results,
        file,
        app,
        username,
        password,
        token,
        host,
        port,
        output_format,
        result_file,
        force,
        oneq_upload,
        animations,
        one_shot,
        start_time,
        end_time,
        since,
    ):
        check_inputs(query, file, username, password, token, app)
        if one_shot and validate_results:
            raise click.UsageError(
                "Validation of results is not supported for one shot searches"
            )
        output_path = get_output_path(result_file)
        logger.info("Output path is: {path}", path=output_path)
        if output_path.exists() and not force:
            raise AutopilotConfigurationError(
                f"File {output_path} already exists, aborting. "
                "If you want to overwrite the file, pass the --force flag."
            )
        if since:
            start_time = (datetime.now() - timedelta(days=int(since))).isoformat()
            logger.debug(f"Start time is set to {since} ago, {start_time}")
        if file:
            with open(file, "r") as f:
                query = f.read()
        logger.info("Fetching Splunk data...")
        splunk_data = fetch_splunk_data(
            query,
            username,
            password,
            token,
            host,
            port,
            output_format,
            app,
            one_shot,
            start_time,
            end_time,
            validate_results,
        )
        logger.info("Writing Splunk data to file")
        write_output_file(splunk_data, output_path)

        [print(json.dumps(output)) for output in create_outputs([output_path], oneq_upload)]


def check_inputs(
    query: str, file: str, username: str, password: str, token: str, app: str
) -> None:
    if (query and file) or (not query and not file):
        raise click.UsageError("Please provide either a query or a file")
    if not (username and password) and not token:
        raise click.UsageError(
            "Please provide either a token (and no username) or a username with a password"
        )
    if token and (username or password):
        raise click.UsageError(
            "Please provide either a token (and no username) or a username with a password"
        )
    if not app:
        raise click.UsageError("Please provide an app")


def get_output_path(result_file: str) -> Path:
    evidence_path = Path(".")
    if "evidence_path" in os.environ:
        evidence_path = Path(os.environ["evidence_path"])
    return evidence_path / result_file


main = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    main(auto_envvar_prefix="SPLUNK")
