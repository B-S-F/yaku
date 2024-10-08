import pandas as pd


def add_column(df: pd.DataFrame, column_name: str, column_values: list) -> pd.DataFrame:
    """Add a column to the dataframe, if the column already exists, it is overwritten."""
    if len(column_values) != len(df):
        column_values = column_values + [""] * (len(df) - len(column_values))
    df[column_name] = column_values
    return df
