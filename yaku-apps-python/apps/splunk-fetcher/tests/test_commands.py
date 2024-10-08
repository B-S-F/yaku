from pathlib import Path

import mock
from splunklib import binding
from yaku.splunk_fetcher.commands import (
    create_outputs,
    fetch_splunk_data,
    parse_result_filename,
    write_output_file,
)


class MockHTTPError(binding.HTTPError):
    def __init__(self):
        self.status = 503
        self.message = "Service Unavailable"


class TestParseResultFilename:
    def test_parse_result_filename(self):
        input_value = "/path/to/file.txt"
        expected_output = "file.txt"
        result = parse_result_filename(None, None, input_value)
        assert result, expected_output


class TestCreateOutputs:
    def test_create_output(self):
        file_paths = [Path("file1.txt"), Path("file2.txt"), Path("file3.txt")]
        result = create_outputs(file_paths, oneq_upload=False)
        assert result == [{"output": {"fetched": str(p.resolve())}} for p in file_paths]

    def test_create_output_oneq_upload(self):
        file_paths = [Path("file1.txt"), Path("file2.txt"), Path("file3.txt")]
        oneq_upload = True
        result = create_outputs(file_paths, oneq_upload)
        assert result == [{"output": {"fetched": str(p.resolve())}} for p in file_paths] + [
            {"output": {"oneqUpload": True, **{p.name: str(p.resolve()) for p in file_paths}}}
        ]


class TestWriteOutputFile:
    def test_write_output_file(self, tmp_path: Path):
        data = "Test data"
        file_path = tmp_path / "output" / "subdir" / "output.txt"
        write_output_file(data, file_path)

        assert file_path.exists()
        assert file_path.read_text() == data

        # check that we can overwrite files without errors
        new_data = "New data"
        write_output_file(new_data, file_path)

        assert file_path.exists()
        assert file_path.read_text() == new_data


class TestFetchSplunkData:
    @mock.patch("yaku.splunk_fetcher.commands.SplunkFetcher")
    def test_fetch_splunk_data_with_one_shot_search(self, mock_fetcher):
        mocked_fetcher = mock_fetcher.return_value
        mocked_fetcher.fetch.return_value = "data"

        QUERY = "some query"
        OUTPUT_FORMAT = "json"
        result = fetch_splunk_data(
            query=QUERY,
            username="user",
            password="pass",
            token=None,
            host="localhost",
            port=1234,
            output_format=OUTPUT_FORMAT,
            app="my_app",
            one_shot=True,
            start_time="2021-01-01",
            end_time="2021-02-01",
            validate_results=False,
        )

        assert mocked_fetcher.fetch.call_count == 1
        assert mocked_fetcher.fetch.call_args[0][0] == OUTPUT_FORMAT
        assert mocked_fetcher.fetch.call_args[0][1] == False
        assert result == "data"

    @mock.patch("yaku.splunk_fetcher.commands.SplunkFetcher")
    def test_fetch_splunk_data_with_dispatched_search(self, mock_fetcher):
        mocked_fetcher = mock_fetcher.return_value
        mocked_fetcher.fetch.return_value = "data"

        QUERY = "some query"
        OUTPUT_FORMAT = "json"
        result = fetch_splunk_data(
            query=QUERY,
            username="user",
            password="pass",
            token=None,
            host="localhost",
            port=1234,
            output_format=OUTPUT_FORMAT,
            app="my_app",
            one_shot=False,
            start_time="2021-01-01",
            end_time="2021-02-01",
            validate_results=False,
        )

        assert mocked_fetcher.fetch.call_count == 1
        assert mocked_fetcher.fetch.call_args[0][0] == OUTPUT_FORMAT
        assert mocked_fetcher.fetch.call_args[0][1] == False
        assert result == "data"
