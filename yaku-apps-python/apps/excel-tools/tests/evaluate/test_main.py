import click
import pytest
from yaku.autopilot_utils.results import assert_result_status
from yaku.excel_tools.commands.evaluate.main import (
    _parse_string_as_excel_column_letter_list,
    _parse_string_as_list,
    _validate_excel_column_letter,
    print_evaluation_results,
)


def test_validate_excel_column_letter():
    # Test a valid column letter
    assert _validate_excel_column_letter(None, None, "A") == "A"

    # Test a valid column letter with multiple characters
    assert _validate_excel_column_letter(None, None, "AB") == "AB"

    # Test an invalid column letter with lowercase characters
    with pytest.raises(click.BadParameter):
        _validate_excel_column_letter(None, None, "a")

    # Test an invalid column letter with non-alphabetic characters
    with pytest.raises(click.BadParameter):
        _validate_excel_column_letter(None, None, "1")

    # Test an invalid column letter with mixed case characters
    with pytest.raises(click.BadParameter):
        _validate_excel_column_letter(None, None, "aBc")


def test_parse_string_as_list():
    # Test parsing a string with one value
    assert _parse_string_as_list(None, None, "value") == ["value"]

    # Test parsing a string with multiple values
    assert _parse_string_as_list(None, None, "value1, value2, value3") == [
        "value1",
        "value2",
        "value3",
    ]

    # Test parsing a string with whitespace
    assert _parse_string_as_list(None, None, " value1 , value2 , value3 ") == [
        "value1",
        "value2",
        "value3",
    ]

    # Test parsing an empty string
    assert _parse_string_as_list(None, None, "") == [""]

    # Test parsing a string with no values
    assert _parse_string_as_list(None, None, "  ,  ,  ") == ["", "", ""]

    # Test parsing a non-string value
    with pytest.raises(click.BadParameter):
        _parse_string_as_list(None, None, 123)  # type: ignore


def test_parse_string_as_excel_column_letter_list():
    # Test parsing a string with one value
    assert _parse_string_as_excel_column_letter_list(None, None, "A") == ["A"]

    # Test parsing a string with multiple values
    assert _parse_string_as_excel_column_letter_list(None, None, "A, BB, CCC") == [
        "A",
        "BB",
        "CCC",
    ]

    # Test parsing a string with whitespace
    assert _parse_string_as_excel_column_letter_list(None, None, " A , B , C ") == [
        "A",
        "B",
        "C",
    ]

    # Test parsing a non-string value
    with pytest.raises(click.BadParameter):
        _parse_string_as_excel_column_letter_list(None, None, "")  # type: ignore


@pytest.mark.parametrize(
    ("false_rows", "all_hyperlinks", "expected_reason", "expected_status"),
    [
        (
            {},
            True,
            "All rows of columns '\\['A', 'B', 'C'\\]' have only the allowed values '\\['value1', 'value2', 'value3'\\]' and all cells in the column 'D' are hyperlinks",
            "GREEN",
        ),
        (
            {},
            False,
            "All rows of columns '\\['A', 'B', 'C'\\]' have only the allowed values '\\['value1', 'value2', 'value3'\\]' but there is at least one hyperlink missing in the column 'D'",
            "YELLOW",
        ),
        (
            {1: ["value4"], 3: ["value7"]},
            None,
            "Found 2 rows where at least one value in the columns \\['A', 'B', 'C'\\] is not in \\['value1', 'value2', 'value3'\\]:\\n\\* 1: \\['value4'\\]\\n\\* 3: \\['value7'\\]",
            "RED",
        ),
        (
            {1: ["value4"], 3: ["value7"]},
            False,
            "Found 2 rows where at least one value in the columns \\['A', 'B', 'C'\\] is not in \\['value1', 'value2', 'value3'\\]:\\n\\* 1: \\['value4'\\]\\n\\* 3: \\['value7'\\]",
            "RED",
        ),
    ],
)
def test_print_evaluation_results(
    false_rows, all_hyperlinks, expected_reason, expected_status, capsys
):
    print_evaluation_results(
        false_rows, ["A", "B", "C"], ["value1", "value2", "value3"], "D", all_hyperlinks
    )
    captured = capsys.readouterr()
    assert_result_status(captured.out, expected_status=expected_status, reason=expected_reason)
