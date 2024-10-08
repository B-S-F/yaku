from pathlib import Path

import pytest
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.sharepoint_evaluator.utils import PropertiesReader

DATA_PATH = Path(__file__).parent / "data"


@pytest.fixture
def reader():
    return PropertiesReader(DATA_PATH / "__custom_property_definitions__.json")


def test_get_file_property(reader: PropertiesReader):
    assert "1" == reader.get_file_property(DATA_PATH / "ProcessStatus.docx", "CSC")


def test_get_file_property_for_non_existing_file(reader: PropertiesReader):
    with pytest.raises(
        AutopilotConfigurationError, match="There are only the following files"
    ):
        reader.get_file_property(DATA_PATH / "non-existing-file", "some property")


def test_get_invalid_file_property(reader):
    with pytest.raises(
        AutopilotConfigurationError,
        match="Could not get property `some-unknown-property` for .*",
    ):
        reader.get_file_property(DATA_PATH / "ProcessStatus.docx", "some-unknown-property")


def test_get_file_custom_property_with_or_without_mapping(reader: PropertiesReader):
    reader.add_list_to_property_mapping("RevisionStatus", "RevisionStatusId")
    reader.add_list_to_property_mapping("Workflow Status", "WorkflowStatusId")

    assert 2 == reader.get_file_property(DATA_PATH / "ProcessStatus.docx", "RevisionStatusId")

    assert "Draft" == reader.get_file_property(
        DATA_PATH / "ProcessStatus.docx", "RevisionStatus"
    )


def test_get_file_custom_property_with_invalid_property_value(reader: PropertiesReader):
    assert reader.get_file_property(DATA_PATH / "ProcessStatus.docx", "SomeStatusId") == ""
    reader.add_list_to_property_mapping("Some Status", "SomeStatusId")
    assert reader.get_file_property(DATA_PATH / "ProcessStatus.docx", "SomeStatusId") == ""
    reader.get_file_property(DATA_PATH / "ProcessStatus.docx", "Some Status")
