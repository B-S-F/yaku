from pathlib import Path

import pytest
from yaku.autopilot_utils.errors import AutopilotConfigurationError
from yaku.sharepoint_evaluator.config import ConfigFile
from yaku.sharepoint_evaluator.rules import Rule, read_file_rules

DATA_PATH = Path(__file__).parent / "data"


def test_read_file_rules_with_missing_check(tmp_path: Path):
    config_file_path = tmp_path / "sharepoint-evaluator-rules.yaml"
    config_file_path.write_text(
        """
        - file: 'ProcessStatus.docx'
          rules:
            - property: 'CSC'
              is-larger-equal-than: 1
            - property: 'Description'
              #contains: 'some word'
    """
    )
    config_file = ConfigFile(file_path=str(config_file_path))
    with pytest.raises(
        AutopilotConfigurationError,
        match="There is no check given for property 'Description'!",
    ):
        read_file_rules(config_file.content, DATA_PATH)


def test_read_file_rules_with_unknown_check(tmp_path: Path):
    config_file_path = tmp_path / "sharepoint-evaluator-rules.yaml"
    config_file_path.write_text(
        """
        - file: 'ProcessStatus.docx'
          rules:
            - property: 'CSC'
              is-larger-equal-than: 1
            - property: 'Description'
              enthaelt: 'some word'
    """
    )
    config_file = ConfigFile(file_path=str(config_file_path))
    with pytest.raises(AutopilotConfigurationError, match="Unknown operator 'enthaelt'!"):
        read_file_rules(config_file.content, DATA_PATH)


def test_read_file_rules(tmp_path: Path):
    config_file_path = tmp_path / "sharepoint-evaluator-rules.yaml"
    config_file_path.write_text(
        """
        - file: 'ProcessStatus.docx'
          rules:
            - property: 'Date'
              equals: 'some date'
            - property: 'CSC'
              equals: "1"
            - property: 'CSC'
              is-larger-equal-than: 1
            - property: 'Description'
              contains: 'some word'
            - property: 'ArchiveDate'
              is-older-than: "1 year"
            - property: 'Modified'
              is-not-older-than: "2022-09-01T00:00Z"
            - property: 'Revision'
              is-less-than: 5
            - property: 'Revision'
              less-than: 5
            - property: 'MinorRevision'
              is-less-equal-than: 5
    """
    )
    config_file = ConfigFile(file_path=str(config_file_path))
    file_rules = read_file_rules(config_file.content, DATA_PATH)

    assert len(file_rules) == 1

    filename = file_rules[0].file
    assert filename == DATA_PATH / "ProcessStatus.docx"

    rules = file_rules[0].rules
    assert len(rules) == 9

    assert rules[0] == Rule(property="Date", operator="equals", other_value="some date")
    assert rules[1] == Rule(property="CSC", operator="equals", other_value="1")
    assert rules[2] == Rule(property="CSC", operator="is-larger-equal-than", other_value=1)
    assert rules[3] == Rule(
        property="Description", operator="contains", other_value="some word"
    )
    assert rules[4] == Rule(
        property="ArchiveDate", operator="is-older-than", other_value="1 year"
    )
    assert rules[5] == Rule(
        property="Modified",
        operator="is-not-older-than",
        other_value="2022-09-01T00:00Z",
    )
    assert rules[6] == Rule(property="Revision", operator="is-less-than", other_value=5)
    assert rules[7] == Rule(property="Revision", operator="less-than", other_value=5)
    assert rules[8] == Rule(
        property="MinorRevision", operator="is-less-equal-than", other_value=5
    )


@pytest.mark.parametrize(
    ("operator", "phrase"),
    [
        ("contains", "contains"),
        ("empty", "is empty"),
        ("equal", "is equal to"),
        ("equals", "is equal to"),
        ("is-empty", "is empty"),
        ("is-equal", "is equal to"),
        ("is-larger", "is larger than"),
        ("is-larger-equal", "is larger than or equal to"),
        ("is-larger-equal-than", "is larger than or equal to"),
        ("is-larger-than", "is larger than"),
        ("is-less", "is less than"),
        ("is-less-equal", "is less than or equal to"),
        ("is-less-equal-than", "is less than or equal to"),
        ("is-less-than", "is less than"),
        ("is-more", "is larger than"),
        ("is-more-than", "is larger than"),
        ("is-not-empty", "is not empty"),
        ("is-not-older", "is not older than"),
        ("is-not-older-than", "is not older than"),
        ("is-older", "is older than"),
        ("is-older-than", "is older than"),
        ("larger", "is larger than"),
        ("larger-equal", "is larger than or equal to"),
        ("larger-equal-than", "is larger than or equal to"),
        ("larger-than", "is larger than"),
        ("less", "is less than"),
        ("less-equal", "is less than or equal to"),
        ("less-equal-than", "is less than or equal to"),
        ("less-than", "is less than"),
        ("more", "is larger than"),
        ("more-than", "is larger than"),
        ("not-empty", "is not empty"),
        ("not-older", "is not older than"),
        ("not-older-than", "is not older than"),
        ("older", "is older than"),
        ("older-than", "is older than"),
    ],
)
def test_nice_representation_of_rules(operator, phrase):
    assert Rule("A", operator, "B").nice() == f"Property `A` {phrase} `B`"
