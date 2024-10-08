from unittest.mock import MagicMock, Mock, PropertyMock, patch

import pytest
from yaku.autopilot_utils.errors import AutopilotConfigurationError, AutopilotError
from yaku.splunk_fetcher.splunk.base import (
    SplunkBase,
    SplunkBaseSettings,
    SplunkOneShotSearchSettings,
    SplunkSearchSettings,
)


class MockHTTPError(NameError):
    def __init__(self, status):
        self.status = status


class MockJSONResultsReader(object):
    def __init__(self, results, is_preview):
        self.results = results
        self.is_preview = is_preview

    def __iter__(self):
        return iter(self.results)

    def is_preview(self):
        return self.is_preview


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


one_shot_settings = SplunkOneShotSearchSettings(
    query="some query",
    start_time="2023-01-01",
    end_time="2023-02-01",
)


def test_splunk_search_settings():
    search_settings = SplunkSearchSettings(
        query="search",
        start_time="2023-01-01",
        end_time="2023-02-01",
    )

    assert search_settings.query == "search"
    assert search_settings.parallel_job_limit == 3
    assert search_settings.poll_interval == 5
    assert search_settings.start_time == "2023-01-01T00:00:00"
    assert search_settings.end_time == "2023-02-01T00:00:00"


def test_splunk_search_settings_invalid():
    with pytest.raises(AutopilotConfigurationError):
        SplunkSearchSettings(
            query="search",
            start_time="xxx",
            end_time="2023-02-01",
        )
    with pytest.raises(AutopilotConfigurationError):
        SplunkSearchSettings(
            query="search",
            start_time="2023-01-01",
            end_time="xxx",
        )


def test_splunk_oneshot_search_settings():
    search_settings = SplunkOneShotSearchSettings(
        query="search",
        start_time="2023-01-01",
        end_time="2023-02-01",
    )

    assert search_settings.query == "search"
    assert search_settings.parallel_job_limit == 3
    assert search_settings.poll_interval == 5
    assert search_settings.start_time == "2023-01-01T00:00:00"
    assert search_settings.end_time == "2023-02-01T00:00:00"


def test_splunk_oneshot_search_settings_invalid():
    with pytest.raises(AutopilotConfigurationError):
        SplunkOneShotSearchSettings(
            query="search",
            start_time="xxx",
            end_time="2023-02-01",
        )
    with pytest.raises(AutopilotConfigurationError):
        SplunkOneShotSearchSettings(
            query="search",
            start_time="2023-01-01",
            end_time="xxx",
        )


@patch("splunklib.client.connect")
def test_splunk_base_constructor(connect_mock):
    base = SplunkBase(client_config)

    connect_mock.assert_called_once_with(
        app="app",
        username="username",
        password="password",
        host="host",
        port=8000,
    )
    assert base is not None


@patch("splunklib.client.connect")
def test_splunk_base_constructor_default_port(connect_mock):
    client_config = SplunkBaseSettings(
        app="app",
        username="username",
        password="password",
        token=None,
        host="host",
    )

    base = SplunkBase(client_config)

    connect_mock.assert_called_once_with(
        app="app",
        username="username",
        password="password",
        host="host",
        port=8089,
    )
    assert base is not None


@patch("splunklib.client.connect")
def test_check_search(connect_mock):
    splunk_base = SplunkBase(client_config)

    splunk_base.service.parse = Mock()
    splunk_base._check_search("search")

    splunk_base.service.parse.assert_called_once_with("search", parse_only=True)


@patch("splunklib.client.connect")
def test_check_search_error(connect_mock):
    exception_instance = MockHTTPError(404)
    connect_mock.return_value.parse.side_effect = exception_instance

    splunk_base = SplunkBase(client_config)
    with pytest.raises(NameError) as exc_info:
        splunk_base._check_search("invalid search")

    assert exc_info.value.args[0] == 404
    assert str(exc_info.value) == str(exception_instance)


@patch("splunklib.client.connect")
@patch("yaku.splunk_fetcher.splunk.base.sleep")
def test_dispatchted_search_timeout_error(connect_mock, sleep_mock):
    splunk_base = SplunkBase(client_config)
    splunk_base.service.jobs.create = Mock()
    splunk_base.service.jobs.create.return_value.is_ready = Mock(return_value=False)
    with pytest.raises(TimeoutError) as e:
        splunk_base._dispatched_search(search_settings)
    assert e.value.args[0] == "Splunk job is not ready"
    splunk_base.service.jobs.create.return_value.is_ready = Mock(return_value=True)
    splunk_base._get_job_stats = Mock(
        return_value={
            "isDone": "0",
            "doneProgress": 1.0,
            "scanCount": 1,
            "eventCount": 1,
            "resultCount": 1,
        }
    )
    with pytest.raises(TimeoutError) as e:
        splunk_base._dispatched_search(search_settings)

    assert e.value.args[0] == "Splunk search job exceeded timeout"


@patch("splunklib.client.connect")
def test_get_job_stats(connect_mock):
    splunk_base = SplunkBase(client_config)
    splunk_base.service.parse = Mock()
    job = {
        "isDone": "1",
        "doneProgress": "1",
        "scanCount": "500",
        "eventCount": "1000",
        "resultCount": "250",
    }

    expected_stats = {
        "isDone": "1",
        "doneProgress": 1.0,
        "scanCount": 500,
        "eventCount": 1000,
        "resultCount": 250,
    }
    stats = splunk_base._get_job_stats(job)
    assert stats == expected_stats


