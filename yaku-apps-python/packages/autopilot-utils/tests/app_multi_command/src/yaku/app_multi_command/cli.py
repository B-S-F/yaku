import click
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package

from .commands import aaa, bbb


class CLI:
    click_name = "app_multi_command"
    click_help_text = "Simple demo program for test purposes with just a simple command."

    click_setup = [
        click.option("--fail", is_flag=True),
    ]

    click_subcommands = [aaa, bbb]

    click_evaluator_callback = None


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    cli()
