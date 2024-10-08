import logging
from pathlib import Path

from pydantic import validate_arguments
from yaku.autopilot_utils.results import Output

from ..client.sharepoint import Settings, SharepointClient


@validate_arguments()
def upload_files(
    files: list[str], sharepoint_config: Settings, sharepoint_path: str, force: bool
):
    """Upload files to SharePoint."""
    logger = logging.getLogger()
    logger.debug("Upload files: %s", files)
    file_paths = [Path(file) for file in files]
    logger.info("Upload files to SharePoint")
    connection = SharepointClient(sharepoint_config)
    for file_path in file_paths:
        logger.info("Uploading %s", file_path)
        connection.upload_file(file_path, sharepoint_path, force)

        # Print uploaded files as outputs - this is related to a requirement by XC-DX so that
        # the list of uploaded files (and URLs) appear in OneQ. The OneQ finalizer doesn't
        # show the console log of an autopilot, but I have modified it to include the outputs.
        # (status, reason and results are already shown).
        print(
            Output(
                f"{file_path.name}",
                f"{sharepoint_config.sharepoint_project_site}/{sharepoint_path}/{file_path.name}",
            ).to_json()
        )

    logger.info("Upload complete")


@validate_arguments()
def upload_directory(
    folder: str, sharepoint_config: Settings, sharepoint_path: str, force: bool
):
    """Upload a folder to SharePoint."""
    logger = logging.getLogger()
    logger.debug("Upload folder: %s", folder)
    folder_path = Path(folder)
    logger.info("Upload folder to SharePoint")
    connection = SharepointClient(sharepoint_config)
    logger.info("Uploading folder %s", folder_path)
    connection.upload_directory(folder_path, sharepoint_path, force)
    logger.info("Upload complete")