@patch("time.sleep")
@patch("splunklib.client.connect")
@patch(
    "yaku.splunk_fetcher.splunk.base.results.JSONResultsReader",
    new_callable=PropertyMock,
    return_value=MockJSONResultsReader([{"result": "result"}], False),
)
def test_get_search_result(sleep_mock, connect_mock, json_results_reader_mock):
    splunk_base = SplunkBase(client_config)
    splunk_base.service.jobs.create = Mock()
    splunk_base._get_job_stats = Mock(
        return_value={
            "isDone": "1",
            "doneProgress": 1.0,
            "scanCount": 1,
            "eventCount": 1,
            "resultCount": 1,
        }
    )
    splunk_base.service.jobs.create.return_value.is_ready = Mock(return_value=True)
    splunk_base.service.jobs.create.return_value.results = Mock()
    result = splunk_base._dispatched_search(search_settings)

    splunk_base.service.jobs.create.assert_called_once_with(
        "search", earliest_time="2023-01-01T00:00:00", latest_time="2023-02-01T00:00:00"
    )
    splunk_base.service.jobs.create.return_value.results.assert_called()
    assert result.results[0] == {"result": "result"}
    assert result.messages == []
    assert result.fieldnames == ["result"]
    assert result.override_csv
    assert result.override_json


@patch("splunklib.client.connect")
@patch(
    "yaku.splunk_fetcher.splunk.base.results.JSONResultsReader",
    new_callable=PropertyMock,
    return_value=MockJSONResultsReader([{"result": "result"}], False),
)
def test_one_shot_search(connect_mock, json_results_reader_mock):
    mock_service = Mock()
    mock_service.jobs.oneshot.return_value = MagicMock()

    splunk_base = SplunkBase(client_config)
    splunk_base.service = mock_service

    result = splunk_base._one_shot_search(one_shot_settings)

    mock_service.jobs.oneshot.assert_called_once_with(
        one_shot_settings.query,
        earliest_time="2023-01-01T00:00:00",
        latest_time="2023-02-01T00:00:00",
        output_mode="json",
        count=0,
    )

    assert result.results[0] == {"result": "result"}
    assert result.messages == []
    assert result.fieldnames == ["result"]


@patch("splunklib.client.connect")
def test_get_number_of_jobs(connect_mock):
    mock_service = Mock()
    mock_jobs_list = [Mock() for _ in range(5)]
    mock_service.jobs.list.return_value = mock_jobs_list
    splunk_base = SplunkBase(client_config)
    splunk_base.service = mock_service
    result = splunk_base._get_number_of_jobs()
    assert result == len(mock_jobs_list)


@patch("time.sleep")
@patch("splunklib.client.connect")
def test_ensure_parallel_search_limitation(sleep_mock, connect_mock):
    sleep_mock.return_value = None
    splunk_base = SplunkBase(client_config)
    splunk_base._get_number_of_jobs = Mock(side_effect=[6, 5, 4, 3, 2, 1, 0])
    splunk_base._ensure_parallel_search_limitation(3, 0)
    assert splunk_base._get_number_of_jobs.call_count == 5


@patch("splunklib.client.connect")
def test_search(connect_mock):
    splunk_base = SplunkBase(client_config)
    splunk_base._check_search = Mock()
    splunk_base._ensure_parallel_search_limitation = Mock()
    splunk_base._dispatched_search = Mock()
    splunk_base._one_shot_search = Mock()

    splunk_base.search(search_settings)

    splunk_base._check_search.assert_called_once_with(search_settings.query)
    splunk_base._ensure_parallel_search_limitation.assert_called_once()
    splunk_base._dispatched_search.assert_called_once_with(search_settings)
    splunk_base._one_shot_search.assert_not_called()

    splunk_base._check_search = Mock()
    splunk_base._ensure_parallel_search_limitation = Mock()
    splunk_base._dispatched_search = Mock()
    splunk_base._one_shot_search = Mock()

    splunk_base.search(one_shot_settings)

    splunk_base._check_search.assert_called_with(one_shot_settings.query)
    splunk_base._ensure_parallel_search_limitation.assert_called_once()
    splunk_base._dispatched_search.assert_not_called()
    splunk_base._one_shot_search.assert_called_once_with(one_shot_settings)


@patch("splunklib.client.connect")
def test_search_invalid_settings(connect_mock):
    splunk_base = SplunkBase(client_config)
    splunk_base._check_search = Mock()
    splunk_base._ensure_parallel_search_limitation = Mock()
    splunk_base._dispatched_search = Mock()
    splunk_base._one_shot_search = Mock()

    with pytest.raises(ValueError, match="Invalid search settings passed"):
        splunk_base.search("invalid settings")


@patch("splunklib.client.connect")
def test_stats(connect_mock):
    splunk_base = SplunkBase(client_config)
    splunk_base.job = Mock()
    splunk_base._get_job_stats = Mock()
    splunk_base.stats()
    splunk_base._get_job_stats.assert_called_once_with(splunk_base.job)
    splunk_base.job = None
    with pytest.raises(AutopilotError, match="Job stats are not available"):
        splunk_base.stats()
