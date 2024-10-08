import os
from pathlib import Path

import click
import click.testing
import pytest
from yaku.autopilot_utils import subprocess
from yaku.autopilot_utils.cli_base import make_autopilot_app
from yaku.autopilot_utils.results import (
    RESULTS,
    Result,
    ResultsCollector,
    protect_results,
)


def test_subprocess_run_can_be_used_like_builtin_subprocess_run():
    result = subprocess.run(["apps.filecheck/filecheck.pex", "--debug", "exists", "foo.txt"])

    assert result.returncode == 0
    assert '{"status": "RED"' in result.stdout


def test_subprocess_run_handles_subprocess_errors_gracefully():
    result = subprocess.run(["bash", "-c", "exit 1"])

    assert result.returncode == 1
    assert result.status == "ERROR"


def test_subprocess_run_can_pass_environment_variables():
    result = subprocess.run(["echo $FOO"], extra_env={"FOO": "foobar"}, shell=True)

    assert result.returncode == 0
    assert "foobar" in result.stdout


def test_subprocess_run_returns_status_and_reason(tmp_path):
    some_file = tmp_path / "foo.txt"
    result = subprocess.run(["apps.filecheck/filecheck.pex", "exists", str(some_file)])
    assert result.status == "RED"
    assert result.reason.endswith("foo.txt` doesn't exist!")

    some_file.touch()
    result = subprocess.run(["apps.filecheck/filecheck.pex", "exists", str(some_file)])
    assert result.status == "GREEN"
    assert result.reason.endswith("foo.txt` exists.")


def test_subprocess_run_returns_results(tmp_path):
    some_file = tmp_path / "foo.txt"
    some_file.touch()
    result = subprocess.run(
        [
            "apps.filecheck/filecheck.pex",
            "exists",
            str(some_file),
            "size",
            "--min",
            "1",
            str(some_file),
        ]
    )

    # the following assertion is just to verify that the filecheck app still has
    # the same output format, otherwise the tests below will fail.
    log_output = result.stdout.strip().replace(str(some_file), "foo.txt")
    assert (
        log_output.split(os.linesep)
        == [
            """{"output": {"file_found": "foo.txt"}}""",
            """{"status": "RED", "reason": "File `foo.txt` should be at least 1 bytes large.\\nBut: File `foo.txt` has a size of 0 bytes."}""",
            """{"result": {"criterion": "File `foo.txt` must exist.", "fulfilled": true, "justification": "File `foo.txt` exists.", "metadata": {"check": "exist"}}}""",
            """{"result": {"criterion": "File `foo.txt` should be at least 1 bytes large.", "fulfilled": false, "justification": "File `foo.txt` has a size of 0 bytes.", "metadata": {"check": "size"}}}""",
        ]
    ), "It looks like the filecheck app has a different output format now, please adapt the test!"

    # now come the actual checks, here we simply check that the log output
    # above was parsed correctly into Result objects
    assert len(result.results) == 2
    assert (
        result.results[0].criterion.replace(str(some_file), "foo.txt")
        == "File `foo.txt` must exist."
    )
    assert result.results[0].fulfilled == True
    assert (
        result.results[0].justification.replace(str(some_file), "foo.txt")
        == "File `foo.txt` exists."
    )
    assert (
        result.results[1].criterion.replace(str(some_file), "foo.txt")
        == "File `foo.txt` should be at least 1 bytes large."
    )
    assert result.results[1].fulfilled == False
    assert (
        result.results[1].justification.replace(str(some_file), "foo.txt")
        == "File `foo.txt` has a size of 0 bytes."
    )


def test_subprocess_run_ignores_missing_status(tmp_path: Path):
    (tmp_path / "log.txt").write_text(
        """\
{"INVALID_status": "RED", "reason": "some reason"}
{"result": {"criterion": "some criterion A", "fulfilled": false, "justification": "some justification A", "metadata": {"meta": "A"}}}
{"result": {"criterion": "some criterion B", "fulfilled": true, "justification": "some justification B", "metadata": {"meta": "B"}}}
"""  # noqa: LN002
    )
    result = subprocess.run(["cat", str(tmp_path / "log.txt")])

    assert result.returncode == 0
    assert result.status == None
    assert result.reason == "some reason"
    assert result.results == [
        Result(
            criterion="some criterion A",
            fulfilled=False,
            justification="some justification A",
            metadata={"meta": "A"},
        ),
        Result(
            criterion="some criterion B",
            fulfilled=True,
            justification="some justification B",
            metadata={"meta": "B"},
        ),
    ]


