from pathlib import Path

import dateutil.parser as dt_parser
import pytest
from yaku.autopilot_utils.checks import convert_to_seconds
from yaku.pdf_signature_evaluator.config import ConfigFile
from yaku.pdf_signature_evaluator.rules import Rule, read_file_rules


def test_read_not_existing_file_raise_exception():
    config_file_path = "sharepoint-evaluator-rules.yaml"

    with pytest.raises(ValueError):
        ConfigFile(file_path=str(config_file_path))


def test_read_file_rules_wrong_configuration(tmp_path: Path):
    config_file_path = tmp_path / "sharepoint-evaluator-rules.yaml"
    config_file_path.write_text(
        """
        "test_3_signers.pdf":
            signature_not_older_than: ""
    """
    )
    config_file = ConfigFile(file_path=str(config_file_path))
    file_rules = read_file_rules(config_file.content)

    assert not file_rules


def test_read_file_rules_correct_configuration_iso_time(tmp_path: Path):
    config_file_path = tmp_path / "signature-date.yaml"
    config_file_path.write_text(
        """
        "test_3_signers.pdf":
            operator: "one-of"
            signature_not_older_than: "2024-01-01T00:00:00Z"

    """
    )
    config_file = ConfigFile(file_path=str(config_file_path))
    file_rules = read_file_rules(config_file.content)
    iso_time = str(file_rules[0].rules[0].other_value)
    dt = dt_parser.isoparse(iso_time)

    assert len(file_rules) == 1
    assert len(file_rules[0].rules) == 1
    assert file_rules[0].file == "test_3_signers.pdf"
    assert file_rules[0].rules[0] == Rule(
        property="one-of",
        operator="not-older-than",
        other_value="2024-01-01T00:00:00Z",
    )
    assert dt.year == 2024 and dt.month == 1 and dt.day == 1


def test_read_file_rules_correct_configuration(tmp_path: Path):
    config_file_path = tmp_path / "signature-date.yaml"
    config_file_path.write_text(
        """
        test_3_signers.pdf:
            signature_not_older_than: "1y"

    """
    )
    config_file = ConfigFile(file_path=str(config_file_path))
    file_rules = read_file_rules(config_file.content)
    interval = str(file_rules[0].rules[0].other_value)

    convert_to_seconds(interval)
    assert len(file_rules) == 1
    assert len(file_rules[0].rules) == 1
    assert file_rules[0].file == "test_3_signers.pdf"
    assert file_rules[0].rules[0] == Rule(
        property="all-of",
        operator="not-older-than",
        other_value="1y",
    )
