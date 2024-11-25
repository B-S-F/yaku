<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Sharepoint Evaluator Background Information

The SharePoint evaluator is usually being used together with the `sharepoint-fetcher` in order to evaluate file properties of files stored on SharePoint sites.

## Environment variables

If you want to evaluate custom properties of your SharePoint documents, make sure to set
the {envvar}`SHAREPOINT_FETCHER_CUSTOM_PROPERTIES` variable to the same values as the
SharePoint fetcher was using.

For more details on this variable, see the {doc}`./sharepoint-fetcher-reference`.

```{envvar} SHAREPOINT_EVALUATOR_CONFIG_FILE
The rules for validating the downloaded files are defined in a separate config
file as there might be many files to be checked or many rules for some files.
This variable contains the path to the file. You can find more information on it right below.
```

## The evaluator's config file

The evaluator reads rules for validating SharePoint files from a config file
(given by {envvar}`SHAREPOINT_EVALUATOR_CONFIG_FILE`) and then looks for those files in
the evidence directory (given by the {envvar}`evidence_path` environment variable, which
is set by the QG main program) and validates the rules.

The config file should look like this:

```{literalinclude} resources/evaluator-config.yaml
---
language: yaml
---
```

```{attention}
The property names for the evaluator differ between on-premise and cloud SharePoint instances. Ensure that you use the correct name to accurately evaluate the fetched files. For our example, in the case of on-premise instances, the property name is `Modified`, but when evaluating files from cloud SharePoint, the name would be `lastModifiedDateTime`.
```

Each rule consists of a property to be checked and an operator. If you state
multiple rules for one file, they are all connected with a logical `AND`.

### File glob pattern

The `file` attribute contains a glob pattern[^1] for the file which is to be evaluated.

```{attention}
This means that `*`, `[`, and `?` are special characters. If you expect your file to have those characters in the filename, you need to escape them.

For example if the filename is {file}`[Template] Review Protocol.docx`, you need to
escape the first `[` by putting it into `[…]` brackets: `[[]Template] Review Protocol.docx`.
```

Often, it is sufficient to restrict the glob pattern to just the file extension.
For example when the previous step downloads a PDF file from SharePoint,
the glob pattern line could just be:

```yaml
- file: '*.pdf'
```

[^1]: See <https://en.wikipedia.org/wiki/Glob_(programming)#Syntax>

### Available operators

Valid examples for **operators** are:

- `equals: <number or string>` (also `equal` or `is-equal`)
- `larger: <number>` (also `[is-]larger[-than]`, `[is-]more[-than]`)
- `larger-equal: <number>` (also `[is-]larger-equal[-than]`)
- `less: <number>` (also `[is-]less[-than]`)
- `less-equal: <number>` (also `[is-]less-equal[-than]`)
- `empty: ""` (also `[is-][not-]empty`)
- `older: <date> or <period>` (also `[is-][not-]older[-than]`)
- `contains: <string>`
- ...

If there is an accompanying {file}`__custom_property_definitions__.yaml` file in the evidence
directory, which contains mappings from file property ids to their titles, those
mappings will be used to convert property values automatically to their titles.

For example, if the custom property definition file contains a property `Status` with
mappings `1=Draft`, `2=Ready`, you need to use the names instead of numbers
in your rule config:

```yaml
- property: Status
  is-equal: Ready # and not '2' !!!
```

If the custom property definition uses different names for file property name and list
name (e.g. `StatusId=>Status=>StatusList` given by {envvar}`SHAREPOINT_FETCHER_CUSTOM_PROPERTIES`),
you can use both for accessing either the numeric mapping value or the mapped
list title:

```yaml
- property: StatusId
  is-equal: 2
- property: Status
  is-equal: Ready
```

In case you want to use this property and need more details on it, see {doc}`../how-to/how-to-custom-props-get-names`.

## Example Config

You can find a complete example configuration here:

- for on-premise SharePoint: {doc}`../tutorials/sharepoint-fetcher-and-evaluator-on-premise`.

- for cloud SharePoint: {doc}`../tutorials/sharepoint-fetcher-and-evaluator-cloud`.
