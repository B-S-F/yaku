from dataclasses import dataclass, field

import pytest
from _pytest.logging import LogCaptureFixture
from loguru import logger
from yaku.autopilot_utils.subprocess import (
    AutopilotSubprocessFailure,
    OutputMap,
    ProcessResult,
    Result,
    ResultsCollector,
    gen_exit_for_returncode,
    gen_raise_for_status,
    parse_json_lines_into_list,
    parse_json_lines_into_map,
)


@dataclass
class DummyProcessResult(ProcessResult):
    args = ""
    exit_for_returncode = None  # type: ignore
    raise_for_status = None  # type: ignore
    reason = ""
    returncode: int
    status: str | None = ""
    clean_stdout: str = "filtered stdout output"
    stderr: str = "stderr output"
    stdout: str = "unfiltered stdout output"
    results: ResultsCollector = field(default_factory=ResultsCollector)
    outputs: OutputMap = field(default_factory=OutputMap)


def test_exit_for_returncode_does_not_exit_on_zero_returncode():
    exit_for_returncode_0 = gen_exit_for_returncode(DummyProcessResult(returncode=0))
    exit_for_returncode_0()


def test_exit_for_returncode_exits_on_nonzero_returncode():
    exit_for_returncode_1 = gen_exit_for_returncode(DummyProcessResult(returncode=1))
    with pytest.raises(SystemExit):
        exit_for_returncode_1()


def test_exit_for_returncode_does_not_print_full_stdout_on_success(capsys):
    exit_for_returncode = gen_exit_for_returncode(
        DummyProcessResult(
            returncode=0, clean_stdout="only clean", stderr="stderr", stdout="normal stdout"
        )
    )
    exit_for_returncode()
    captured = capsys.readouterr()

    assert "normal stdout" not in captured.out
    assert "stderr" in captured.err

    assert "only clean" in captured.out


@pytest.fixture
def caplog(caplog: LogCaptureFixture):
    handler_id = logger.add(
        caplog.handler,
        format="{message}",
        level=0,
        filter=lambda record: record["level"].no >= caplog.handler.level,
        enqueue=False,  # Set to 'True' if your test is spawning child processes.
    )
    yield caplog
    logger.remove(handler_id)


def test_exit_for_returncode_prints_stderr_and_full_stdout_on_error(capsys, caplog):
    exit_for_returncode = gen_exit_for_returncode(
        DummyProcessResult(
            returncode=1, clean_stdout="only clean", stderr="stderr", stdout="normal stdout"
        )
    )
    with pytest.raises(SystemExit):
        exit_for_returncode()
    captured = capsys.readouterr()

    assert "normal stdout" in caplog.text
    assert "stderr" in caplog.text

    assert "only clean" not in captured.out


def test_console_output_is_showed_only_once_if_returncode_unequal_zero(capsys, caplog):
    dummy_result = DummyProcessResult(
        returncode=1, status="GREEN", stdout="stdout", stderr="stderr"
    )
    exit_for_returncode = gen_exit_for_returncode(dummy_result)
    with pytest.raises(SystemExit):
        exit_for_returncode()

    assert caplog.text.count("stdout") == 1
    assert caplog.text.count("stderr") == 1


def test_gen_raise_for_status_asserts_if_returncode_unequal_zero(capsys):
    raise_for_status = gen_raise_for_status(
        DummyProcessResult(returncode=1, status="GREEN", stdout="stdout", stderr="stderr")
    )
    with pytest.raises(
        AssertionError, match="raise_for_status().*after.*exit_for_returncode()"
    ):
        raise_for_status()


@pytest.mark.parametrize("status", ["GREEN", "YELLOW"])
def test_output_is_shown_only_once_on_success(status, capsys):
    dummy_result = DummyProcessResult(
        returncode=0, status=status, stdout="stdout", stderr="stderr", clean_stdout="cleanout"
    )
    exit_for_returncode = gen_exit_for_returncode(dummy_result)
    exit_for_returncode()
    raise_for_status = gen_raise_for_status(dummy_result)
    raise_for_status()
    captured = capsys.readouterr()
    assert captured.out.count("stdout") == 0
    assert captured.out.count("cleanout") == 1
    assert captured.err.count("stderr") == 1


@pytest.mark.parametrize("status", ["GREEN", "YELLOW"])
def test_gen_raise_for_status_does_not_print_outputs_or_results_on_success(status, capsys):
    raise_for_status = gen_raise_for_status(
        DummyProcessResult(
            returncode=0,
            status=status,
            results=ResultsCollector([Result("crit", True, "was fulfilled")]),
            outputs=OutputMap({"my_output": "output_value_1"}),
        )
    )
    raise_for_status()
    captured = capsys.readouterr()
    assert "crit" not in captured.out
    assert "my_output" not in captured.out
    assert "output_value_1" not in captured.out


@pytest.mark.parametrize("status", ["RED", "FAILURE"])
def test_output_is_shown_only_once_on_red_or_failure(status, capsys):
    dummy_result = DummyProcessResult(
        returncode=0,
        status=status,
        stdout="stdout",
        stderr="stderr",
    )
    exit_for_returncode = gen_exit_for_returncode(dummy_result)
    exit_for_returncode()
    raise_for_status = gen_raise_for_status(dummy_result)
    try:
        raise_for_status()
    except AutopilotSubprocessFailure:
        pass
    captured = capsys.readouterr()
    assert captured.out.count("stdout") == 1
    assert captured.err.count("stderr") == 1


@pytest.mark.parametrize("status", ["ERROR", "FAILURE"])
def test_gen_raise_for_status_prints_outputs_and_results_on_failure(status, capsys):
    subprocess_results = ResultsCollector([Result("crit", False, "was not fulfilled")])
    subprocess_outputs = OutputMap({"my_output": "output_value_1"})
    raise_for_status = gen_raise_for_status(
        DummyProcessResult(
            returncode=0,
            status=status,
            results=subprocess_results,
            outputs=subprocess_outputs,
        )
    )
    with pytest.raises(AutopilotSubprocessFailure):
        raise_for_status()
    captured = capsys.readouterr()
    assert "crit" in captured.out
    assert "my_output" in captured.out
    assert "output_value_1" in captured.out

    results = parse_json_lines_into_list(captured.out, "result", cls=Result)
    assert results == subprocess_results
    outputs = parse_json_lines_into_map(captured.out, "output")
    assert outputs == subprocess_outputs


@pytest.mark.parametrize("status", ["GREEN", "YELLOW", "RED"])
def test_gen_raise_for_status_does_not_raise_on_GREEN(status):
    raise_for_status = gen_raise_for_status(DummyProcessResult(returncode=0, status=status))
    raise_for_status()


def test_gen_raise_for_status_ignores_none_status():
    raise_for_status = gen_raise_for_status(DummyProcessResult(returncode=0, status=None))
    raise_for_status()


def test_gen_raise_for_status_does_not_ignore_none_status_if_not_ignored():
    raise_for_status = gen_raise_for_status(DummyProcessResult(returncode=0, status=None))
    with pytest.raises(AutopilotSubprocessFailure):
        raise_for_status(ignore_no_status=False)
