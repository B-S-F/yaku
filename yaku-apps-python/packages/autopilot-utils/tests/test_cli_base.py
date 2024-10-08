"""
Note: most testing for the `cli_base.py` module is done via the app templates
in the `tests/app*/` directories.

But as those tests aren't included in the test coverage calculation (because
they are running in separate processes and environments), there are a few
tests (especially for edge cases) in this file.
"""

import sys

import click.testing
import mock
import pytest
from loguru import logger
from pydantic import BaseModel
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.errors import AutopilotFailure
from yaku.autopilot_utils.results import (
    DEFAULT_EVALUATOR,
    RESULTS,
    Result,
    assert_result_status,
    protect_results,
)


def test_app_provider_must_have_command_or_subcommands():
    class EmptyProvider:
        click_name = "wrong provider with not command and no subcommands"
        click_help_text = "help"

    with pytest.raises(TypeError, match=".*EmptyProvider.* must provide either.*"):
        make_autopilot_app(EmptyProvider, version_callback=lambda: "1.0")


def test_subcommands_must_be_valid_providers():
    class InvalidSubProvider:
        click_name = "sub"

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [InvalidSubProvider]

    with pytest.raises(TypeError, match="subcommand provider must have"):
        make_autopilot_app(MainProvider, version_callback=lambda: "1")


def test_read_version_from_package(mocker):
    mocker.patch("importlib.resources.read_text", return_value="1.0")
    callback = read_version_from_package("some.package")
    assert callback() == "1.0"


def test_print_version_calls_callback():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            ...

    get_version = mock.Mock(return_value="1.0.2")
    app = make_autopilot_app(SimpleProvider, version_callback=get_version)

    runner = click.testing.CliRunner()
    result = runner.invoke(app, "--version")

    assert "1.0.2" in result.output
    get_version.assert_called_once()


def test_print_version_removes_whitespace():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            ...

    get_version = mock.Mock(return_value="  1.0.2\n")
    app = make_autopilot_app(SimpleProvider, version_callback=get_version)

    runner = click.testing.CliRunner()
    result = runner.invoke(app, "--version")

    assert "1.0.2\n" == result.output


def test_normal_log_level_is_info():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            logger.debug("some verbose logging")
            logger.info("info message")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")

    runner = click.testing.CliRunner()
    result = runner.invoke(app)

    assert "info message" in result.output
    assert "some verbose logging" not in result.output


def test_debug_logging_can_be_enabled_via_flag():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            logger.debug("some verbose logging")
            logger.info("info message")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")

    runner = click.testing.CliRunner()
    result = runner.invoke(app, "--debug")

    assert "info message" in result.output
    assert "some verbose logging" in result.output


def test_debug_logging_can_be_enabled_via_environment_variable():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            logger.debug("some verbose logging")
            logger.info("info message")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")

    runner = click.testing.CliRunner()
    result = runner.invoke(app, env={"LOG_LEVEL": "deBUG"})

    assert "info message" in result.output
    assert "some verbose logging" in result.output


def test_app_cannot_have_subcommands_and_command():
    class SubProvider:
        def __init__(self, nr):
            self.click_name = f"sub{nr}"

        def click_command(self):
            logger.info(f"In {self.click_name} command")

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        @staticmethod
        def click_command():
            logger.info("In main command")

        click_subcommands = [SubProvider(1), SubProvider(2)]

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1")

    runner = click.testing.CliRunner()
    result = runner.invoke(app)

    assert "In main command" not in result.output
    assert "In sub" not in result.output
    assert result.output.startswith("Usage:")


def test_app_can_have_subcommands():
    class SubProvider:
        def __init__(self, nr):
            self.click_name = f"sub{nr}"

        def click_command(self):
            logger.info(f"In {self.click_name} command")

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProvider(1), SubProvider(2)]

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.output.startswith("Usage:")

    result = runner.invoke(app, "sub1")
    assert "In sub1" in result.output
    assert "In sub2" not in result.output

    result = runner.invoke(app, "sub2")
    assert "In sub1" not in result.output
    assert "In sub2" in result.output


def test_subcommands_are_chainable_by_default():
    class SubProvider:
        def __init__(self, nr):
            self.click_name = f"sub{nr}"

        def click_command(self):
            logger.info(f"In {self.click_name} command")

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProvider(1), SubProvider(2)]

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app, ["sub1", "sub2"])
    assert "In sub1" in result.output
    assert "In sub2" in result.output


