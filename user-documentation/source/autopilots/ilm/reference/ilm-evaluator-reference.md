<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Evaluator Background Information

An evaluator which returns the WorkOn status ('GREEN - Approved', 'RED - Rejected or Inexistent') for a SharePoint file. It also returns the workflow requestor and approvers.

## Prerequisites

Provide as input a properties file or manually create the input file.

If you choose to provide a properties file: You can obtain it by running the SharePoint Fetcher and copying the properties file corresponding to your target file. It shall have the format:
{file}`<<target_file_name>>.__properties__.json`

If you choose to manually create it: Copy the two-line json below, replacing the placeholder values. In this case, you can save the input file as a classic {file}`.json` (does not necessarily need to containe {file}`.__properties__` before {file}`.json`)

```sh
{
    "ServerRedirectedEmbedUri": "<<your_sharepoint_site>>/_layouts",
    "OData__dlc_DocId": "<<shor_id_of_target_file>>"
}
```

A concrete example looks like this:

```sh
{
    "ServerRedirectedEmbedUri": "https://sites.sharepoint.mycompany.com/sites/123456/_layouts",
    "OData__dlc_DocId": "P13S134287-690374571-6812"
}
```

## Environment variables

```{envvar} ILM_USERNAME
The username used to connect to the ILM service. This is usually your Windows username.
```

```{envvar} ILM_PASSWORD
The password used to connect to the ILM service. This is usually your Windows password.
```

```{envvar} PROPERTIES_FILE_PATH
The path where the properties file is located (the one described in the Prerequisites section)
```

## Example Output

The ILM Evaluator will usually return one of the three most common results. These are:

1) Successful run. Returns the list of approvers and the requestor. For each approver, it also returns the date when the approval was granted.

   > "status": "GREEN",
   > "reason": "Workflow exists and has been approved by: GROW User 1 (GROW/PAT) (8/24/2023), GROW User 2 (GROW/PAT) (8/23/2023). Workflow has been requested by GROW User 3 (GROW/PAT)"

2) WorkOn exists but it is not approved. Returns the error message corresponding to this use case.

   > "status":"RED",
   > "reason":"Workflow is not approved"

3) WorkOn does not exist for target file. Returns the error message corresponding to this use case.

   > "status":"RED",
   > "reason":"No workflow exists."

## Example config

Below is an example configuration file that runs the ILM Evaluator. The autopilot is configured in lines: 7-13. Required variables and secrets are read from provided run variables or secrets. Then the autopilot is used by the check 1 in line 25 which is part of requirement 1.15

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-13, 25
---
```
