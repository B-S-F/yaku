from pathlib import Path

import pandas as pd
import pytest
from yaku.autopilot_utils.results import assert_result_status
from yaku.excel_tools.commands.evaluate.check_columns import (
    check_columns,
    check_df_columns,
)
from yaku.excel_tools.commands.evaluate.main import print_evaluation_results


@pytest.fixture
def sample_df():
    #         A       B       C       D     E
    # 0  value1  value2  value1  value3  foo1
    # 1  value3  value3  value1  value3  foo2
    # 2  value1  value3  value1  value3  foo3
    # 3  value2  value2  value2  value1  foo4
    return pd.DataFrame(
        {
            "A": ["value1", "value3", "value1", "value2"],
            "B": ["value2", "value3", "value3", "value2"],
            "C": ["value1", "value1", "value1", "value2"],
            "D": ["value3", "value3", "value3", "value1"],
            "E": ["foo1", "foo2", "foo3", "foo4"],
        }
    )


@pytest.fixture
def sample_xls_file(sample_df: pd.DataFrame, tmp_path: Path) -> Path:
    xls_file = tmp_path / "demo.xlsx"
    sample_df.to_excel(xls_file, sheet_name="Sheet1", header=True, index=False)
    return xls_file


@pytest.mark.parametrize(
    ("icolumns", "iref_column", "allowed_values", "expected_output"),
    [
        # only column A
        ([0], 4, ["value1", "value2"], pd.Series(["foo2"], index=[1])),
        ([0], 4, ["value1", "value3"], pd.Series(["foo4"], index=[3])),
        # only column B
        ([1], 4, ["value1", "value2"], pd.Series(["foo2", "foo3"], index=[1, 2])),
        ([1], 4, ["value1", "value3"], pd.Series(["foo1", "foo4"], index=[0, 3])),
        # multiple columns
        ([0, 1, 2], 4, ["value1", "value2"], pd.Series(["foo2", "foo3"], index=[1, 2])),
        ([0, 1, 2], 4, ["Value1", "Value2"], pd.Series(["foo2", "foo3"], index=[1, 2])),
    ],
)
def test_check_df_columns(sample_df, iref_column, icolumns, allowed_values, expected_output):
    assert check_df_columns(sample_df, icolumns, iref_column, allowed_values).equals(
        expected_output
    )


@pytest.mark.parametrize(
    ("columns", "ref_column", "allowed_values", "expected_output"),
    [
        # only column A
        (["A"], "E", ["value1", "value2"], pd.Series(["foo2"], index=[1])),
        (["A"], "E", ["value1", "value3"], pd.Series(["foo4"], index=[3])),
        # only column B
        (["B"], "E", ["value1", "value2"], pd.Series(["foo2", "foo3"], index=[1, 2])),
        (["B"], "E", ["value1", "value3"], pd.Series(["foo1", "foo4"], index=[0, 3])),
        # multiple columns
        (
            ["A", "B", "C"],
            "E",
            ["value1", "value2"],
            pd.Series(["foo2", "foo3"], index=[1, 2]),
        ),
        (
            ["A", "B", "C"],
            "E",
            ["Value1", "Value2"],
            pd.Series(["foo2", "foo3"], index=[1, 2]),
        ),
    ],
)
def test_check_columns_case_insensitive(
    sample_xls_file, columns, ref_column, allowed_values, expected_output
):
    # Test a case where all rows have only allowed values
    result = check_columns(
        sample_xls_file,
        sheet_name="Sheet1",
        columns=columns,
        header_row=0,
        ref_column=ref_column,
        allowed_values=allowed_values,
    )
    result[0].equals(expected_output)


@pytest.fixture(
    params=[
        # ("table_with_hyperlinks.xls",),
        "table_with_hyperlinks.xlsx",
    ]
)
def sample_xls_file_with_hyperlinks(request, tmp_path: Path):
    xlsfile = request.param
    xl = (Path(__file__).parent) / "data" / xlsfile
    new_xlsfile = tmp_path / xl.name
    new_xlsfile.write_bytes(xl.read_bytes())
    return new_xlsfile


def test_hyperlink_results(sample_xls_file_with_hyperlinks: Path, capsys):
    columns = ["A"]
    allowed_values = ["Anton"]
    ref_column = "C"
    (false_rows, all_hyperlinks) = check_columns(
        sample_xls_file_with_hyperlinks,
        columns=columns,
        allowed_values=allowed_values,
        sheet_name="Tabelle1",
        ref_column=ref_column,
        header_row=0,
    )
    print_evaluation_results(false_rows, columns, allowed_values, ref_column, all_hyperlinks)
    captured = capsys.readouterr()
    assert_result_status(
        captured.out,
        "RED",
        reason=(
            "Found 2 rows where at least one value in the columns \\['A'\\] "
            "is not in \\['Anton'\\]:\n"
            "\\* 0: https://en.wikipedia.org/wiki/Catbird\n"
            "\\* 2: https://en.wikipedia.org/wiki/Crow$"
        ),
    )


def test_normal_results(sample_xls_file_with_hyperlinks: Path, capsys):
    columns = ["A"]
    allowed_values = ["Anton"]
    ref_column = "A"
    (false_rows, all_hyperlinks) = check_columns(
        sample_xls_file_with_hyperlinks,
        columns=columns,
        allowed_values=allowed_values,
        sheet_name="Tabelle1",
        ref_column=ref_column,
        header_row=0,
    )
    print_evaluation_results(false_rows, columns, allowed_values, ref_column, all_hyperlinks)
    captured = capsys.readouterr()
    assert_result_status(
        captured.out,
        "RED",
        reason=(
            "Found 2 rows where at least one value in the columns \\['A'\\] "
            "is not in \\['Anton'\\]:\n"
            "\\* 0: Amir\\n"
            "\\* 2: Aslan$"
        ),
    )
