from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError
from yaku.sharepoint_evaluator.config import (
    ConfigFile,
    ConfigFileContent,
    FileRules,
    Settings,
)


@pytest.fixture
def valid_config_file(tmp_path):
    config_data = [
        {
            "file": "ProcessStatus.docx",
            "rules": [
                {"property": "Date", "is-equal": "Valid"},
                {"property": "Modified", "is-not-older-than": "1 year"},
            ],
        }
    ]
    config_file_path = tmp_path / "valid_config_file.yaml"
    with open(config_file_path, "w") as config_file:
        yaml.dump(config_data, config_file)
    return config_file_path


@pytest.fixture
def invalid_config_file(tmp_path):
    config_data = [
        {
            "file": "ProcessStatus.docx",
            "rules": [],
        },
        {
            "files": "ProcessStatus.docx",
            "rules": "invalid",
        },
    ]
    config_file_path = tmp_path / "invalid_config_file.yaml"
    with open(config_file_path, "w") as config_file:
        yaml.dump(config_data, config_file)
    return config_file_path


def test_FileRules():
    # Test valid FileSelection instance
    file_selection = FileRules(file="path/to/file", rules=[])
    assert file_selection.file == "path/to/file"
    assert file_selection.rules == []

    # Test invalid FileSelection instance
    with pytest.raises(ValidationError):
        FileRules()


def test_ConfigFileContent():
    # Test valid ConfigFileContent instance
    file_selections_data = [
        {
            "file": "path/to/file",
            "rules": [],
        }
    ]
    file_selections = list(ConfigFileContent(__root__=file_selections_data))
    assert len(file_selections) == 1
    assert isinstance(file_selections[0], FileRules)

    # Test invalid ConfigFileContent instance
    with pytest.raises(ValidationError):
        ConfigFileContent(__root__=[123])


def test_with_integer_as_selector_property():
    file_rules_data = [
        {
            "file": "path/to/file",
            "rules": [
                [{"property": 1}],
            ],
        }
    ]
    with pytest.raises(ValidationError, match="__root__ -> 0 -> rules -> 0"):
        ConfigFileContent(__root__=file_rules_data)


def test_ConfigFile(valid_config_file, invalid_config_file):
    # Test valid ConfigFile instance with a valid config file
    config_file = ConfigFile(file_path=str(valid_config_file))
    assert isinstance(config_file.file_path, Path)
    assert isinstance(config_file.content, ConfigFileContent)

    # Test invalid ConfigFile instance with a non-existent config file
    with pytest.raises(ValidationError):
        ConfigFile(file_path="non_existent_file.yaml")

    # Test invalid ConfigFile instance with an invalid config file
    with pytest.raises(ValidationError):
        ConfigFile(file_path=str(invalid_config_file))


def test_Settings():
    # Test valid Settings instance
    input_variables = {
        "evidence_path": "/path/to/destination",
        "custom_properties": "prop1=>list1=>item1|prop2=>list2=>item2",
    }
    config_variables = Settings(**input_variables)
    assert isinstance(config_variables.evidence_path, Path)
    assert config_variables.evidence_path == Path("/path/to/destination")
    assert config_variables.custom_properties == "prop1=>list1=>item1|prop2=>list2=>item2"

    # Test invalid Settings instance
    # Invalid custom_properties
    input_variables["custom_properties"] = "invalid_properties"
    with pytest.raises(ValidationError):
        Settings(**input_variables)
