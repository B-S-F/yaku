"""
Support for running other autopilot apps as subprocess to a papsr app.

When developing a Python autopilot script app, it might be necessary to call
other autopilot apps. As they are standalone applications, they can only be
called through normal system subprocesses.

To support this use-case better, this module provides a special `run` function
which mimics the builtin `subprocess.run` function, but extends the result
of this function by some extra fields, e.g. for getting the list of outputs
from an autopilot call. See :py:func:`run` for details.

As an example, we want to run two autopilot apps in a row and provide a special
result message if both succeed:

    # first we call the other app
    step1 = run(["sharepoint-fetcher"])
    # if the other app returned a non-zero exit code, the next line
    # would immediately exit the program and print the other app's
    # stdout and stderr log
    step1.exit_for_returncode()
    # if the other app returned a non-GREEN, non-RED, or non-YELLOW status,
    # we can use this line to raise an `AutopilotSubprocessFailure` and stop
    # any further processing in our current function.
    # This would still print the other app's stdout and stderr log as well
    # as the outputs and results of the other app.
    step1.raise_for_status()
    # now, we can (but don't have to) add the results from step 1
    # to the main log so that they appear later in the HTML result
    for r in step1.results:
        RESULTS.append(r)

    # then we do the same for the second app
    step2 = run(["artifactory-fetcher"])
    step2.exit_for_returncode()
    step2.raise_for_status()
    for r in step2.results:
        RESULTS.append(r)

    # and finally, when both previous steps have succeeded (GREEN or YELLOW)
    # we can prepare a final message:
    RESULTS.append(
        Result(
            criterion="Both files are fetched correctly.",
            fulfilled=True,
            justification="Both fetchers finished successfully.",
        )
    )

Of course, this final step could also be done in the `click_evaluator_callback`,
but the logic above allows full flexibility on the flow control between the
different subprocesses. Also, _outputs_ could be retrieved from `step1` and
used for `step2`.
"""

import dataclasses
import json
import os
import subprocess
import sys
from typing import Any, Callable, List, Mapping, Optional, Protocol

from loguru import logger
from yaku.autopilot_utils.results import Result, ResultsCollector


class DataclassJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        return super().default(o)


class OutputMap(dict):
    def __init__(self, mapping: Mapping[str, str] | None = None):
        if mapping:
            super().__init__(mapping)
        else:
            super().__init__()

    def to_json(self):
        return "\n".join(
            [json.dumps({"output": {k: v}}, cls=DataclassJSONEncoder) for k, v in self.items()]
        )


class ProcessResult(Protocol):
    """Type helper for the merged type of subprocess.ProcessResult and custom attributes."""

    # attributes from builtin subprocess.CompletedProcess
    args: List[str] | str
    stdout: str
    stderr: str
    returncode: int
    # extra attributes
    status: None | str
    reason: str
    clean_stdout: str
    results: ResultsCollector
    outputs: OutputMap
    exit_for_returncode: Callable
    raise_for_status: Callable


class AutopilotSubprocessFailure(Exception):
    """
    Indicate a failing subprocess.

    If a subprocess fails, it is often required to skip any following checks.
    This exception can be used to indicate that some steps have failed and that
    evaluation should be done immediately.
    """

    def __init__(self, process_result: ProcessResult):
        self.process_result = process_result


def gen_exit_for_returncode(process_result: ProcessResult):
    """Provide a function for exiting on a failed subprocess."""

    def exit_for_returncode():
        if process_result.returncode != 0:
            logger.error(process_result.args)
            logger.error(
                "Subprocess exited with returncode {code}.", code=process_result.returncode
            )
            if process_result.stdout:
                logger.error(process_result.stdout)
            if process_result.stderr:
                logger.error(process_result.stderr)
            sys.exit(process_result.returncode)
        else:
            if process_result.clean_stdout:
                print(process_result.clean_stdout)
            if process_result.stderr:
                print(process_result.stderr, file=sys.stderr)

    return exit_for_returncode


def gen_raise_for_status(process_result: ProcessResult):
    """
    Provide a function for exiting on a failed subprocess result.

    The returned function will raise an `AutopilotSubprocessFailure`
    if the `process_result.status` is not `GREEN`, `YELLOW` or `RED`.

    If `ignore_no_status==True`, it will silently ignore a `None`
    status, otherwise raise the above exception.
    """

    def raise_for_status(ignore_no_status=True):
        assert (
            process_result.returncode == 0
        ), "raise_for_status() should only be called after exit_for_returncode() because it doesn't check the returncode!"
        if process_result.status is None and ignore_no_status:
            return
        if process_result.status in ("GREEN", "YELLOW", "RED"):
            return
        print(process_result.results.to_json())
        print(process_result.outputs.to_json())

        print(
            json.dumps(
                {
                    "status": process_result.status,
                    "reason": f"Subprocess {process_result.args} failed. Reason: {process_result.reason if process_result.reason else 'unknown'}",
                }
            )
        )
        raise AutopilotSubprocessFailure(process_result)

    return raise_for_status


