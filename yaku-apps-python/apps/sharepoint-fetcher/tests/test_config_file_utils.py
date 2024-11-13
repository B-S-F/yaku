import os
from pathlib import Path

from yaku.sharepoint_fetcher.config_file_utils import merge_cli_and_file_params


def test_merge_both_cli_arguments_and_file_params():
    cli_arguments = {"param1": "cli_value1", "param2": "cli_value2"}
    file_params = {"param1": "file_value1", "param3": "file_value3"}
    expected = {"param1": "cli_value1", "param2": "cli_value2", "param3": "file_value3"}
    result = merge_cli_and_file_params(cli_arguments, file_params)
    assert result == expected


def test_merge_only_cli_arguments():
    cli_arguments = {"param1": "cli_value1", "param2": "cli_value2"}
    expected = {"param1": "cli_value1", "param2": "cli_value2"}
    result = merge_cli_and_file_params(cli_arguments)
    assert result == expected


def test_merge_only_file_params():
    file_params = {"param1": "file_value1", "param2": "file_value2"}
    expected = {"param1": "file_value1", "param2": "file_value2"}
    result = merge_cli_and_file_params({}, file_params)
    assert result == expected


def test_merge_neither_cli_arguments_nor_file_params():
    expected = {}
    result = merge_cli_and_file_params({})
    assert result == expected


def test_merge_cli_arguments_with_none_values():
    cli_arguments = {"param1": None, "param2": "cli_value2"}
    file_params = {"param1": "file_value1", "param3": "file_value3"}
    expected = {"param1": "file_value1", "param2": "cli_value2", "param3": "file_value3"}
    result = merge_cli_and_file_params(cli_arguments, file_params)
    assert result == expected


def test_merge_cli_default_arguments():
    cli_arguments = {
        "destination_path": None,
        "is_cloud": None,
        "param1": "cli_value1",
    }
    file_params = {
        "is_cloud": None,
        "destination_path": None,
        "param1": "file_value1",
    }
    expected = {
        "destination_path": Path(os.getcwd()),
        "is_cloud": False,
        "param1": "cli_value1",
    }
    result = merge_cli_and_file_params(cli_arguments, file_params)
    assert result == expected


def test_merge_cli_default_arguments_with_none_values():
    cli_arguments = {
        "is_cloud": False,
        "destination_path": os.getcwd(),
        "output_dir": os.getcwd(),
        "param1": "cli_value1",
    }
    file_params = {
        "is_cloud": None,
        "destination_path": None,
        "output_dir": None,
        "param1": "file_value1",
    }
    expected = {
        "is_cloud": False,
        "param1": "cli_value1",
        "destination_path": os.getcwd(),
        "output_dir": os.getcwd(),
    }
    result = merge_cli_and_file_params(cli_arguments, file_params)
    assert result == expected


def test_merge_cli_default_arguments_with_none_values_and_no_file_params():
    cli_arguments = {"is_cloud": False, "param1": "cli_value1"}
    expected = {"is_cloud": False, "param1": "cli_value1"}
    result = merge_cli_and_file_params(cli_arguments, {})
    assert result == expected


def test_merge_cli_and_file_params_does_not_modify_input_arg():
    cli_arguments = {"param1": "cli_value1", "param2": "cli_value2"}
    file_params = {"param1": "file_value1", "param3": "file_value3"}
    merge_cli_and_file_params(cli_arguments, file_params)
    assert cli_arguments == {"param1": "cli_value1", "param2": "cli_value2"}
