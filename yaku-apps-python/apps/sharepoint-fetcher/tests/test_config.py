import ipaddress
from pathlib import Path, PosixPath

import pytest
import yaml
from _pytest.logging import LogCaptureFixture
from loguru import logger
from pydantic import ValidationError
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.sharepoint_fetcher.config import (
    ConfigFile,
    FileConfiguration,
    FileSelection,
    FilterConfigFile,
    FilterConfigFileContent,
    Settings,
)


@pytest.fixture
def loguru_caplog(caplog: LogCaptureFixture):
    handler_id = logger.add(
        caplog.handler,
        format="{message}",
        level=0,
        filter=lambda record: record["level"].no >= caplog.handler.level,
        enqueue=False,
    )
    yield caplog
    logger.remove(handler_id)


@pytest.fixture
def valid_config_file(tmp_path):
    config_data = {
        "is_cloud": True,
        "project_path": "Shared Documents/",
    }

    config_file_path = tmp_path / "valid_config_file.yaml"
    with open(config_file_path, "w") as config_file:
        yaml.dump(config_data, config_file)
    return config_file_path


@pytest.fixture
def invalid_format_config_file(tmp_path):
    config_data = [
        {
            "is_cloud": "abc",
            "project_path": True,
        }
    ]
    config_file_path = tmp_path / "invalid_format_config_file.yaml"
    with open(config_file_path, "w") as config_file:
        yaml.dump(config_data, config_file)
    return config_file_path


@pytest.fixture
def invalid_path_config_file(tmp_path):
    config_data = {
        "destination_path": "path",
        "output_dir": "dir/path",
    }
    config_file_path = tmp_path / "invalid_path_config_file.yaml"
    with open(config_file_path, "w") as config_file:
        yaml.dump(config_data, config_file)
    return config_file_path


@pytest.fixture
def valid_filter_config_file(tmp_path):
    filter_config_data = [
        {
            "files": "RevisionSet(1)/*.docx",
            "title": "Latest Process Status Document",
            "select": [
                {"property": "Workflow Status", "is-equal": "Valid"},
                {"property": "Modified", "is-not-older-than": "1 year"},
            ],
        },
        {"files": "ProjectCharter.pdf"},
        {
            "files": "SignedDocuments/*.pdf",
            "select": [{"property": "Size", "is-larger-than": "1024"}],
            "onlyLastModified": True,
        },
    ]
    filter_config_file_path = tmp_path / "valid_filter_config_file.yaml"
    with open(filter_config_file_path, "w") as filter_config_file:
        yaml.dump(filter_config_data, filter_config_file)
    return filter_config_file_path


@pytest.fixture
def invalid_filter_config_file(tmp_path):
    filter_config_data = [
        {
            "files": "RevisionSet(1)/*.docx",
            "title": "Latest Process Status Document",
            "select": "foo",
        },
        {"files": "ProjectCharter.pdf"},
        {
            "files": "SignedDocuments/*.pdf",
            "select": [{"property": "Size", "is-larger-than": "1024"}],
            "onlyLastModified": "bar",
        },
    ]
    filter_config_file_path = tmp_path / "invalid_filter_config_file.yaml"
    with open(filter_config_file_path, "w") as filter_config_file:
        yaml.dump(filter_config_data, filter_config_file)
    return filter_config_file_path


def test_FileSelection():
    # Test valid FileSelection instance
    file_selection = FileSelection(
        files="path/to/files",
        title="Example",
        select=[],
        onlyLastModified=True,
    )
    assert file_selection.files == "path/to/files"
    assert file_selection.title == "Example"
    assert file_selection.select == []
    assert file_selection.onlyLastModified is True

    # Test invalid FileSelection instance
    with pytest.raises(ValidationError):
        FileSelection(title="Example")


def test_FilterConfigFileContent():
    # Test valid FilterConfigFileContent instance
    file_selections_data = [
        {
            "files": "path/to/files",
            "title": "Example",
            "select": [],
            "onlyLastModified": True,
        }
    ]
    file_selections = list(FilterConfigFileContent(__root__=file_selections_data))
    assert len(file_selections) == 1
    assert isinstance(file_selections[0], FileSelection)

    # Test invalid FilterConfigFileContent instance
    with pytest.raises(ValidationError):
        FilterConfigFileContent(__root__=[123])


