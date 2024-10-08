from ..utils.excel import column_letter_to_index


def print_cell_value_from_filtered_row(
    workbook,
    sheet_name: str,
    filter_column: str,
    filter_value: str,
    column: str,
    url: bool = False,
    return_all: bool = False,
    skip_rows: int = 0,
):
    search_column_index = column_letter_to_index(filter_column)
    column_index = column_letter_to_index(column)
    sheet = workbook[sheet_name]
    for row in sheet.iter_rows(min_row=skip_rows + 1, values_only=False):
        search_cell = row[search_column_index]
        data_cell = row[column_index]
        if search_cell.value == filter_value:
            if url:
                try:
                    print(data_cell.hyperlink.target)
                except AttributeError:
                    raise RuntimeError(
                        f"Cannot retrieve URL. Cell {column}{data_cell.row} has no hyperlink!"
                    )
            else:
                print(data_cell.value)
            if not return_all:
                return
