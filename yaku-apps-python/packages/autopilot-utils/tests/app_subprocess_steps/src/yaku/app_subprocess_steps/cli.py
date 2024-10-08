import tempfile
from enum import IntEnum
from typing import Tuple

import click
from loguru import logger
from yaku.autopilot_utils import subprocess
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import RESULTS, ResultsCollector


class Status(IntEnum):
    ERROR = 1
    FAILED = 2
    RED = 3
    YELLOW = 4
    GREEN = 5
    NA = 6
    UNANSWERED = 7


class CLI:
    click_name = "app_subprocess_steps"
    click_help_text = "Simple demo program for test purposes with just a simple command."

    click_setup = [
        click.argument("sub_statuses", nargs=-1),
    ]

    @staticmethod
    def click_command(sub_statuses: list[str]):
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".sh") as script_file:
            script_file.write(
                """\
#!/usr/bin/env bash
set -eux
NR=$1
STATUS=$2
echo "stdout output of step ${NR}"
echo "stderr output of step ${NR}" >&2
echo '{"output": {"prelim_output_from_step_'${NR}'": "value_'${NR}'"}}'
if [ "${STATUS}" == "ERROR" ]; then exit 1; fi
if [ "${STATUS}" == "RED" ]; then
  FULFILLED=false
else
  FULFILLED=true
fi
echo '{"status": "'${STATUS}'", "reason": "Some reason for status '${STATUS}' from step '${NR}'"}'
if [ "${STATUS}" == "FAILED" ]; then
  exit 0
fi
echo '{"result": {"criterion": "crit from step '${NR}'", "fulfilled": '${FULFILLED}', \
"justification": "just'${NR}'", "metadata": {"status": "'${STATUS}'"}}}'
echo '{"output": {"output_key_from_step_'${NR}'": "output_value_'${NR}'"}}'
"""
            )
            script_file.flush()
            logger.info("Inside click_command")
            for step_count, step_status in enumerate(sub_statuses):
                print(f">>>>> Running step {step_count} with status {step_status}")
                print(script_file.name)
                step = subprocess.run(
                    ["bash", script_file.name, str(step_count), str(step_status)]
                )
                step.exit_for_returncode()
                step.raise_for_status()
                print(step.results)
                for result in step.results:
                    RESULTS.append(result)
                print(step.outputs.to_json())
                assert (
                    step_status == step.status
                ), f"Step status {step.status} is not as expected ({step_status})"
                print("")

    @staticmethod
    def click_evaluator_callback(results: ResultsCollector) -> Tuple[str, str]:
        print("FOOOOOOOOOO")
        sub_statuses: list[Status] = []
        for r in results:
            sub_statuses.append(Status[r.metadata["status"]])
        final_status = sorted(sub_statuses)[0]
        return final_status.name, "some reason"


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    cli()
