# SPDX-FileCopyrightText: 2024 grow platform GmbH
#
# SPDX-License-Identifier: MIT

import pydantic
import pytest
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.sharepoint_fetcher.config import FilterConfigFileContent
from yaku.sharepoint_fetcher.selectors import Selector, parse_filter_config_file_data


def test_read_filter_config_file_with_missing_checks_in_selector():
    filter_config_file_content = [
        {
            "file": "ProcessStatus.docx",
            "select": [
                {"property": "CSC", "is-larger-equal-than": 1},
                {"property": "Description"},
            ],
        }
    ]
    with pytest.raises(pydantic.ValidationError, match="__root__ -> 0 -> files"):
        FilterConfigFileContent.parse_obj(filter_config_file_content)


def test_read_filter_config_file_with_invalid_checks_in_selector():
    filter_config_file_content = [
        {
            "files": "*.docx",
            "select": [
                {"property": "CSC", "is-larger-equal-than": 1},
                {"property": "Description", "enthaelt": "e"},
            ],
        }
    ]
    filter_config_file_data = FilterConfigFileContent.parse_obj(filter_config_file_content)
    with pytest.raises(AutopilotConfigurationError, match="Unknown operator 'enthaelt'!"):
        parse_filter_config_file_data(filter_config_file_data)


def test_parse_filter_config_file():
    filter_config_file_content = [
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

    filter_config_file_data = FilterConfigFileContent.parse_obj(filter_config_file_content)

    files_selectors = parse_filter_config_file_data(filter_config_file_data)

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
