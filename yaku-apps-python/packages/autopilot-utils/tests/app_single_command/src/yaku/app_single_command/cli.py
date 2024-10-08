import click
from loguru import logger
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package


class CLI:
    click_name = "app_single_command"
    click_help_text = "Simple demo program for test purposes with just a simple command."

    click_setup = [
        click.option("--fail", is_flag=True),
    ]

    @staticmethod
    def click_command(fail: bool):
        logger.info("Inside click_command")
        if fail:
            raise Exception("Failing as requested...")
        logger.info("Should be doing something useful here!")


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    cli()
