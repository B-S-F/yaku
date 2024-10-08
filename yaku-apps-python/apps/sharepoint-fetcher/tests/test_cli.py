import os
from pathlib import Path
from unittest import mock

import click.testing
import pytest
import requests
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import assert_result_status
from yaku.sharepoint_fetcher.cli import CLI, create_property_title_mapping


def test_trigger_fetcher_with_file(mocker, requests_mock, capsys):
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/Shared/Documents/Topic/Unittest/')",
        status_code=200,
        json={"d": ["_meta", {"Files": ["a", "b"]}]},
    )

    mocked_download_file = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._download_file"
    )
    mocked_download_file.return_value = {}

    mocked_download_custom_property_definitions: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.download_custom_property_definitions"
    )

    mocker.patch("os.makedirs")
    project_path = "Shared/Documents/Topic/Unittest/MyDocument.docx"

    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            project_path,
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "",
        ],
    )
    remote_path, remote_file = project_path.rsplit("/", maxsplit=1)
    output_path = Path(os.getcwd())
    mocked_download_file.assert_called_with(
        output_path, "/sites/123456/" + remote_path + "/", remote_file
    )

    mocked_download_custom_property_definitions.assert_called_once()

    assert '{"output":' in result.output


def test_trigger_fetcher_with_file_with_whitespace(mocker, requests_mock, capsys):
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/Shared/My%20Documents/Topic/Unittest/')",
        status_code=200,
        json={"d": ["_meta", {"Files": ["a", "b"]}]},
    )

    mocked_download_file = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise._download_file"
    )
    mocked_download_file.return_value = {}

    mocked_download_custom_property_definitions: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.download_custom_property_definitions"
    )

    mocker.patch("os.makedirs")
    project_path = "Shared/My Documents/Topic/Unittest/My Document.docx"

    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            project_path,
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "",
        ],
    )

    remote_path, remote_file = project_path.rsplit("/", maxsplit=1)
    output_path = Path(os.getcwd())
    mocked_download_file.assert_called_with(
        output_path, "/sites/123456/" + remote_path + "/", remote_file
    )

    mocked_download_custom_property_definitions.assert_called_once()

    assert '{"output":' in result.output
    assert "/My%20Documents/" in result.output
    assert "/My%20Document.docx" in result.output


def test_trigger_fetcher_shows_error_for_filename_without_path():
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            "NoPathHereJustMyDocument.docx",
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "",
        ],
    )

    assert "doesn't seem to point to a file" in result.output


def test_trigger_fetcher_with_missing_config_file():
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--config-file",
            "missing_config.file",
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            "Shared/Documents/Topic/Unittest/MyDocument.docx",
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "",
        ],
    )

    assert "missing_config.file" in result.output


def test_trigger_fetcher_with_missing_file_404(mocker, capsys):
    mocked_check_dir_access = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.check_dir_access"
    )
    mocked_check_dir_access.return_value = ""

    mocked_download_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.download_file"
    )

    mocked_download_custom_property_definitions: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.download_custom_property_definitions"
    )

    def download_404_file(self, url):
        error404 = requests.exceptions.HTTPError(url, 404)
        error404.response = requests.Response()
        error404.response.status_code = 404
        raise error404

    mocked_download_file.side_effect = download_404_file

    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            "Shared/Documents/Topic/Unittest/MyDocument.docx",
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "",
        ],
    )

    mocked_download_custom_property_definitions.assert_not_called()
    assert '{"output":' not in result.output
    assert (
        "Given file was not found! If the URL is pointing to a directory, make sure to append a '/' at the end!"
        in result.output
    )


def test_trigger_fetcher_with_file_error_500(mocker, capsys):
    mocked_check_dir_access = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.check_dir_access"
    )
    mocked_check_dir_access.return_value = ""

    mocked_download_file: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.download_file"
    )

    def download_500_file(self, url):
        error500 = requests.exceptions.HTTPError(url, 500)
        error500.response = requests.Response()
        error500.response.status_code = 500
        raise error500

    mocked_download_file.side_effect = download_500_file

    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            "Shared/Documents/Topic/Unittest/MyDocument.docx",
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "",
        ],
    )

    assert '{"output":' not in result.output
    assert "[Errno MyDocument.docx] 500" in result.output


def test_trigger_fetcher_with_folder(mocker, requests_mock, capsys):
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/Shared/Documents/Topic/Unittest/')",
        status_code=200,
        json={"d": ["_meta", {"Files": ["a", "b"]}]},
    )

    mocked_download_folder = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.download_folder"
    )
    mocked_download_folder.return_value = {}

    mocked_download_custom_property_definitions: mock.Mock = mocker.patch(
        "yaku.sharepoint_fetcher.on_premise.sharepoint_fetcher_on_premise.SharepointFetcherOnPremise.download_custom_property_definitions"
    )

    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            "Shared/Documents/Topic/Unittest/",
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "",
        ],
    )

    mocked_download_folder.assert_called_with()
    mocked_download_custom_property_definitions.assert_called_once()

    assert '{"output":' in result.output