def run(
    command, /, shell: bool = False, extra_env: Optional[Mapping[str, str]] = None, **kwargs
) -> ProcessResult:
    """
    Run another autopilot app in a subprocess.

    This function is a wrapper around `subprocess.run`, so it executes
    the given `command` and passes any `kwargs` to the `subprocess.run`
    function.

    Motivation for this wrapper was that there should be an easy way to
    call an autopilot app as a subfunction and access its status and
    results:

        result = run(["sharepoint-fetcher"])
        if result.status == 'GREEN': ...
        if result.results[0].fulfilled: ...
        # and so on

    After the command has finished, it parses the resulting stdout and
    extracts `status`, `reason`, `clean_stdout`, `results` data and
    attaches it to the returned object.

    Additionally, it provides two functions in the returned object:
    * `exit_for_returncode()` can be called if you want to do a system
      exit in case of a non-zero return code.
    * `raise_for_status()` which raises a `AutopilotSubprocessFailure`
      if the subprocess app status is not `GREEN`, `YELLOW`, or `RED`
      (`None` is ignored as well).
    """
    env = None
    if extra_env is not None:
        env = os.environ.copy()
        env.update(extra_env)
    logger.debug("Executing subprocess: {cmd}", cmd=command)
    process_result: ProcessResult = subprocess.run(
        command,
        encoding="utf-8",
        shell=shell,
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE,
        env=env,
        **kwargs,
    )  # type: ignore
    if process_result.returncode != 0:
        process_result.status = "ERROR"
    else:
        process_result.status = parse_json_lines(process_result.stdout, "status")
    process_result.reason = parse_json_lines(process_result.stdout, "reason")

    process_result.results = ResultsCollector(
        parse_json_lines_into_list(process_result.stdout, "result", cls=Result)
    )
    process_result.outputs = OutputMap(
        parse_json_lines_into_map(process_result.stdout, "output")
    )
    process_result.clean_stdout = clean_json_lines(process_result.stdout)
    process_result.exit_for_returncode = gen_exit_for_returncode(process_result)
    process_result.raise_for_status = gen_raise_for_status(process_result)

    logger.debug(
        "Process exited with code {code} and status {status}",
        code=process_result.returncode,
        status=process_result.status,
    )
    logger.debug(process_result.stdout)
    logger.debug(process_result.results)
    logger.debug(process_result.outputs)

    return process_result


def clean_json_lines(text: str) -> str:
    """Remove any JSON line from text."""
    cleaned_lines = []
    for line in text.split(os.linesep):
        try:
            json.loads(line.strip())
        except json.JSONDecodeError:
            cleaned_lines.append(line)
    return os.linesep.join(cleaned_lines)


def parse_json_lines(text: str, attribute: str) -> Any:
    """
    Parse JSON line attribute from a text.

    Looks for the `attribute` in the text by parsing JSON line data
    and extracting the latest mentioning of `attribute`.

    For example calling `parse_json_lines(text, 'flag')` for the following text
    would return a `True`:

        Some text line
        {"key": "value", "flag": False}
        Some more text
        {"key": "value", "flag": True}
        Some final text
    """
    parse_result = None
    for line in text.split(os.linesep):
        try:
            data = json.loads(line.strip())
        except json.JSONDecodeError:
            continue
        try:
            parse_result = data[attribute]
        except KeyError:
            pass
    return parse_result


def parse_json_lines_into_list(text: str, attribute: str, cls=None) -> List[Any]:
    """
    Parse JSON line attributes into a list.

    Looks for the `attribute` in the text by parsing JSON line data and extracts
    all mentionings of that attribute and combines them into a list and returns
    the full list.

    If `cls` is given, will try to pass the value of `attribute` to `cls` to
    instantiate an instance of `cls` with the given attributes.
    """
    parse_result = []
    for line in text.split(os.linesep):
        data = parse_json_lines(line, attribute)
        if data:
            if cls is not None:
                try:
                    parse_result.append(cls(**data))
                except TypeError:
                    parse_result.append(cls(*data))
            else:
                parse_result.append(data)
    return parse_result


def parse_json_lines_into_map(text: str, attribute: str) -> Mapping[str, Any]:
    """Parse JSON line attributes into a mapping."""
    parse_result = {}
    for line in text.split(os.linesep):
        data = parse_json_lines(line, attribute)
        if data:
            for k, v in data.items():
                parse_result[k] = v
    return parse_result
