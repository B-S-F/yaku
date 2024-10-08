import json
from unittest.mock import MagicMock

from yaku.splunk_fetcher.splunk.result import SplunkResult


def test_splunk_result():
    # Mock JSONResultsReader
    reader_mock = MagicMock()
    reader_mock.__iter__.return_value = [
        {"field1": "value1", "field2": "value2"},
        {"field1": "value3", "field2": "value4"},
    ]

    # Test SplunkResult initialization
    result = SplunkResult(reader_mock)
    assert len(result) == 2

    # Test to_json method
    expected_json = json.dumps(
        {
            "results": [
                {"field1": "value1", "field2": "value2"},
                {"field1": "value3", "field2": "value4"},
            ],
            "messages": [],
            "fields": [
                {"name": "field1"},
                {"name": "field2"},
            ],
        }
    )
    assert result.to_json() == expected_json

    # Test to_csv method
    expected_csv = "field1,field2\r\nvalue1,value2\r\nvalue3,value4\r\n"
    assert result.to_csv() == expected_csv