def test_FileConfiguration():
    # Test valid FileConfiguration instance
    file_configuration = FileConfiguration(
        destination_path="path/to/files",
        is_cloud=True,
        project_path="Shared/Documents",
        project_site="some/sharepoint/path",
        username="user",
        password="password",
        tenant_id="tenant_id",
        client_id="client_id",
        client_secret="client_secret",
        force_ip="0.0.0.0",
        download_properties_only=False,
        sharepoint_file="file",
        filter_config_file="filter_file",
        custom_properties=None,
    )

    assert file_configuration.destination_path == PosixPath("path/to/files")
    assert file_configuration.is_cloud is True
    assert file_configuration.project_path == "Shared/Documents"
    assert file_configuration.project_site == "some/sharepoint/path"
    assert file_configuration.username == "user"
    assert file_configuration.password == "password"
    assert file_configuration.tenant_id == "tenant_id"
    assert file_configuration.client_id == "client_id"
    assert file_configuration.client_secret == "client_secret"
    assert file_configuration.force_ip == "0.0.0.0"
    assert file_configuration.download_properties_only is False
    assert file_configuration.sharepoint_file == "file"
    assert file_configuration.filter_config_file == "filter_file"
    assert file_configuration.custom_properties == None

    # Test invalid FileConfiguration instance
    with pytest.raises(ValidationError):
        FileConfiguration(is_cloud="is_cloud")


def test_fileconfiguration_handles_alias_for_destination_path_correctly():
    file_configuration_w_dest_path = FileConfiguration(destination_path="path/to/files")
    file_configuration_w_output_dir = FileConfiguration(output_dir="path/to/files")
    assert file_configuration_w_dest_path == file_configuration_w_output_dir


def test_with_integer_as_selector_property():
    file_rules_data = [
        {
            "files": "path/to/file",
            "select": [
                [{"property": 1}],
            ],
        }
    ]
    with pytest.raises(ValidationError, match="__root__ -> 0 -> select -> 0"):
        FilterConfigFileContent(__root__=file_rules_data)


def test_FilterConfigFile(valid_filter_config_file, invalid_filter_config_file):
    # Test valid FilterConfigFile instance with a valid config file
    filter_config_file = FilterConfigFile(file_path=str(valid_filter_config_file))
    assert isinstance(filter_config_file.file_path, Path)
    assert isinstance(filter_config_file.content, FilterConfigFileContent)

    # Test valid FilterConfigFile instance with no config file
    filter_config_file = FilterConfigFile()
    assert filter_config_file.file_path is None
    assert filter_config_file.content is None

    # Test invalid FilterConfigFile instance with a non-existent config file
    with pytest.raises(AutopilotConfigurationError):
        FilterConfigFile(file_path="non_existent_file.yaml")

    # Test invalid FilterConfigFile instance with an invalid config file
    with pytest.raises(AutopilotConfigurationError):
        FilterConfigFile(file_path=str(invalid_filter_config_file))


def test_ConfigFile(
    loguru_caplog,
    valid_config_file,
    invalid_format_config_file,
    invalid_path_config_file,
    valid_filter_config_file,
    invalid_filter_config_file,
):
    # Test valid ConfigFile instance with a valid config file
    config_file = ConfigFile(file_path=str(valid_config_file))
    assert isinstance(config_file.file_path, Path)
    assert isinstance(config_file.content, FileConfiguration)

    # Test valid ConfigFile instance with no config file
    config_file = ConfigFile()
    assert config_file.file_path is None
    assert config_file.content is None

    # Test invalid ConfigFile instance with a non-existent config file
    with pytest.raises(AutopilotConfigurationError):
        ConfigFile(file_path="non_existent_file.yaml")

    # Test invalid ConfigFile instance with an invalid config file
    with pytest.raises(AutopilotConfigurationError):
        ConfigFile(file_path=str(invalid_format_config_file))

    # Test invalid ConfigFile instance with an invalid path in the config file
    with pytest.raises(AutopilotConfigurationError) as exc_info:
        ConfigFile(file_path=str(invalid_path_config_file))

    log_messages = loguru_caplog

    # Test valid ConfigFile instance with a valid filter config file that triggers a warning log
    config_file = ConfigFile(file_path=str(valid_filter_config_file))

    assert (
        "The environment variable 'SHAREPOINT_FETCHER_CONFIG_FILE' is no longer valid"
        in log_messages.text
    )
    # Test invalid ConfigFile instance with an invalid filter config file that triggers an error log
    with pytest.raises(AutopilotConfigurationError):
        ConfigFile(file_path=str(invalid_filter_config_file))

    assert "There seems to be an issue with the configuration file" in log_messages.text
    assert (
        "SHAREPOINT_FETCHER_CONFIG_FILE' or 'SHAREPOINT_FETCHER_FILTER_CONFIG_FILE' and that the file content is in the correct format"
        in log_messages.text
    )

    with open(invalid_path_config_file, "r") as file:
        invalid_path_config_data = yaml.safe_load(file)

    message = exc_info.value
    expected_message = (
        "The SharePoint path values do not match! The value of SHAREPOINT_FETCHER_DESTINATION_PATH is "
        f"{invalid_path_config_data.get('destination_path')}, while THE SHAREPOINT_FETCHER_OUTPUT_DIR is "
        f"{invalid_path_config_data.get('output_dir')}. You only need to specify one of these options since they have the same effect!"
    )

    assert str(message) == expected_message

    output_dir = "path/to/output/dir"
    destination_path = "path/to/destination"

    # Check if the destination_path and output_dir are synchronized if destination_path is None
    config_synchronize_destination_path = FileConfiguration(
        destination_path=None, output_dir=output_dir
    )

    assert config_synchronize_destination_path.destination_path == Path(output_dir)
    assert config_synchronize_destination_path.dict(by_alias=True).get("output_dir") == Path(
        output_dir
    )

    # Check if the destination_path and output_dir are synchronized if output_dir is None
    config_synchronize_output_dir = FileConfiguration(
        output_dir=None,
        destination_path=destination_path,
    )

    assert config_synchronize_output_dir.destination_path == Path(destination_path)
    assert config_synchronize_output_dir.dict(by_alias=True).get("output_dir") == Path(
        destination_path
    )


