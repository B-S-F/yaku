import sys
import textwrap
from functools import wraps
from pathlib import Path

import pytest
from click.testing import CliRunner
from mock import Mock
from yaku.autopilot_utils.cli_base import read_version_from_package
from yaku.autopilot_utils.results import assert_result_status, protect_results
from yaku.papsr.cli import SAMPLE_CODE, load_cli, main, make_click_app


@pytest.fixture(scope="module")
def unique_names():
    """
    Fixture for a filename generator routine.

    Unfortunately, it is not easily possible to remove a loaded module
    from Python's memory, so we need to make sure that each of the sample
    Python files in the tests below are using different module names.

    The generator below creates unique names for modules by incrementing
    a number suffix with each call.

    To use the fixture, put it into the test function's argument list
    (e.g. `def my_test(unique_names)`) and then call `next(unique_names)`
    to get the next filename.
    """
    index = 0

    def generator(basename: str = "sample_cli"):
        while True:
            nonlocal index
            yield f"{basename}_{index}.py"
            index += 1

    return generator()


def reset_sys_path(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        old_sys_path = list(sys.path)
        try:
            f(*args, **kwargs)
        finally:
            sys.path.clear()
            sys.path.extend(old_sys_path)

    return wrapper


def test_load_cli_shows_error_if_file_does_not_exist():
    with pytest.raises(FileNotFoundError):
        load_cli(Path("non_existing_file.abcd"))


@pytest.mark.parametrize("module_name", ["test", "sys"])
def test_load_cli_shows_proper_import_error_in_case_of_module_name_conflicts(
    tmp_path: Path, module_name: str
):
    sample_file = tmp_path / f"{module_name}.py"
    sample_file.write_text(SAMPLE_CODE)

    with pytest.raises(
        ImportError, match=".*Please rename your file `.*` to a unique name!.*"
    ):
        load_cli(sample_file)


def test_load_cli_from_module_returns_error_if_module_has_no_CLI_class(
    tmp_path: Path, unique_names
):
    sample_file = tmp_path / next(unique_names)
    sample_file.write_text("# No code in this file!")
    with pytest.raises(RuntimeError, match="must have a CLI class!"):
        load_cli(sample_file)


@protect_results
@reset_sys_path
def test_can_load_and_execute_cli_from_module(tmp_path: Path, unique_names):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        sample_file = Path(td) / next(unique_names)
        sample_file.write_text(SAMPLE_CODE)
        cli = load_cli(sample_file)
        main = make_click_app(cli)
        result = runner.invoke(main)
        assert_result_status(result.output, "GREEN", reason="Fail flag was set to: False")

        result = runner.invoke(main, "--fail")
        assert_result_status(result.output, "RED", reason=".*But: Fail flag was set to: True")


@reset_sys_path
def test_loaded_module_can_show_version(tmp_path: Path, unique_names):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        sample_file = Path(td) / next(unique_names)
        sample_file.write_text(SAMPLE_CODE)
        cli = load_cli(sample_file)
        main = make_click_app(cli)
        result = runner.invoke(main, "--version")
        assert cli.version in result.output


@reset_sys_path
def test_loaded_module_can_show_help(tmp_path: Path, unique_names):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path) as td:
        sample_file = Path(td) / next(unique_names)
        sample_file.write_text(SAMPLE_CODE)
        cli = load_cli(sample_file)
        main = make_click_app(cli)
        result = runner.invoke(main, "--help")
        assert "Usage:" in result.output
        assert "--fail" in result.output


def test_papsr_cli_main_function_without_args(mocker: Mock, capsys):
    version = read_version_from_package("yaku.papsr")()
    mocker.patch("sys.argv", ["papsr"])
    with pytest.raises(SystemExit) as e:
        main()
    assert e.value.code == 1
    out, err = capsys.readouterr()
    assert out == ""
    assert textwrap.indent(SAMPLE_CODE, "    ") in err
    assert f"Version: {version}" in err


def test_papsr_cli_main_function_with_version_arg(mocker: Mock, capsys):
    version = read_version_from_package("yaku.papsr")()
    mocker.patch("sys.argv", ["papsr", "--version"])
    with pytest.raises(SystemExit) as e:
        main()
    assert e.value.code == 0
    out, err = capsys.readouterr()
    assert out == version
    assert err == ""


def test_papsr_cli_main_function_with_module_arg(mocker: Mock, capsys, tmp_path: Path):
    sample_file = tmp_path / "sample_cli.py"
    sample_file.write_text(SAMPLE_CODE)

    mocker.patch("sys.argv", ["papsr", str(sample_file)])
    with pytest.raises(SystemExit) as e:
        main()
    assert e.value.code == 0

    out, _ = capsys.readouterr()
    assert_result_status(out, "GREEN", "Fail flag was set to: False")
