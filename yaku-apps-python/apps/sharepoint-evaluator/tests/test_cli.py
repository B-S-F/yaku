import json
from pathlib import Path
from unittest import mock

import click.testing
import pytest
from _pytest.logging import LogCaptureFixture
from loguru import logger
from yaku.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from yaku.autopilot_utils.results import assert_result_status
from yaku.sharepoint_evaluator.cli import CLI
from yaku.sharepoint_evaluator.config import ConfigFileContent, FileRules

DATA_PATH = Path(__file__).parent / "data"


@pytest.fixture
def mock_config_file(mocker):
    global options
    options = [
        "--config-file",
        "abc.yaml",
        "--evidence-path",
        "/tmp/dummy",
    ]

    config_file_content = ConfigFileContent(
        __root__=[FileRules(file="dummy/abc.txt", rules=[])]
    )
    mocker_config_file = mocker.patch(
        "yaku.sharepoint_evaluator.cli.ConfigFile",
    )
    mocker_config_file.return_value = mock.Mock(
        path=Path("abc.yaml"), content=config_file_content
    )
    return mocker_config_file


@pytest.fixture
def caplog(caplog: LogCaptureFixture):
    handler_id = logger.add(
        caplog.handler,
        format="{message}",
        level=0,
        filter=lambda record: record["level"].no >= caplog.handler.level,
        enqueue=False,  # Set to 'True' if your test is spawning child processes.
    )
    yield caplog
    logger.remove(handler_id)


def test_cli_treats_as_failure_if_file_in_rule_does_not_exist(mocker, mock_config_file):
    mocked_properties_reader = mocker.patch("yaku.sharepoint_evaluator.cli.PropertiesReader")
    mocked_properties_reader.return_value = mock.Mock(
        get_file_property=lambda f, a: "prop-value"
    )

    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)

    assert result.exit_code == 0
    assert_result_status(
        result.output,
        expected_status="FAILED",
        reason="File filter `dummy/abc.txt` mentioned in the config file",
    )


