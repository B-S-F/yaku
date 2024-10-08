import pytest
from openpyxl import Workbook
from yaku.excel_tools.commands.format import check_column_limit, format


@pytest.fixture
def test():
    return "test_format"


@pytest.mark.parametrize(
    ("column", "expected"),
    [("A", True), ("AA", True), ("AAA", True), ("XFD", True), ("XFE", False), ("ZZZ", False)],
)
def test_check_column_limit(column, expected):
    got = check_column_limit(column)
    assert (got) == expected


@pytest.mark.parametrize("column", ["A", "AA", "AAA", "ZZ", "XFD"])
def test_format(column):
    wb = Workbook()
    sheet = wb["Sheet"]
    cell1 = f"{column}1"
    cell3 = f"{column}3"
    sheet[cell1] = "Key"
    initial_width = sheet.column_dimensions[column].width
    sheet[cell3] = "I am a longer string than the initial width"
    format(wb, column, 3)
    second_width = sheet.column_dimensions[column].width
    assert second_width > initial_width
    cell = sheet[cell3]
    assert cell.alignment.wrap_text is True
    assert cell.alignment.vertical == "top"


@pytest.mark.parametrize("column", ["XFE", "ZZZ", "ZZZTOP"])
def test_format_out_of_bounds(column):
    wb = Workbook()
    with pytest.raises(ValueError, match=f"Maximum column is 'XFD' but column was {column}"):
        format(wb, column, 3)
