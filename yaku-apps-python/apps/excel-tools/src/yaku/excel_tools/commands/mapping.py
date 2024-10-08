from openpyxl import Workbook
from pandas import DataFrame

from ..utils.dataframe import add_column
from ..utils.excel import (
    get_list,
    get_mapping,
    load_dataframes,
    map_values,
    write_dataframes,
)


def add_mapped_column(df: DataFrame, mapping: dict[str, str], column_name: str) -> DataFrame:
    """Add a column to the dataframe with the mapped values."""
    if df.empty:
        return df
    key_column: list[str] = df.iloc[:, 0].to_list()
    values = map_values(key_column, mapping)
    df = add_column(df, column_name, values)
    return df


def add_mapped_columns(workbook: Workbook, mapping: dict[str, str], column_name: str):
    """Add a column to each sheet in the workbook with the mapped values."""
    dataframes = load_dataframes(workbook)
    for sheet in workbook.worksheets:
        if sheet.title not in dataframes:
            continue
        df = dataframes[sheet.title]
        df = add_mapped_column(df, mapping, column_name)
        dataframes[sheet.title] = df
    write_dataframes(workbook, dataframes)


def apply_mapping(workbook: Workbook, mapping: dict[str, str], column_name: str):
    """Add a column to each sheet in the workbook with the mapped values."""
    add_mapped_columns(workbook, mapping, column_name)


def add_list_column(
    df: DataFrame,
    keys: list[str],
    column_name: str,
    check_column_names: list[str],
    true_value: str,
    false_value: str,
) -> DataFrame:
    """
    Add a column to the dataframe.

    If one of the keys is in the row, the value will be true_value, otherwise false_value.
    check_column_names is a list of column names to check for the keys.
    If the column does not exist in the dataframe, it will be ignored.
    check_column_names can also contain Excel column indexes (e.g. "A", "B", "C", etc.).
    """
    if df.empty:
        return df
    check_column_indexes = []
    for check_column_name in check_column_names:
        if check_column_name in df.columns:
            check_column_indexes.append(df.columns.get_loc(check_column_name))
        elif (
            check_column_name.isalpha()
            and check_column_name.isupper()
            and len(check_column_name) == 1
        ):
            check_column_indexes.append(ord(check_column_name) - ord("A"))
    values = []
    for row_index in range(len(df)):
        row = df.iloc[row_index]
        for check_column_index in check_column_indexes:
            if row.iloc[check_column_index] in keys:
                values.append(true_value)
                break
        else:
            values.append(false_value)
    df = add_column(df, column_name, values)
    return df


def add_list_columns(
    workbook: Workbook,
    keys: list[str],
    column_name: str,
    check_column_names: list[str],
    true_value: str,
    false_value: str,
):
    """Add a column to each sheet in the workbook. If one of the keys is in the row, the value will be true_value, otherwise false_value."""
    dataframes = load_dataframes(workbook)
    for sheet in workbook.worksheets:
        if sheet.title not in dataframes:
            continue
        df = dataframes[sheet.title]
        df = add_list_column(
            df, keys, column_name, check_column_names, true_value, false_value
        )
        dataframes[sheet.title] = df
    write_dataframes(workbook, dataframes)


def apply_list(
    workbook: Workbook,
    keys: list[str],
    column_name: str,
    check_column_names: list[str],
    true_value: str = "Yes",
    false_value: str = "No",
):
    """Add a column to each sheet in the workbook. If one of the keys is in the row, the value will be true_value, otherwise false_value."""
    add_list_columns(workbook, keys, column_name, check_column_names, true_value, false_value)


def get(
    workbook: Workbook, sheet_name: str, key_column: str, value_column: str
) -> dict[str, str]:
    """Return a dictionary with the mapping of the key_column to the value_column."""
    if sheet_name not in workbook.sheetnames:
        raise Exception(f"Sheet {sheet_name} not found in workbook")
    sheet = workbook[sheet_name]
    return get_mapping(sheet, key_column, value_column)


def get_column(workbook: Workbook, sheet_name: str, key_column: str) -> list[str]:
    """Return a list of keys from the key_column."""
    if sheet_name not in workbook.sheetnames:
        raise Exception(f"Sheet {sheet_name} not found in workbook")
    sheet = workbook[sheet_name]
    return get_list(sheet, key_column)
