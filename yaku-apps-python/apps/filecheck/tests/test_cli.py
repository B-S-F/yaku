from pathlib import Path

import pytest
from click.testing import CliRunner
from yaku.autopilot_utils.results import assert_result_status, protect_results
from yaku.autopilot_utils.subprocess import parse_json_lines_into_map
from yaku.filecheck.cli import main


@protect_results
def test_can_check_if_file_exists(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test.txt").touch()
        result = runner.invoke(main, ["exists", "test.txt"])
        assert_result_status(result.output, "GREEN", reason="File .* exists")


@protect_results
def test_can_check_if_file_does_not_exist(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        assert not (Path(td) / "test.txt").exists()
        result = runner.invoke(main, ["exists", "test.txt"])
        assert_result_status(
            result.output,
            "RED",
            reason="File `test.txt` must exist.\nBut: File `test.txt` doesn't exist!",
        )


@protect_results
@pytest.mark.parametrize("empty_argument", ["", " "])
def test_that_empty_argument_is_reported_as_error(empty_argument: str):
    runner = CliRunner()
    result = runner.invoke(main, ["exists", empty_argument])
    assert result.exit_code == 0
    assert_result_status(result.output, "FAILED", reason="Argument cannot be empty!")


@protect_results
def test_can_check_if_file_has_correct_min_size(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test.txt").write_text("12345")
        result = runner.invoke(main, ["size", "--min", "5", "test.txt"])
        assert_result_status(result.output, "GREEN", reason="File .* has a size of 5 bytes.")


@protect_results
def test_can_check_if_file_is_smaller_than_min_size(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test.txt").write_text("12345")
        result = runner.invoke(main, ["size", "--min", "6", "test.txt"])
        assert_result_status(
            result.output,
            "RED",
            reason="File `test.txt` should be at least 6 bytes large.\nBut: File `test.txt` has a size of 5 bytes.",
        )


@protect_results
def test_can_check_if_file_has_correct_max_size(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test.txt").write_text("12345")
        result = runner.invoke(main, ["size", "--max", "5", "test.txt"])
        assert_result_status(
            result.output, "GREEN", reason="File `test.txt` has a size of 5 bytes."
        )


@protect_results
def test_can_check_if_file_is_larger_than_max_size(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test.txt").write_text("12345")
        result = runner.invoke(main, ["size", "--max", "4", "test.txt"])
        assert_result_status(
            result.output, "RED", reason=".*File `test.txt` has a size of 5 bytes"
        )


@protect_results
def test_output_is_not_printed_if_no_file_is_found(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        result = runner.invoke(main, ["exists", "test.txt"])
        assert_result_status(result.output, "RED")
        outputs = parse_json_lines_into_map(result.output, "output")
        assert not outputs, "There are outputs given when there shouldn't be any!"


@protect_results
def test_output_is_only_printed_if_file_is_found(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test.txt").touch()
        result = runner.invoke(main, ["exists", "test.txt"])
        assert_result_status(result.output, "GREEN")
        outputs = parse_json_lines_into_map(result.output, "output")
        assert outputs
        assert outputs["file_found"] == "test.txt"


@protect_results
def test_output_is_only_printed_if_glob_files_are_found(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        (Path(td) / "test.txt").touch()
        (Path(td) / "test2.txt").touch()
        result = runner.invoke(main, ["exists", "--glob", "test*.txt"])
        assert_result_status(result.output, "GREEN")
        outputs = parse_json_lines_into_map(result.output, "output")
        assert outputs
        assert set(outputs["files_found"]) == {"test.txt", "test2.txt"}
        assert outputs["count"] == 2
