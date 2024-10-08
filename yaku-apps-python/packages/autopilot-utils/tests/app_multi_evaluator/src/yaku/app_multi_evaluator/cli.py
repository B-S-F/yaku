import click
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package

from .commands import check_a, check_b


class CLI:
    click_name = "app_multi_evaluator"
    click_help_text = (
        "Simple demo program for test purposes with two evaluators as subcommands."
    )

    click_setup = [
        click.option("--fail", is_flag=True),
    ]

    click_subcommands = [check_a, check_b]


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
    allow_chaining=False,
)

if __name__ == "__main__":
    cli()
