from typing import Tuple

from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import ResultsCollector

from .commands import check, hello


class CLI:
    click_name = "demo"
    click_subcommands = [hello, check]
    click_help_text = "Simple demo program for test purposes."

    @staticmethod
    def click_evaluator_callback(results: ResultsCollector) -> Tuple[str, str]:
        greens = len([r for r in results if r.fulfilled])
        alls = len(results)
        if greens == alls:
            return "GREEN", "All criteria were fulfilled."
        if greens >= alls / 2:
            return "YELLOW", "At least half of the criteria were fulfilled."
        return "RED", "Not half of the criteria were fulfilled!"


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    cli()
