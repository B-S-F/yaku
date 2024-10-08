import json
import re
import sys
from pathlib import Path

import click
import pandas as pd

from .check_columns import check_columns as check_columns_command


def _validate_excel_column_letter(_, __, value: str) -> str:
    """Validate that the value is a valid excel column letter."""
    if not re.match(r"^[A-Z]+$", value):
        raise click.BadParameter("value must be a valid excel column letter")
    return value


def _parse_string_as_list(_, __, value: str) -> list[str]:
    """Parse a string as a list of strings."""
    if isinstance(value, list):
        return value
    try:
        return [s.strip() for s in value.split(",")]
    except AttributeError:
        raise click.BadParameter("value must be comma separated list of strings")


def _parse_string_as_excel_column_letter_list(_, __, value: str) -> list[str]:
    """Validate that the value is a valid excel column letter."""
    column_list = _parse_string_as_list(_, __, value)
    for column in column_list:
        _validate_excel_column_letter(_, __, column)
    return column_list


def print_evaluation_results(
    false_rows: pd.Series,
    columns: list[str],
    allowed_values: list[str],
    ref_column: str,
    all_hyperlinks: bool | None,
):
    """Print the results of the evaluation."""
    criterion_values = (
        f"All rows of columns '{columns}' have only the allowed values '{allowed_values}'."
    )
    criterion_hyperlinks = f"All cells in column '{ref_column}' have a hyperlink."
    if len(false_rows) == 0:
        click.echo(
            json.dumps(
                {
                    "result": {
                        "criterion": criterion_values,
                        "fulfilled": True,
                        "reason": "No disallowed values.",
                    }
                }
            )
        )
        reason = (
            f"All rows of columns '{columns}' "
            f"have only the allowed values '{allowed_values}'"
        )
        if all_hyperlinks is not None and not all_hyperlinks:
            reason += (
                f" but there is at least one hyperlink missing in the column '{ref_column}'"
            )
            click.echo(json.dumps({"status": "YELLOW"}))
            click.echo(
                json.dumps(
                    {
                        "result": {
                            "criterion": criterion_hyperlinks,
                            "fulfilled": False,
                            "reason": f"There is at least one hyperlink missing in column '{ref_column}'.",
                        }
                    }
                )
            )
        else:
            reason += f" and all cells in the column '{ref_column}' are hyperlinks"
            click.echo(
                json.dumps(
                    {
                        "result": {
                            "criterion": criterion_hyperlinks,
                            "fulfilled": True,
                            "reason": f"All cells in column '{ref_column}' have hyperlinks.",
                        }
                    }
                )
            )
            click.echo(json.dumps({"status": "GREEN"}))
        click.echo(json.dumps({"reason": reason}))
    else:
        false_rows_list = []
        for i, v in false_rows.items():
            try:
                false_rows_list.append(f"* {i}: {v.target}")
            except AttributeError:
                false_rows_list.append(f"* {i}: {v}")
        false_rows_str = "\n".join(false_rows_list)
        reason = (
            f"Found {len(false_rows_list)} rows where at least one value "
            f"in the columns {columns} is not in {allowed_values}:\n"
            f"{false_rows_str}"
        )
        click.echo(json.dumps({"status": "RED"}))
        click.echo(json.dumps({"reason": reason}))


@click.command()
@click.argument(
    "excel_path",
    required=True,
    type=click.Path(exists=True, path_type=Path),
)
@click.option(
    "--columns",
    "-c",
    help="The columns to check as comma separated list of excel column letters",
    required=True,
    callback=_parse_string_as_excel_column_letter_list,
)
@click.option(
    "--allowed_values",
    "-a",
    help="The value to set when the query is false",
    required=True,
    callback=_parse_string_as_list,
)
@click.option(
    "--sheet-name",
    help="The name of the sheet to format, if not provided will format all sheets",
    default="0",
    callback=lambda _, __, x: int(x) if x.isdigit() else x,
)
@click.option(
    "--ref-column",
    default="A",
    help="The column to use as reference as excel column letter",
    callback=_validate_excel_column_letter,
)
@click.option(
    "--header-row",
    default=0,
    help="The row to use as header (0-based)",
)
def check_columns(
    excel_path: Path,
    columns: list[str],
    allowed_values: list[str],
    sheet_name: str | int,
    ref_column: str,
    header_row: int,
):
    try:
        (false_rows, all_hyperlinks) = check_columns_command(
            excel_path, columns, allowed_values, sheet_name, ref_column, header_row
        )
        print_evaluation_results(
            false_rows, columns, allowed_values, ref_column, all_hyperlinks
        )
    except Exception as e:
        click.echo(json.dumps({"status": "FAILED"}))
        click.echo(json.dumps({"reason": str(e)}))
        sys.exit(1)
