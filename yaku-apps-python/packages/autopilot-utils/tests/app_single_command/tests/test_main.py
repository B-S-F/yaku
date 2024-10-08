from click.testing import CliRunner
from yaku.app_single_command.cli import cli


def test_cli():
    runner = CliRunner()
    result = runner.invoke(cli, ["--fail"])
    assert result.exit_code == 1
    assert "An unexpected error has occurred." in result.output
