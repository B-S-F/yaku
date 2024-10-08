import os

import click
from loguru import logger
from yaku.autopilot_utils.checks import check
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.autopilot_utils.results import RESULTS, Result

from .config import ConfigFile, Settings
from .rules import read_file_rules
from .utils import PropertiesReader


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
        try:
            file_property_name, sharepoint_list_title, _ = item.split("=>", maxsplit=2)
        except ValueError:
            raise AutopilotConfigurationError(
                f"Could not parse title mapping: {item}. "
                "It must have the format PropertyName=>ListTitle=>ListItemTitlePropertyName.",
            )
        reader.add_list_to_property_mapping(
            sharepoint_list_title.strip(), file_property_name.strip()
        )


all_green = True
some_yellow = False


class CLI:
    click_name = "sharepoint-evaluator"
    click_help_text = (
        "An evaluator to evaluate properties of files downloaded by the sharepoint-fetcher."
    )

    click_setup = [
        click.option(
            "--config-file",
            required=True,
            help="Path to the config file.",
            envvar="SHAREPOINT_EVALUATOR_CONFIG_FILE",
        ),
        click.option(
            "--custom-properties",
            required=False,
            help="Custom properties mapping.",
            envvar="SHAREPOINT_FETCHER_CUSTOM_PROPERTIES",
        ),
        click.option(
            "--evidence-path",
            required=False,
            help="Path to the evidence folder.",
            envvar="evidence_path",
        ),
    ]

    @staticmethod
    def click_command(
        config_file: str,
        custom_properties: str,
        evidence_path: str,
    ):
        if not evidence_path:
            evidence_path = os.getcwd()
        settings = Settings(
            evidence_path=evidence_path,
            custom_properties=custom_properties,
        )
        parsed_config_file = ConfigFile(
            file_path=config_file,
        )
        sharepoint_evaluator(settings, parsed_config_file)

    @staticmethod
    def click_evaluator_callback(results):
        global all_green, some_yellow
        if not all_green:
            return "RED", "Not all configured checks are fulfilled!"
        else:
            if some_yellow:
                return "YELLOW", "Some mentioned files did not have any rules."
            else:
                return "GREEN", "All configured checks are fulfilled!"


def sharepoint_evaluator(settings: Settings, config_file: ConfigFile):
    if not config_file.content:
        raise AutopilotConfigurationError(f"Config file `{config_file.file_path}` is empty!")
    file_rules = read_file_rules(config_file.content, base_path=settings.evidence_path)

    properties_file = settings.evidence_path / "__custom_property_definitions__.json"
    reader = PropertiesReader(properties_file)

    # TODO: can't we store the custom_properties into the properties_file above?
    # so that the user doesn't have to provide them twice?

    if settings.custom_properties:
        configure_properties_reader(reader, settings.custom_properties)

    # iterate over all files and check the rules
    global all_green, some_yellow
    all_green = True
    some_yellow = False
    for file_rule in file_rules:
        file_filter = file_rule.file
        # TODO: rewrite the glob here to properly deal with wildcards in folder names
        # TODO: rewrite the glob here to find files for which only a properties json file was downloaded
        found_files = list(file_filter.parent.glob(file_filter.name))
        if not found_files:
            msg = (
                f"File filter `{file_filter.relative_to(settings.evidence_path)}` mentioned in the config file "
                f"`{config_file.file_path}` did not match any files!"
            )
            if file_rule.rules:
                msg += (
                    " (Note: even if some of the files are matching the filter expression, it could"
                    " be that they didn't match some of the property filter rules, which are: "
                )
                msg += ", ".join([r.nice() for r in file_rule.rules])
                msg += ")"
            raise AutopilotConfigurationError(msg)
        for file in found_files:
            if file.name.endswith(".__properties__.json"):
                # TODO: remove once the TODOs above are resolved and new glob doesn't match properties json files
                continue
            if not file_rule.rules:
                some_yellow = True
                logger.warning(
                    "Config has no rules for file {}", file.relative_to(settings.evidence_path)
                )
                RESULTS.append(
                    Result(
                        criterion=f"Config has no rules for file `{file.relative_to(settings.evidence_path)}`",
                        fulfilled=False,
                        justification=f"Config has no rules for file `{file.relative_to(settings.evidence_path)}`",
                    )
                )
            for rule in file_rule.rules:
                property_value = reader.get_file_property(file, rule.property)
                success = check(
                    checked_value=property_value,
                    operator=rule.operator,
                    other_value=rule.other_value,
                )
                justification = f"Check of rule ({rule.nice()}) for `{file.relative_to(settings.evidence_path)}` with value `{property_value}` "
                fulfilled = False
                if not success:
                    justification += "was not successful!"
                    all_green = False
                else:
                    justification += "was successful."
                    fulfilled = True
                RESULTS.append(
                    Result(
                        criterion=f"Check of {rule.nice()} must be successful",
                        fulfilled=fulfilled,
                        justification=justification,
                    )
                )


main = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    main()
