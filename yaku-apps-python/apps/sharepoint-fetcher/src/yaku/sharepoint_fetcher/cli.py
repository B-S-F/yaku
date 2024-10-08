import json
import os
import urllib.parse
import warnings
from typing import Dict, Optional

import click
import requests
from loguru import logger
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.errors import AutopilotConfigurationError

from .config import ConfigFile, Settings
from .selectors import parse_config_file_data
from .sharepoint_factory import SharePointFetcherFactory
from .utils import PropertiesReader

warnings.filterwarnings("ignore")


################################################
# THE FOLLOWING FUNCTION WAS COPIED FROM
# yaku.sharepoint_EVALUATOR
# BECAUSE IT WAS NOT POSSIBLE TO IMPORT MODULES
# FROM OTHER PYTHON PACKAGES
################################################
def configure_properties_reader(reader: PropertiesReader, mapping_config: str):
    """
    Parse the mapping config given as string and configure reader.

    From the environment variable, the mapping is usually given as a three-tuple:

        file property name => SharePoint list title => property name of list item which contains item title

    This function parses the '|' separated three-tuples and throws away
    the last item of each tuple as it is only relevant for fetching the
    SharePoint list items.

    It then uses this list of tuples with

        file property name => SharePoint list title

    to configure the `PropertiesReader` instance via its `add_list_to_property_mapping` method.
    """
    items = [i.strip() for i in mapping_config.split("|")]
    for item in items:
        file_property_name, sharepoint_list_title, _ = item.split("=>", maxsplit=2)
        reader.add_list_to_property_mapping(
            sharepoint_list_title.strip(), file_property_name.strip()
        )


def create_property_title_mapping(text: Optional[str]) -> Dict[str, str]:
    """
    Parse the mapping given as string into a map.

    From the environment variable, the mapping is usually given as a three-tuple:

        file property name => SharePoint list title => property name of list item which contains item title

    This function parses the '|' separated three-tuples and throws away
    the first item of each tuple as it is only relevant for resolving
    the file properties.

    It then creates a map with

        SharePoint list title => property name of list item which contains item title

    as a Python dictionary and returns it.
    """
    mapping: Dict[str, str] = {}
    if text:
        items = [i.strip() for i in text.split("|")]
        for item in items:
            _, key, value = item.split("=>", maxsplit=2)
            mapping[key.strip()] = value.strip()
    return mapping


class CLI:
    click_name = "sharepoint-fetcher"
    click_help_text = "A fetcher to download the evidence files from the given url of an on-premise Sharepoint."

    click_setup = [
        click.option(
            "--project-url",
            required=False,
            help="SharePoint complete URL. Note: You cannot use this option together with --project-site or --project-path!",
        ),
        click.option(
            "--project-site",
            required=False,
            help="SharePoint site URL. Note: You cannot use this option together with --project-url but you need to provide --project-path!",
        ),
        click.option(
            "--project-path",
            required=False,
            help="SharePoint path to the folder e.g. Documents/MyFolder. Note: You cannot use this option together with --project-url but you need to provide --project-site!",
        ),
        click.option("--file", required=False, help="SharePoint file to download"),
        click.option(
            "--is-cloud",
            required=False,
            default=False,
            help="Boolean value to determine whether to fetch data from on-premise or cloud SharePoint instances",
        ),
        click.option("--username", required=False, help="Username to access SharePoint"),
        click.option("--password", required=False, help="Password to access SharePoint"),
        click.option("--tenant-id", required=False, help="Tenant ID to access SharePoint"),
        click.option("--client-id", required=False, help="Client ID to access SharePoint"),
        click.option(
            "--client-secret", required=False, help="Client secret to access SharePoint"
        ),
        click.option(
            "--destination-path",
            required=True,
            default=os.getcwd(),
            help="Path to the destination folder",
        ),
        click.option(
            "--force-ip", required=False, help="Force the IP address of the SharePoint server"
        ),
        click.option(
            "--custom-properties",
            required=False,
            help="Custom properties to be fetched from SharePoint",
        ),
        click.option(
            "--download-properties-only",
            required=False,
            help="Only download the properties of the files",
        ),
        click.option("--config-file", required=False, help="Path to the config file"),
    ]

    @staticmethod
    def click_command(
        project_url: str,
        project_site: str,
        project_path: str,
        file: str,
        is_cloud: bool,
        username: str,
        password: str,
        tenant_id: str,
        client_id: str,
        client_secret: str,
        destination_path: str,
        force_ip: str,
        custom_properties: str,
        download_properties_only: bool,
        config_file: str,
    ):
        logger.info("Configuring SharePoint Fetcher")
        settings = Settings(
            sharepoint_url=project_url,
            sharepoint_site=project_site,
            sharepoint_path=project_path,
            is_cloud=is_cloud,
            username=username,
            password=password,
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
            destination_path=destination_path,
            force_ip=force_ip,
            custom_properties=custom_properties,
            download_properties_only=download_properties_only,
            sharepoint_file=file,
        )
        parsed_config_file = ConfigFile(file_path=config_file)
        trigger_fetcher(parsed_config_file, settings)


def trigger_fetcher(config_file: ConfigFile, settings: Settings):
    """Triggers the fetching action."""
    config_file_data = None
    if config_file and config_file.content:
        config_file_data = parse_config_file_data(config_file.content)

    list_title_property_map = create_property_title_mapping(settings.custom_properties)
    sharepoint = SharePointFetcherFactory.selectSharepointInstance(
        settings, list_title_property_map, config_file_data
    )
    if settings.custom_properties:
        configure_properties_reader(sharepoint._properties_reader, settings.custom_properties)

    sharepoint.check_dir_access(settings.sharepoint_file)

    if settings.sharepoint_file:
        try:
            sharepoint.download_file(settings.sharepoint_path, settings.sharepoint_file)
            sharepoint.download_custom_property_definitions()
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 404:
                raise AutopilotConfigurationError(
                    "Given file was not found! If the URL is pointing to a "
                    "directory, make sure to append a '/' at the end!"
                ) from e
            else:
                raise
    else:
        sharepoint.download_custom_property_definitions()
        sharepoint.download_folder()

    if settings.sharepoint_path is not None and settings.sharepoint_site is not None:
        folder_path = settings.sharepoint_path
        if settings.sharepoint_file:
            if settings.is_cloud == True and settings.sharepoint_path.startswith("Documents/"):
                folder_path = "Shared " + settings.sharepoint_path
            file = (
                settings.sharepoint_site
                + "/"
                + urllib.parse.quote(folder_path)
                + urllib.parse.quote(settings.sharepoint_file)
            )
            output = {"output": {"fetched": file}}
        else:
            if settings.is_cloud == True and settings.sharepoint_path.startswith("Documents/"):
                folder_path = "Shared " + settings.sharepoint_path
            folder = settings.sharepoint_site + "/" + urllib.parse.quote(folder_path)
            output = {"output": {"fetched": folder}}
        print(json.dumps(output))
    else:
        raise AutopilotConfigurationError(
            "Missing values for the SharePoint site and path! Make sure you either provide the complete SharePoint URL or both the SharePoint site and path. You can provide the URL either as environment"
            + "variable SHAREPOINT_FETCHER_URL or as command line argument --project-url. In the same way, the site and path can be provided either as environment variables SHAREPOINT_FETCHER_PROJECT_SITE"
            + "and SHAREPOINT_FETCHER_PROJECT_PATH or as command line arguments --project-site and --project-path respectively."
        )


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    cli(auto_envvar_prefix="SHAREPOINT_FETCHER")
