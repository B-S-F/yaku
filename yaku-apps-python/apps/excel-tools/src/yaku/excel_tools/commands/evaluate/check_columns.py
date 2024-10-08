from pathlib import Path

import pandas as pd

from ...utils.excel import column_letter_to_index, parse_excel_with_hyperlinks
from ...utils.vendored.skimpy import clean_columns


def check_columns(
    excel_path: Path,
    columns: list[str],
    allowed_values: list[str],
    sheet_name: str | int,
    ref_column: str,
    header_row: int,
) -> tuple[pd.Series, bool | None]:
    """Check whether the values in the specified columns of an Excel file are in a list of allowed values."""
    column_inds = [column_letter_to_index(column) for column in columns]
    ref_column_ind = column_letter_to_index(ref_column)
    (df, all_hyperlinks) = parse_excel_with_hyperlinks(
        excel_path, sheet_name, [ref_column_ind], header_row
    )
    df = clean_columns(df)
    return (check_df_columns(df, column_inds, ref_column_ind, allowed_values), all_hyperlinks)


def check_df_columns(
    df: pd.DataFrame, icolumns: list[int], iref_column: int, allowed_values: list[str]
) -> pd.Series:
    """Check whether the values in the specified columns of a pandas DataFrame are in a list of allowed values."""
    column_names = [df.columns[i] for i in icolumns]
    ref_column_name = df.columns[iref_column]
    mask = df[column_names].apply(
        lambda x: x.str.lower().isin(
            [allowed_value.lower() for allowed_value in allowed_values]
        )
    )
    row_mask = mask.all(axis=1)
    false_rows = df[~row_mask][ref_column_name]
    return false_rows
