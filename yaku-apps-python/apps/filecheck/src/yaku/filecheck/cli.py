from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import ResultsCollector

from .commands import exists, size


class CLI:
    click_name = "filecheck"
    click_command = None
    click_subcommands = [exists, size]
    click_help_text = "Generic file property checker"

    @staticmethod
    def click_evaluator_callback(results: ResultsCollector):
        if any([not r.fulfilled for r in results]):
            return "RED", "\n".join(
                [r.criterion + "\nBut: " + r.justification for r in results if not r.fulfilled]
            )
        else:
            return "GREEN", "\n".join([r.justification for r in results])


main = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)


if __name__ == "__main__":
    main()
