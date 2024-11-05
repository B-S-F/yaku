import os

import mock
from click.testing import CliRunner

from yaku.artifactory_fetcher.cli import main


@mock.patch.dict(
    os.environ,
    {
        "ARTIFACTORY_URL": "https://artifactory.test.com/artifactory",
        "REPOSITORY_NAME": "test_repo_name",
        "ARTIFACT_PATH": "test_artifact_path",
        "ARTIFACTORY_USERNAME": "correctUser",
        "ARTIFACTORY_API_KEY": "correctPassword",
        "evidence_path": "test/notOK/",
    },
)
def test_main(mocker):
    mocker.patch(
        "yaku.artifactory_fetcher.cli.create_artifactory_client",
        side_effect=Exception("Boom!"),
    )
    runner = CliRunner()
    result = runner.invoke(main, ["--no-colors"])
    assert result.exit_code == 1
    assert "Boom!" in result.output