def test_subprocess_run_ignores_missing_reason(tmp_path: Path):
    (tmp_path / "log.txt").write_text(
        """\
{"status": "RED", "INVALID_reason": "some reason"}
{"result": {"criterion": "some criterion A", "fulfilled": false, "justification": "some justification A", "metadata": {"meta": "A"}}}
{"result": {"criterion": "some criterion B", "fulfilled": true, "justification": "some justification B", "metadata": {"meta": "B"}}}
"""  # noqa: LN002
    )
    result = subprocess.run(["cat", str(tmp_path / "log.txt")])

    assert result.returncode == 0
    assert result.status == "RED"
    assert result.reason == None
    assert len(result.results) == 2
    assert result.results == [
        Result(
            criterion="some criterion A",
            fulfilled=False,
            justification="some justification A",
            metadata={"meta": "A"},
        ),
        Result(
            criterion="some criterion B",
            fulfilled=True,
            justification="some justification B",
            metadata={"meta": "B"},
        ),
    ]


def test_subprocess_run_ignores_missing_results(tmp_path: Path):
    (tmp_path / "log.txt").write_text("""{"status": "RED", "reason": "some reason"}""")
    result = subprocess.run(["cat", str(tmp_path / "log.txt")])

    assert result.returncode == 0
    assert result.status == "RED"
    assert result.reason == "some reason"
    assert result.results == []


def test_subprocess_run_parses_output(tmp_path: Path):
    (tmp_path / "log.txt").write_text("""{"output": {"foo": "bar"}}""")

    result = subprocess.run(["cat", str(tmp_path / "log.txt")])
    assert result.outputs["foo"] == "bar"


def test_subprocess_run_parses_multiple_outputs(tmp_path: Path):
    (tmp_path / "log.txt").write_text(
        """{"output": {"foo": "bar"}}\n{"output": {"bar": "baz"}}"""
    )

    result = subprocess.run(["cat", str(tmp_path / "log.txt")])
    assert result.outputs["foo"] == "bar"
    assert result.outputs["bar"] == "baz"


@protect_results
@pytest.mark.parametrize("status", ["GREEN", "YELLOW", "RED", "FAILED", "ERROR"])
def test_stderr_and_stdout_are_shown_for_all_statuses_when_running_subprocesses_inside_cli(
    status, tmp_path
):
    class SimpleProvider:
        click_name = "simple"
        click_help_text = "help"

        @staticmethod
        def click_command():
            if status in ["GREEN", "YELLOW"]:
                fulfilled = "true"
            else:
                fulfilled = "false"
            (tmp_path / "log.txt").write_text(
                "\n".join(
                    [
                        f'{{"status": "{status}", "reason": "some reason"}}',
                        f'{{"result": {{"criterion": "some crit", "fulfilled": {fulfilled}, "justification": "some just"}}}}',
                        "Other text on stdout",
                    ]
                )
            )
            if status == "ERROR":
                result = subprocess.run(["bash", "-c", "exit 1"])
            else:
                result = subprocess.run(["cat", str(tmp_path / "log.txt")])
            result.exit_for_returncode()
            result.raise_for_status()
            RESULTS.extend(result.results)

        @staticmethod
        def click_evaluator_callback(results: ResultsCollector):
            return status, "reason for status"

    app = make_autopilot_app(SimpleProvider, version_callback=lambda: "1")

    runner = click.testing.CliRunner()

    result = runner.invoke(app)
    if status in ["GREEN", "YELLOW", "RED", "FAILED"]:
        returned_status = subprocess.parse_json_lines(result.stdout, "status")
        assert status == returned_status
        assert result.exit_code == 0, result.stdout
        assert result.stdout.count("some crit") == 1
        assert result.stdout.count("Other text on stdout") == 1
    elif status == "ERROR":
        assert result.exit_code == 1, result.stdout
    else:
        raise RuntimeError("Unknown status! Please add test code for this status!")
