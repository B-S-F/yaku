import pydantic
import pytest
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.sharepoint_fetcher.config import ConfigFileContent
from yaku.sharepoint_fetcher.selectors import Selector, parse_config_file_data


def test_read_config_file_with_missing_checks_in_selector():
    config_file_content = [
        {
            "file": "ProcessStatus.docx",
            "select": [
                {"property": "CSC", "is-larger-equal-than": 1},
                {"property": "Description"},
            ],
        }
    ]
    with pytest.raises(pydantic.ValidationError, match="__root__ -> 0 -> files"):
        ConfigFileContent.parse_obj(config_file_content)


def test_read_config_file_with_invalid_checks_in_selector():
    config_file_content = [
        {
            "files": "*.docx",
            "select": [
                {"property": "CSC", "is-larger-equal-than": 1},
                {"property": "Description", "enthaelt": "e"},
            ],
        }
    ]
    config_file_data = ConfigFileContent.parse_obj(config_file_content)
    with pytest.raises(AutopilotConfigurationError, match="Unknown operator 'enthaelt'!"):
        parse_config_file_data(config_file_data)


def test_parse_config_file():
    config_file_content = [
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

    config_file_data = ConfigFileContent.parse_obj(config_file_content)

    files_selectors = parse_config_file_data(config_file_data)

    assert len(files_selectors) == 3

    assert files_selectors[0].filter == "RevisionSet(1)/*.docx"
    assert files_selectors[0].selectors == [
        Selector("Workflow Status", "is-equal", "Valid"),
        Selector("Modified", "is-not-older-than", "1 year"),
    ]

    assert files_selectors[1].filter == "ProjectCharter.pdf"
    assert files_selectors[1].selectors == []

    assert files_selectors[2].filter == "SignedDocuments/*.pdf"
    assert files_selectors[2].selectors == [
        Selector("Size", "is-larger-than", "1024"),
    ]
    assert files_selectors[2].onlyLastModified == True
