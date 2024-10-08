# Excel tools

An app that provides a set of tools for working with Excel files.

## Usage

```bash
Usage: excel-tools [OPTIONS] COMMAND [ARGS]...

Options:
  --version  Output version information and exit
  --help     Show this message and exit.

Commands:
  add-column
  add-empty-column
  add-mapping
  aggregate
  evaluate
  format-header
  get-row           Filters rows by values of a column and return data...
  query
```

## Examples

```bash
# aggregate all .txt files (csvs) in the csvs folder into a single excel file
excel-tools aggregate --csv-path ./csvs --glob-pattern "*.txt" --output-path aggregate.xlsx
```

```bash
# create a mapping column in the aggregate.xlsx file based on the mapping.xlsx that uses the values from the <value-column>
excel-tools add-mapping --xlsx-path aggregate.xlsx --mapping-path other.xlsx --sheet-name "Sheet1" --key-column "A" --value-column "B" --mapping-column-name "col" 
```

or

```bash
# create a mapping column in the aggregate.xlsx file based on the mapping.xlsx file that uses custom values (yes/no)
excel-tools add-mapping --xlsx-path aggregate.xlsx --mapping-path other.xlsx --sheet-name "Sheet1" --key-column "A" --mapping-column-name "col" --true-value yes --false-value no
```

```bash
# query the output.xlsx file and add a new column with the result of the query
excel-tools query aggregate.xlsx "field_a == 'no' or field_b == 0 and field_c != 0 and outlink_to_not_agreed_req_agreed == 0" result --true-value no --false-value yes
```

```bash
# add a new column to the aggregate.xlsx file
excel-tools add-column aggregate.xlsx "new_column_name"
```

```bash
# format the header of the aggregate.xlsx file
excel-tools format-header aggregate.xlsx --column A --row 1
```
