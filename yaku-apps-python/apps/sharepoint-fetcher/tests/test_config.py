import ipaddress
from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.sharepoint_fetcher.config import (
    ConfigFile,
    ConfigFileContent,
    FileSelection,
    Settings,
)


@pytest.fixture
def valid_config_file(tmp_path):
    config_data = [
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
    config_file_path = tmp_path / "valid_config_file.yaml"
    with open(config_file_path, "w") as config_file:
        yaml.dump(config_data, config_file)
    return config_file_path


@pytest.fixture
def invalid_config_file(tmp_path):
    config_data = [
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
    config_file_path = tmp_path / "invalid_config_file.yaml"
    with open(config_file_path, "w") as config_file:
        yaml.dump(config_data, config_file)
    return config_file_path


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


def test_ConfigFileContent():
    # Test valid ConfigFileContent instance
    file_selections_data = [
        {
            "files": "path/to/files",
            "title": "Example",
            "select": [],
            "onlyLastModified": True,
        }
    ]
    file_selections = list(ConfigFileContent(__root__=file_selections_data))
    assert len(file_selections) == 1
    assert isinstance(file_selections[0], FileSelection)

    # Test invalid ConfigFileContent instance
    with pytest.raises(ValidationError):
        ConfigFileContent(__root__=[123])


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
        ConfigFileContent(__root__=file_rules_data)


def test_ConfigFile(valid_config_file, invalid_config_file):
    # Test valid ConfigFile instance with a valid config file
    config_file = ConfigFile(file_path=str(valid_config_file))
    assert isinstance(config_file.file_path, Path)
    assert isinstance(config_file.content, ConfigFileContent)

    # Test valid ConfigFile instance with no config file
    config_file = ConfigFile()
    assert config_file.file_path is None
    assert config_file.content is None

    # Test invalid ConfigFile instance with a non-existent config file
    with pytest.raises(AutopilotConfigurationError):
        ConfigFile(file_path="non_existent_file.yaml")

    # Test invalid ConfigFile instance with an invalid config file
    with pytest.raises(AutopilotConfigurationError):
        ConfigFile(file_path=str(invalid_config_file))


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
                input_variables, sharepoint_url=None, sharepoint_path="invalid_sharepoint_path"
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
