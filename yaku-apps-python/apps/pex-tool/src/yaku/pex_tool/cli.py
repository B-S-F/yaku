from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package

from .commands import find_deps, get_wheels, license_info


class CLI:
    click_name = "pex-tool"
    click_help_text = ""

    click_subcommands = [get_wheels, license_info, find_deps]


cli = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    cli()
