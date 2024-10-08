from pathlib import Path
from urllib.error import URLError

from artifactory import ArtifactoryException, ArtifactoryPath, sha256sum
from loguru import logger
from yaku.autopilot_utils.errors import AutopilotError


def create_artifactory_client(
    artifactory_url: str,
    artifactory_repository_path: str,
    repository_name: str,
    artifactory_username: str,
    artifactory_password: str,
) -> ArtifactoryPath:
    """
    Login to artifactory.

    If successful, the url(path) will be returned otherwise exceptions will be
    thrown.
    """
    logger.debug("Logging in to Artifactory...")
    path = ArtifactoryPath(
        artifactory_url.rstrip("/")
        + "/"
        + repository_name
        + "/"
        + artifactory_repository_path,
        auth=(artifactory_username, artifactory_password),
    )
    if path.exists():
        path.touch()
        logger.debug("Login in Artifactory for '{url}' was successful", url=artifactory_url)
        return path
    else:
        raise URLError(f"The following URL does not exist in Artifactory: {path}")


def download_file(
    path: ArtifactoryPath, artifactory_repository_path: str, destination_path: Path
) -> str:
    """Download a single file from the Artifactory."""
    logger.debug("Downloading file '{path}' from Artifactory", path=path)
    artifactory_repository_path = artifactory_repository_path.rstrip("/")
    returned_list = artifactory_repository_path.split("/")
    artifactory_repository_path = returned_list[-1]

    if destination_path.exists():
        try:
            with path.open() as fd, Path.joinpath(
                destination_path, artifactory_repository_path
            ).open("wb") as out:
                out.write(fd.read())
                stat = path.stat()
            return str(stat.sha256)
        except ArtifactoryException as e:
            raise AutopilotError(
                f"Failed to download file '{artifactory_repository_path}'!"
            ) from e
    else:
        raise FileNotFoundError(f"Download directory '{destination_path}' does not exist!")


def get_file_checksum(destination_path: Path, artifactory_repository_path: str):
    """Get checksum of a file."""
    artifactory_repository_path = artifactory_repository_path.rstrip("/")
    returned_list = artifactory_repository_path.split("/")
    artifactory_repository_path = returned_list[-1]

    file_destination_path = Path.joinpath(destination_path, artifactory_repository_path)
    if file_destination_path.exists():
        if file_destination_path.is_file():
            return sha256sum(file_destination_path)
        else:
            raise FileNotFoundError(
                f"File '{file_destination_path}' exists but is not a file!"
            )
    else:
        raise FileNotFoundError(f"File '{file_destination_path}' does not exist!")