def test_trigger_fetcher_with_folder_and_selector_with_custom_properties(
    requests_mock, tmp_path: Path, capsys
):
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/Shared/Documents/Topic/Unittest/')",
        json={"d": ["_meta", {"Files": ["a", "b"]}]},
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/Lists",
        json={"d": {"results": [{"Title": "Custom List", "ItemCount": 42}]}},
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/Lists/GetByTitle('Custom%20List')/items",
        json={
            "d": {
                "results": [
                    {"CustomListTitleAttribute": "valid", "Id": "1"},
                    {"CustomListTitleAttribute": "invalid", "Id": "2"},
                    {"CustomListTitleAttribute": "valid", "Id": "3"},
                ]
            }
        },
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/Shared/Documents/Topic/Unittest/')/folders",
        json={"d": {"results": []}},
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/Shared/Documents/Topic/Unittest/')/files",
        json={
            "d": {
                "results": [
                    {"Name": "File1.docx"},
                    {"Name": "File2.docx"},
                    {"Name": "File3.pdf"},
                ]
            }
        },
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/Shared/Documents/Topic/Unittest/File1.docx')/$value",
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/Shared/Documents/Topic/Unittest/File2.docx')/$value",
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/Shared/Documents/Topic/Unittest/File1.docx')/ListItemAllFields",
        json={"d": {"customId": 1}},
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/Shared/Documents/Topic/Unittest/File2.docx')/ListItemAllFields",
        json={"d": {"customId": 2}},
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/Shared/Documents/Topic/Unittest/File3.pdf')/ListItemAllFields",
        json={"d": {"customId": 3}},
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/Shared/Documents/Topic/Unittest/File1.docx')/Properties",
        json={"d": {"vti_x005f_filesize": 0}},
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/Shared/Documents/Topic/Unittest/File2.docx')/Properties",
        json={"d": {"vti_x005f_filesize": 0}},
    )
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFileByServerRelativePath(decodedurl='/sites/123456/Shared/Documents/Topic/Unittest/File3.pdf')/Properties",
        json={"d": {"vti_x005f_filesize": 0}},
    )

    fetcher_config = tmp_path / "fetcher-config.yaml"
    os.environ["SHAREPOINT_FETCHER_CONFIG_FILE"] = str(fetcher_config)
    fetcher_config.write_text(
        """\
- files: File*.docx
  title: "File title"
  select:
    - property: "Custom List"
      equals: "valid"
    """
    )

    evidence_folder = tmp_path / "evidence"
    evidence_folder.mkdir(parents=True)

    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--destination-path",
            evidence_folder,
            "--config-file",
            fetcher_config,
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            "Shared/Documents/Topic/Unittest/",
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "customId=>Custom List=>CustomListTitleAttribute",
        ],
    )
    assert '{"output":' in result.output


def test_trigger_fetcher_file_not_accessible(mocker, requests_mock, capsys):
    requests_mock.get(
        "https://my.sharepoint.com/sites/123456/_api/web/GetFolderByServerRelativeUrl('/sites/123456/Shared/Documents/Topic/Unittest/')",
        status_code=401,
        json={"res": "Unauthorized access!"},
    )
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(
        app,
        [
            "--username",
            "testuser",
            "--password",
            "testpassword",
            "--project-path",
            "Shared/Documents/Topic/Unittest/",
            "--project-site",
            "https://my.sharepoint.com/sites/123456/",
            "--custom-properties",
            "",
        ],
    )
    assert result.exit_code == 0
    assert_result_status(
        result.output,
        expected_status="FAILED",
        reason="The passed credentials are not authorized to access URL https://my.sharepoint.com/sites/123456/.*",
    )
    assert "The passed credentials are not authorized to access URL" in result.output


def test_create_property_title_mapping():
    assert create_property_title_mapping(None) == {}
    assert create_property_title_mapping("") == {}
    assert create_property_title_mapping("A=>B=>C") == {"B": "C"}
    assert create_property_title_mapping("A=>B=>C|D=>E=>F") == {"B": "C", "E": "F"}

    with pytest.raises(ValueError, match="not enough values"):
        create_property_title_mapping("A=>B")

    with pytest.raises(ValueError, match="not enough values"):
        create_property_title_mapping("A>B=>C")

    with pytest.raises(ValueError, match="not enough values"):
        create_property_title_mapping("A=>B=>C|D=>E")
