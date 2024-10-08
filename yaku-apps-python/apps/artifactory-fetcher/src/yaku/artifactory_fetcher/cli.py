import json
import sys
from pathlib import Path

import click
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.environment import require_environment_variable
from yaku.autopilot_utils.errors import AutopilotFailure

from .artifactory_fetcher import (
    create_artifactory_client,
    download_file,
    get_file_checksum,
)


class CLI:
    click_name = "artifactory-fetcher"

    click_help_text = "Fetch files from Artifactory."

    click_setup = [
        click.option("--username", envvar="ARTIFACTORY_USERNAME"),
        click.option("--password", envvar="ARTIFACTORY_API_KEY"),
        click.option("--url", envvar="ARTIFACTORY_URL"),
        click.option("--path", envvar="ARTIFACT_PATH"),
        click.option("--repository", envvar="REPOSITORY_NAME"),
    ]

    @staticmethod
    def click_command(username: str, password: str, url: str, path: str, repository: str):
        """Trigger the fetching action."""
        # TODO: remove evidence_path and replace by current directory
        destination_path = Path(require_environment_variable("evidence_path"))

        artifactory_path = create_artifactory_client(
            url,
            path,
            repository,
            username,
            password,
        )

        checksum_downloaded_file = download_file(artifactory_path, path, destination_path)

        checksum_file_found = get_file_checksum(destination_path, path)

        if checksum_downloaded_file == checksum_file_found:
            path = path.rstrip("/")
            returned_list = path.split("/")
            path = returned_list[-1]
            output = {"output": {"fetched": str(Path.joinpath(destination_path, path))}}
            json.dump(output, sys.stdout)
            print()
            return

        raise AutopilotFailure(
            f"Checksum for file '{path}' can not be verified! Fetched file is corrupted."
        )


main = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    main()