def test_subcommand_chaining_can_be_disabled():
    class SubProvider:
        def __init__(self, nr):
            self.click_name = f"sub{nr}"

        def click_command(self):
            logger.info(f"In {self.click_name} command")

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProvider(1), SubProvider(2)]

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1", allow_chaining=False)
    runner = click.testing.CliRunner()

    result = runner.invoke(app, ["sub1", "sub2"])
    assert "In sub1" not in result.output
    assert "In sub2" not in result.output
    assert result.output.startswith("Usage:")


def test_subcommands_work_if_chaining_is_disabled():
    class SubProvider:
        def __init__(self, nr):
            self.click_name = f"sub{nr}"

        def click_command(self):
            logger.info(f"In {self.click_name} command")

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProvider(1), SubProvider(2)]

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1", allow_chaining=False)
    runner = click.testing.CliRunner()

    result = runner.invoke(app, ["sub1"])
    assert "In sub1" in result.output
    assert "In sub2" not in result.output

    result = runner.invoke(app, ["sub2"])
    assert "In sub1" not in result.output
    assert "In sub2" in result.output


def test_command_errors_are_handled():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            raise RuntimeError("Boom!")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 1
    assert "Boom!" in result.output


def test_subcommand_errors_are_handled():
    class SubProvider:
        click_name = "sub"

        @staticmethod
        def click_command():
            logger.info("In sub click_command")
            raise RuntimeError("Boom!")

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProvider]

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app, "sub")
    assert "In sub click_command" in result.output
    assert result.exit_code == 1
    assert "Boom!" in result.output


def test_command_failures_are_handled():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            raise AutopilotFailure("Boom!")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 0
    assert '{"status": "FAILED", "reason": "Boom!"}' in result.output


@protect_results
def test_command_failures_prevent_result_output():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            RESULTS.append(Result("crit", False, "just"))
            raise AutopilotFailure("Boom!")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 0
    assert '{"status": "FAILED", "reason": "Boom!"}' in result.output
    assert "crit" not in result.output
    assert "just" not in result.output


def test_subcommand_failures_are_handled():
    class SubProvider:
        click_name = "sub"

        @staticmethod
        def click_command():
            logger.info("In sub click_command")
            raise AutopilotFailure("Boom!")

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProvider]

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app, "sub")
    assert "In sub click_command" in result.output
    assert result.exit_code == 0
    assert '{"status": "FAILED", "reason": "Boom!"}' in result.output


def test_pydantic_errors_are_handled_in_command():
    class Settings(BaseModel):
        x: int

    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            Settings(x="abc")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 0
    assert "Input validation failed for ('x',): value is not a valid integer" in result.output
    assert '{"status": "FAILED", "reason": "Input validation' in result.output


def test_pydantic_errors_are_handled_in_subcommands():
    class Settings(BaseModel):
        x: int

    class SubProvider:
        click_name = "sub"

        @staticmethod
        def click_command():
            Settings(x="abc")

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProvider]

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app, "sub")
    assert result.exit_code == 0
    assert "Input validation failed for ('x',): value is not a valid integer" in result.output
    assert '{"status": "FAILED", "reason": "Input validation' in result.output