def _overwrite_variable(some_dict: dict, **kwargs) -> dict:
    other_dict = some_dict.copy()
    other_dict.update(**kwargs)
    return other_dict


def test_Settings():
    # Test valid Settings instance
    input_variables = {
        "destination_path": "/path/to/destination",
        "sharepoint_url": "https://example.com/site/test/folder/test.pdf",
        "sharepoint_path": "folder/test.pdf",
        "sharepoint_site": "https://example.com/site/test",
        "username": "user",
        "password": "password",
        "force_ip": "192.168.0.1",
        "custom_properties": "prop1=>list1=>item1|prop2=>list2=>item2",
        "download_properties_only": "true",
    }
    config_variables = Settings(**input_variables)
    assert isinstance(config_variables.destination_path, Path)
    assert config_variables.destination_path == Path("/path/to/destination")
    assert config_variables.sharepoint_url == "https://example.com/site/test/folder/test.pdf"
    assert config_variables.sharepoint_path == "folder/"
    assert config_variables.sharepoint_site == "https://example.com/site/test"
    assert config_variables.username == "user"
    assert config_variables.password == "password"
    assert isinstance(config_variables.force_ip, str)
    assert ipaddress.ip_address(config_variables.force_ip) == ipaddress.ip_address(
        "192.168.0.1"
    )
    assert config_variables.custom_properties == "prop1=>list1=>item1|prop2=>list2=>item2"
    assert config_variables.download_properties_only is True
    assert config_variables.sharepoint_file == "test.pdf"

    Settings(
        **_overwrite_variable(input_variables, sharepoint_path=None, sharepoint_site=None)
    )
    assert config_variables.sharepoint_path == "folder/"
    assert config_variables.sharepoint_site == "https://example.com/site/test"

    Settings(**_overwrite_variable(input_variables, is_cloud="false"))
    Settings(
        **_overwrite_variable(
            input_variables,
            is_cloud=True,
            sharepoint_url="https://example.com/:r:/r/site/test/folder/test.pdf",
        )
    )
    Settings(
        **_overwrite_variable(
            input_variables,
            is_cloud="1",
            sharepoint_url="https://example.com/:r:/r/site/test/folder/test.pdf",
        )
    )
    Settings(**_overwrite_variable(input_variables, is_cloud="0"))
    Settings(
        **_overwrite_variable(
            input_variables,
            is_cloud=1,
            sharepoint_url="https://example.com/:r:/r/site/test/folder/test.pdf",
        )
    )
    Settings(**_overwrite_variable(input_variables, is_cloud=0))

    # Test invalid Settings instances
    # Invalid force_ip
    with pytest.raises(AutopilotConfigurationError):
        Settings(**_overwrite_variable(input_variables, force_ip="invalid_ip"))

    # Invalid custom_properties
    with pytest.raises(AutopilotConfigurationError):
        Settings(
            **_overwrite_variable(input_variables, custom_properties="invalid_properties")
        )

    # Invalid download_properties_only
    with pytest.raises(ValidationError):
        Settings(
            **_overwrite_variable(input_variables, download_properties_only="invalid_value")
        )

    # Invalid sharepoint_file / sharepoint_path
    with pytest.raises(AutopilotConfigurationError):
        Settings(
            **_overwrite_variable(
                input_variables,
                sharepoint_url=None,
                sharepoint_path="invalid_sharepoint_path",
            )
        )

    # Invalid match between sharepoint_url and sharepoint_site
    with pytest.raises(AutopilotConfigurationError):
        Settings(
            **_overwrite_variable(
                input_variables,
                sharepoint_url="https://different-example.com/site/test/folder/test.pdf",
            )
        )