def test_cli_treats_as_failure_if_property_in_rule_is_a_number(tmp_path: Path, mocker):
    file_to_be_checked = tmp_path / "some.docx"
    file_to_be_checked.touch()

    docx_prop_file = tmp_path / "some.docx.__properties__.json"
    docx_prop_file.write_text(json.dumps({"prop1": "value1"}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text("{}")

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: some.docx
          rules:
            - property: 1
              equals: nothing
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(app, options)

    assert result.exit_code == 0
    assert_result_status(
        result.output, expected_status="FAILED", reason="Could not get property `1`"
    )


def test_cli_treats_as_failure_if_property_in_rule_does_not_exist(tmp_path: Path, mocker):
    file_to_be_checked = tmp_path / "some.docx"
    file_to_be_checked.touch()

    docx_prop_file = tmp_path / "some.docx.__properties__.json"
    docx_prop_file.write_text(json.dumps({"prop1": "value1"}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text("{}")

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: some.docx
          rules:
            - property: missing-prop
              equals: nothing
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )
    result = runner.invoke(app, options)

    assert result.exit_code == 0
    assert_result_status(
        result.output, expected_status="FAILED", reason="Could not get property `missing-prop`"
    )


def test_cli_returns_status_green_if_all_rules_are_valid(tmp_path, capsys):
    file_to_be_checked = tmp_path / "some.docx"
    file_to_be_checked.touch()

    docx_prop_file = tmp_path / "some.docx.__properties__.json"
    docx_prop_file.write_text(json.dumps({"prop1": "value1"}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text("{}")

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: some.docx
          rules:
            - property: prop1
              equals: value1
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    assert result.exit_code == 0
    assert '"status": "GREEN"' in result.output
    assert "some.docx" in result.output
    assert "Property `prop1` is equal to `value1`" in result.output


def test_cli_fails_if_rule_file_is_empty(tmp_path):
    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text("{}")

    rule_file = tmp_path / "config.yaml"
    rule_file.touch()

    options = [
        "--config-file",
        str(rule_file),
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    print(result.output)
    assert result.exit_code == 0
    assert '"status": "FAILED"' in result.output
    assert "Config file `config.yaml` is empty!" in result.output


def test_cli_returns_status_yellow_if_there_are_no_rules_for_a_file(tmp_path, capsys):
    file_to_be_checked = tmp_path / "some.docx"
    file_to_be_checked.touch()

    docx_prop_file = tmp_path / "some.docx.__properties__.json"
    docx_prop_file.write_text(json.dumps({"prop1": "value1"}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text("{}")

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: some.docx
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    assert result.exit_code == 0
    assert '"status": "YELLOW"' in result.output


def test_cli_returns_status_red_if_there_are_some_failing_rules(tmp_path, capsys):
    file_to_be_checked = tmp_path / "some.docx"
    file_to_be_checked.touch()

    docx_prop_file = tmp_path / "some.docx.__properties__.json"
    docx_prop_file.write_text(json.dumps({"prop1": "value1", "prop2": 5}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text("{}")

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: some.docx
          rules:
            - property: prop1
              equals: value1
            - property: prop2
              is-larger-than: 5
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    assert result.exit_code == 0
    assert '"status": "RED"' in result.output
    assert "for `some.docx` with value `5` was not successful!" in result.output


def test_cli_maps_list_fields_to_property_values_correctly(tmp_path, capsys):
    file_to_be_checked = tmp_path / "some.docx"
    file_to_be_checked.touch()

    docx_prop_file = tmp_path / "some.docx.__properties__.json"
    docx_prop_file.write_text(json.dumps({"SomeStatusId": 379}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text(json.dumps({"Some Status": {"379": "Valid"}}))

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: some.docx
          rules:
            - property: "SomeStatusId"
              equals: 379
            - property: "Some Status"
              equals: "Valid"
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--custom-properties",
        "SomeStatusId=>Some Status=>SomeStatus",
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    assert result.exit_code == 0
    assert '"status": "GREEN"' in result.output


def test_cli_maps_list_fields_to_property_values_correctly_with_identical_names(
    tmp_path, capsys
):
    file_to_be_checked = tmp_path / "some.docx"
    file_to_be_checked.touch()

    docx_prop_file = tmp_path / "some.docx.__properties__.json"
    docx_prop_file.write_text(json.dumps({"SameName4PropAndList": 379}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text(json.dumps({"SameName4PropAndList": {"379": "Valid"}}))

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: some.docx
          rules:
            - property: "SameName4PropAndList"
              equals: "Valid"
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--custom-properties",
        "SameName4PropAndList=>SameName4PropAndList=>SomeStatusTitle",
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    assert result.exit_code == 0
    assert '"status": "GREEN"' in result.output


def test_cli_raises_error_on_invalid_custom_property_mapping(tmp_path: Path):
    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text(json.dumps({"Some Status": {"379": "Valid"}}))

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: some.docx
          rules:
            - property: "SomeStatusId"
              equals: 379
            - property: "Some Status"
              equals: "Valid"
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--custom-properties",
        "SomeStatusId=>Some Status=>SomeStatus|garbage%^&(*",
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    assert result.exit_code == 0
    assert '"status": "FAILED"' in result.output
    assert "Could not parse title mapping: garbage%^&(*." in result.output


def test_cli_finds_file_in_rule_with_wildcard(tmp_path: Path):
    file_to_be_checked = tmp_path / "some.docx"
    file_to_be_checked.touch()

    docx_prop_file = tmp_path / "some.docx.__properties__.json"
    docx_prop_file.write_text(json.dumps({"prop1": "value1"}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text("{}")

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: "*.docx"
          rules:
            - property: prop1
              equals: value1
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    assert result.exit_code == 0
    assert '"status": "GREEN"' in result.output
    assert '"result": {"criterion":' in result.output


def test_cli_treats_as_failure_if_wildcard_does_not_match_anything(tmp_path: Path):
    other_file = tmp_path / "some.docx"
    other_file.touch()

    other_prop_file = tmp_path / "some.docx.__properties__.json"
    other_prop_file.write_text(json.dumps({"prop1": "value1"}))

    props_file = tmp_path / "__custom_property_definitions__.json"
    props_file.write_text("{}")

    rule_file = tmp_path / "config.yaml"
    rule_file.write_text(
        """\
        - file: "*.txt"
          rules:
            - property: prop1
              equals: value1
    """
    )

    options = [
        "--config-file",
        str(rule_file),
        "--evidence-path",
        str(tmp_path),
    ]
    runner = click.testing.CliRunner()
    app = make_autopilot_app(
        version_callback=read_version_from_package(__package__),
        provider=CLI,
    )

    result = runner.invoke(app, options)
    assert result.exit_code == 0
    assert "did not match any files" in result.output
    assert "prop1" in result.output
    assert "value1" in result.output
