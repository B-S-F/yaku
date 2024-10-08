import click
from loguru import logger
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import DEFAULT_EVALUATOR, RESULTS, Result


class CLI:
    click_name = "app_super_simple_evaluator"
    click_help_text = "Simple demo program for test purposes with just a simple check."

    click_setup = [
        click.option("--fail", is_flag=True),
        click.option("--red", is_flag=True),
    ]

    @staticmethod
    def click_command(fail: bool, red: bool):
        logger.info("Inside click_command")
        logger.info("Doing some evaluations")
        if fail:
            raise Exception("Failing during evaluation")
        RESULTS.append(
            Result(
                criterion="Some criterion", fulfilled=not red, justification="Needed for test"
            )
        )

    click_evaluator_callback = DEFAULT_EVALUATOR


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    cli()