@protect_results
def test_evaluator_callback_is_called_for_command_if_results_exist():
    class SimpleEvaluatorProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            RESULTS.append(Result("c", True, "j"))

        click_evaluator_callback = mock.Mock(return_value=("GREEN", "all fine!"))

    app = make_autopilot_app(SimpleEvaluatorProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 0
    assert '{"status": "GREEN"' in result.output
    SimpleEvaluatorProvider.click_evaluator_callback.assert_called_once()


@protect_results
def test_evaluator_callback_must_have_correct_signature():
    class SimpleEvaluatorProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            RESULTS.append(Result("c", True, "j"))

        click_evaluator_callback = mock.Mock(return_value=("not a tuple"))

    app = make_autopilot_app(SimpleEvaluatorProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 1
    assert "TypeError" in result.output


@protect_results
def test_evaluator_callback_must_return_a_valid_status():
    class SimpleEvaluatorProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            RESULTS.append(Result("c", True, "j"))

        click_evaluator_callback = mock.Mock(return_value=("PINK", "Pink is nice!"))

    app = make_autopilot_app(SimpleEvaluatorProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 1
    assert "ValueError" in result.output


@protect_results
def test_typeerror_if_results_are_collected_but_no_evaluator_exists():
    class SimpleEvaluatorProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            RESULTS.append(Result("c", True, "j"))

    app = make_autopilot_app(SimpleEvaluatorProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 1
    assert "TypeError" in result.output
    assert "RESULTS were collected, but no function click_evaluator_callback" in result.output


@protect_results
def test_main_evaluator_callback_is_called_for_chainable_subcommand_if_results_exist():
    class SubProvider:
        click_name = "sub"

        @staticmethod
        def click_command():
            RESULTS.append(Result("c", True, "j"))

        click_evaluator_callback = mock.Mock(return_value=("RED", "nothing fine!"))

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProvider]

        click_evaluator_callback = mock.Mock(return_value=("GREEN", "all fine!"))

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1")
    runner = click.testing.CliRunner()

    result = runner.invoke(app, "sub")
    assert result.exit_code == 0
    assert '{"status": "GREEN"' in result.output
    MainProvider.click_evaluator_callback.assert_called_once()
    SubProvider.click_evaluator_callback.assert_not_called()


@protect_results
def test_sub_evaluator_callback_is_called_for_nonchainable_subcommand_if_results_exist():
    class SubProviderGreen:
        click_name = "green"

        @staticmethod
        def click_command():
            RESULTS.append(Result("c", True, "j"))

        click_evaluator_callback = mock.Mock(return_value=("GREEN", "all fine!"))

    class SubProviderRed:
        click_name = "red"

        @staticmethod
        def click_command():
            RESULTS.append(Result("c", False, "j"))

        click_evaluator_callback = mock.Mock(return_value=("RED", "nothing fine!"))

    class MainProvider:
        click_name = "main"
        click_help_text = "help"

        click_subcommands = [SubProviderRed, SubProviderGreen]

        click_evaluator_callback = mock.Mock(return_value=("PINK", "should not be called!"))

    app = make_autopilot_app(MainProvider, version_callback=lambda: "1", allow_chaining=False)
    runner = click.testing.CliRunner()

    result = runner.invoke(app, "red")

    MainProvider.click_evaluator_callback.assert_not_called()
    SubProviderGreen.click_evaluator_callback.assert_not_called()
    SubProviderRed.click_evaluator_callback.assert_called_once()

    assert result.exit_code == 0
    assert '{"status": "RED"' in result.output


def test_click_usageerror_results_in_failed_state():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def validate_arg1(ctx, param, value: str):
            if value == "invalid":
                raise click.UsageError("Arg1 is not valid!", ctx)

        click_setup = [click.option("--arg1", required=False, callback=validate_arg1)]

        @staticmethod
        def click_command(arg1: str):
            logger.info("inside click_command")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")

    runner = click.testing.CliRunner()

    result = runner.invoke(app, ["--arg1", "valid"])
    assert result.exit_code == 0
    assert "Arg1 is not valid" not in result.output

    result = runner.invoke(app, ["--arg1", "invalid"])
    # here, we verify that we don't simply get a click systemexit with
    # some usage hints, but really an exit code of zero together with
    # a JSON line containing the status=FAILED.
    # See also: yaku.autopilot_utils.cli_base.handle_click_command_errors
    assert result.exit_code == 0
    assert_result_status(result.output, "FAILED", reason="Arg1 is not valid")


def test_stderr_and_stdout_are_shown_on_command_error():
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            print("foo on stdout")
            print("bar on stderr", file=sys.stderr)
            raise Exception("Some error here!")

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")

    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 1, result.stdout
    assert result.stdout.count("foo") == 1
    assert result.stdout.count("bar") == 1


@protect_results
@pytest.mark.parametrize("status", ["GREEN", "YELLOW", "RED", "FAILURE"])
def test_stderr_and_stdout_are_shown_for_all_statuses(status):
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            print("foo on stdout")
            print("bar on stderr", file=sys.stderr)
            if status == "FAILURE":
                raise AutopilotFailure("some reason for failure")
            RESULTS.append(Result("crit", status in ["GREEN", "YELLOW"], "justification"))

        click_evaluator_callback = DEFAULT_EVALUATOR

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")

    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    assert result.exit_code == 0, result.stdout
    assert result.stdout.count("foo") == 1
    assert result.stdout.count("bar") == 1
