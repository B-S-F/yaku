"""
Handle evaluator results.

# Usage

Just import the `RESULTS` singleton and append results to it:

    from yaku.autopilot_utils.results import RESULTS, Result

    RESULTS.append(Result(criterion="...", fulfilled=False, justification="..."))

When using the click app template in [cli_base.py](./cli_base.py), make
sure to define a `click_evaluator_callback` which receives the collected
results and must return a status and a reason:

    def click_evaluator_callback(results: ResultsCollector) -> Tuple[str, str]:
        for result in results:
            # ... examine results
            # ... and define reason, status
        return status, reason

# Testing

During tests, when modifying the `RESULTS` singleton, it must be
reset after the test. This can be done with the `protect_results`
decorator which you simply put around your test function:

    from yaku.autopilot_utils.results import RESULTS, protect_results

    @protect_results
    def test_result_handling():
        # do something with RESULTS
        RESULTS.append(...)

    # after the test has finished, RESULTS will be reset to previous state

"""

import json
import re
from dataclasses import dataclass, field
from functools import wraps
from typing import Any, Callable, Tuple


@dataclass
class Output:
    key: str
    value: Any

    def to_json(self) -> str:
        return json.dumps({"output": {self.key: self.value}})


@dataclass
class Result:
    criterion: str
    fulfilled: bool
    justification: str
    metadata: dict = field(default_factory=dict)

    def __post_init__(self):
        if not isinstance(self.fulfilled, bool):
            if self.fulfilled in ("true", "True", 1, "1"):
                self.fulfilled = True
            elif self.fulfilled in ("false", "False", 0, "0"):
                self.fulfilled = False
            else:
                raise ValueError(
                    f"Value for 'fulfilled' is not a valid boolean value: {self.fulfilled}"
                )


class ResultsCollector(list[Result]):
    def append(self, result: Result) -> None:
        if not isinstance(result, Result):
            raise TypeError("Given result is not a Result object!")
        super().append(result)

    def __bool__(self) -> bool:
        return all({r.fulfilled for r in self})

    def to_json(self):
        lines = []
        for result in self:
            lines.append(json.dumps({"result": result.__dict__}))
        return "\n".join(lines)


RESULTS = ResultsCollector()

ResultHandler = Callable[[ResultsCollector], Tuple[str, str]]


def protect_results(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        backup = RESULTS.copy()
        RESULTS.clear()
        assert len(RESULTS) == 0
        try:
            f(*args, **kwargs)
        finally:
            RESULTS.clear()
            RESULTS.extend(backup)

    return wrapper


def assert_no_result_status(output: str):
    """Assert that there is no JSON line with a status in the output."""
    __tracebackhide__ = True
    status_found = False
    for line in output.split("\n"):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue
        else:
            if "status" in data:
                status_found = True
                break
    if status_found:
        raise AssertionError("There was an unexpected JSON line 'status' property!")


def assert_result_status(output: str, expected_status: str, reason: str | None = None):
    """
    Parse JSON lines in output and look for status and reason properties.

    This function is a testing utility when you want to verify autopilot output.
    It parses the output and looks for JSON lines and then verifies that
    there is a `status` property with the `expected_status` and optionally it
    matches the `reason` property against a regular expression given in `reason`.
    """
    __tracebackhide__ = True
    status_found = False
    reason_found = False
    for line in output.split("\n"):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue
        else:
            if "status" in data:
                assert data["status"] == expected_status, (
                    f"Received status '{data['status']}' is not matching the expected "
                    f"status '{expected_status}'!\nThe full output was:\n\n" + output
                )
                status_found = True
            if reason is not None and "reason" in data:
                assert re.match(reason, data["reason"], flags=re.DOTALL), (
                    "Provided reason field in the JSON line did not match expected regular expression. "
                    "Are there meta-characters in the regular expression for the reason value:\n\n"
                    f"{reason}\n\n"
                    f"Reason field content was:\n\n{data['reason']}"
                )
                reason_found = True
            if status_found and (reason is None or reason_found):
                break
    else:
        assert status_found, (
            "Could not find a valid JSON line with status in the following output:\n\n"
            + output
        )
        assert reason is None or reason_found, (
            "Could not find a valid JSON line with reason in the following output:\n\n"
            + output
        )


def DEFAULT_EVALUATOR(results: ResultsCollector):
    """
    Evaluate results and return RED status if any criterion is not fulfilled.

    This is the default implementation of the evaluator and can be used
    in papsr or autopilot apps. Simply use it as:

        class CLI:
            click_evaluator_callback = DEFAULT_EVALUATOR
    """
    if any([not r.fulfilled for r in results]):
        return "RED", "\n".join(
            [
                "Criterion is: " + r.criterion + "\nBut: " + r.justification
                for r in results
                if not r.fulfilled
            ]
        )
    else:
        return "GREEN", "\n".join([r.justification for r in results])
