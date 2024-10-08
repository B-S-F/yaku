from unittest.mock import Mock, patch

import pytest
from splunklib import binding
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotFailure
from yaku.splunk_fetcher.splunk.base import SplunkBaseSettings, SplunkSearchSettings
from yaku.splunk_fetcher.splunk.fetcher import SplunkFetcher
from yaku.splunk_fetcher.splunk.result import SplunkResult


class MockHTTPError(binding.HTTPError):
    def __init__(self, status):
        self.status = status
        self.message = "Service Unavailable"


class SplunkResultMock(SplunkResult):
    def __init__(self, results):
        self.results = results

    def __iter__(self):
        return iter(self.results)

    def amount(self):
        return len(self.results)

    def to_json(self):
        return "json"

    def to_csv(self):
        return "csv"


client_config = SplunkBaseSettings(
    app="app",
    username="username",
    password="password",
    token=None,
    host="host",
    port=8000,
)

search_settings = SplunkSearchSettings(
    query="search",
    start_time="2023-01-01",
    end_time="2023-02-01",
)


@patch("splunklib.client.connect")
def test_splunk_base_constructor(connect_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    assert fetcher is not None
    assert fetcher.splunk is not None


@patch("splunklib.client.connect")
def test_fetch(connect_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    _execute_retry_search_mock = Mock()
    _execute_retry_search_mock.return_value = SplunkResultMock([{"foo": "bar"}])
    _transform_results_mock = Mock()
    _transform_results_mock.return_value = (1, "parsed_results")
    fetcher._execute_retry_search = _execute_retry_search_mock
    fetcher._transform_results = _transform_results_mock

    fetcher.fetch("json", False)

    _execute_retry_search_mock.assert_called_once()
    _transform_results_mock.assert_called_once()


@patch("splunklib.client.connect")
def test_fetch_validation(connect_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    _execute_retry_search_mock = Mock()
    _execute_retry_search_mock.return_value = SplunkResultMock([{"foo": "bar"}])
    _transform_results_mock = Mock()
    _transform_results_mock.return_value = (1, "parsed_results")
    stats_mock = Mock()
    stats_mock.return_value = {"resultCount": 1}
    fetcher._execute_retry_search = _execute_retry_search_mock
    fetcher._transform_results = _transform_results_mock
    fetcher.splunk.stats = stats_mock

    fetcher.fetch("json", True)

    _execute_retry_search_mock.assert_called_once()
    _transform_results_mock.assert_called_once()
    stats_mock.assert_called_once()


@patch("splunklib.client.connect")
def test_fetch_validation_valid_resultCount(connect_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    _execute_retry_search_mock = Mock()
    _execute_retry_search_mock.return_value = SplunkResultMock([{"foo": "bar"}])
    _transform_results_mock = Mock()
    _transform_results_mock.return_value = "parsed_results"
    stats_mock = Mock()
    stats_mock.return_value = {"resultCount": 1}
    fetcher._execute_retry_search = _execute_retry_search_mock
    fetcher._transform_results = _transform_results_mock
    fetcher.splunk.stats = stats_mock

    result = fetcher.fetch("json", True)

    _execute_retry_search_mock.assert_called_once()
    _transform_results_mock.assert_called_once()
    stats_mock.assert_called_once()
    assert result == "parsed_results"


@patch("splunklib.client.connect")
def test_fetch_validation_invalid_resultCount(connect_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    _execute_retry_search_mock = Mock()
    _execute_retry_search_mock.return_value = SplunkResultMock([{"foo": "bar"}])
    stats_mock = Mock()
    stats_mock.return_value = {"resultCount": 10}
    fetcher._execute_retry_search = _execute_retry_search_mock
    fetcher.splunk.stats = stats_mock

    with pytest.raises(AutopilotFailure):
        fetcher.fetch("json", True)

    _execute_retry_search_mock.assert_called_once()
    stats_mock.assert_called_once()


@patch("splunklib.client.connect")
def test_fetch_validation_no_resultCount(connect_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    _execute_retry_search_mock = Mock()
    _execute_retry_search_mock.return_value = SplunkResultMock([{"foo": "bar"}])
    stats_mock = Mock()
    stats_mock.return_value = {"foo": 10}
    fetcher._execute_retry_search = _execute_retry_search_mock
    fetcher.splunk.stats = stats_mock

    with pytest.raises(AutopilotFailure):
        fetcher.fetch("json", True)

    _execute_retry_search_mock.assert_called_once()
    stats_mock.assert_called_once()


@patch("splunklib.client.connect")
def test_execute_retry_search(connect_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    _search_mock = Mock()
    _search_mock.side_effect = [
        MockHTTPError(503),
        "raw_results",
    ]
    fetcher.splunk.search = _search_mock

    result = fetcher._execute_retry_search(0)

    assert result == "raw_results"
    assert _search_mock.call_count == 2


@patch("splunklib.client.connect")
def test_execue_retry_search_4xx_response(connect_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    _search_mock = Mock()
    _search_mock.side_effect = MockHTTPError(401)
    fetcher.splunk.search = _search_mock

    with pytest.raises(AutopilotFailure):
        fetcher._execute_retry_search(0)

    assert _search_mock.call_count == 1


@patch("splunklib.client.connect")
def test_execute_retry_search_exceed_max_retries(
    connect_mock,
):
    fetcher = SplunkFetcher(client_config, search_settings)
    _search_mock = Mock()
    _search_mock.side_effect = MockHTTPError(503)
    fetcher.splunk.search = _search_mock

    with pytest.raises(AutopilotFailure):
        fetcher._execute_retry_search(0)

    assert _search_mock.call_count == 6


@patch("splunklib.client.connect")
@patch("yaku.splunk_fetcher.splunk.fetcher.SplunkResult")
def test_transform_results_json(connect_mock, splunk_result_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    splunk_result_mock.to_json.return_value = "json"

    json = fetcher._transform_results(splunk_result_mock, "json")

    assert json == "json"


@patch("splunklib.client.connect")
@patch("yaku.splunk_fetcher.splunk.fetcher.SplunkResult")
def test_transform_results_csv(connect_mock, splunk_result_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    splunk_result_mock.to_csv.return_value = "csv"

    csv = fetcher._transform_results(splunk_result_mock, "csv")

    assert csv == "csv"


@patch("splunklib.client.connect")
@patch("yaku.splunk_fetcher.splunk.fetcher.SplunkResult")
def test_transform_results_invalid_format(connect_mock, splunk_result_mock):
    fetcher = SplunkFetcher(client_config, search_settings)
    with pytest.raises(AutopilotConfigurationError):
        fetcher._transform_results(splunk_result_mock, "invalid_format")
