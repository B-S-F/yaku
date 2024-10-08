import pytest
from pandas import DataFrame
from yaku.excel_tools.utils.dataframe import add_column


@pytest.fixture
def test():
    return "test_dataframe"


def test_add_column():
    df = DataFrame({"a": [1, 2, 3]})
    df = add_column(df, "b", [4, 5, 6])
    assert df["b"].to_list() == [4, 5, 6]


def test_add_column_empty():
    df = DataFrame({"a": [1, 2, 3]})
    df = add_column(df, "b", [])
    assert df["b"].to_list() == ["", "", ""]


def test_add_column_to_empty():
    df = DataFrame()
    df = add_column(df, "b", [1, 2, 3])
    assert df["b"].to_list() == [1, 2, 3]


def test_add_column_overwrite():
    df = DataFrame({"a": [1, 2, 3]})
    df = add_column(df, "a", [4, 5, 6])
    assert df["a"].to_list() == [4, 5, 6]
