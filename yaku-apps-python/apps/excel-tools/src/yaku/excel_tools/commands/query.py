from loguru import logger
from openpyxl import Workbook
from pandas import DataFrame

from ..utils.excel import load_dataframes, write_dataframes
from ..utils.vendored.skimpy import clean_columns


def query(
    workbook: Workbook,
    expr: str,
    result_column: str,
    sheet_name=None,
    true_value="True",
    false_value="False",
):
    """
    Query the workbook with the given expression.

    All rows that match the expression will be marked in the result column with
    true_value, all others will be marked with fale_value.
    The result column will be added to the xlsx file.
    """
    dfs: dict[str, DataFrame] = load_dataframes(workbook, sheet_name)
    for sheet, df in dfs.items():
        df = clean_columns(df)
        logger.debug(f"Cleaned columns {df.columns}")
        try:
            matching_df = df.query(expr)
            df[result_column] = df.index.isin(matching_df.index)
            df[result_column] = df[result_column].replace(
                {True: true_value, False: false_value}
            )
            dfs[sheet] = df
        except Exception:
            logger.error("Error executing expression '{e}' on sheet '{s}'", e=expr, s=sheet)
    write_dataframes(workbook, dfs)
