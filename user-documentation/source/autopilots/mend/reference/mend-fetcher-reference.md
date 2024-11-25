<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Mend Fetcher Background Information

The Mend autopilot will fetch reports from the Mend's Software Composition Analysis(SCA) scans to answer your requirements checks.

Currently supported are alerts and vulnerability reports. The results will be saved to the evidence folder under the {file}`results.json` name.

## Prerequisites

Make sure you have a Mend account with access to Mend's [Portal][MEND_PORTAL_EU].

## Environment variables

```{envvar} MEND_API_URL
Mend's API Base URL. Version v2.0 is currently supported. Can be found on the {guilabel}`Integrate` tab, under the {guilabel}`Organization` section.
```

```{envvar} MEND_SERVER_URL
Mend's Server URL. Can be found on the {guilabel}`Integrate` tab, under the {guilabel}`Organization` section.
```

```{envvar} MEND_USER_EMAIL
User email associated with the Mend account. Can be found on the {guilabel}`Profile` page, under the {guilabel}`Identity` section. Or as admin by going on the {guilabel}`Admin` page, select the {guilabel}`Users` from the {guilabel}`System` section.
```

```{envvar} MEND_USER_KEY
User secret associated with the Mend account. Can be found on the {guilabel}`Profile` page, under the {guilabel}`User Keys` section. Or as admin by going on the {guilabel}`Admin` page, select the {guilabel}`Users` from the {guilabel}`System` section.
```

```{envvar} MEND_ORG_TOKEN
The Organization token. Can be found on the {guilabel}`Integrate` tab, under the {guilabel}`Organization` section, named `API Key`. If you're part of multiple organizations, make sure that in the top-left corner the desired organization is selected.
```

```{envvar} MEND_PROJECT_TOKEN
The Project's token for which the reports are fetched for. Can be found on the {guilabel}`Integrate` tab, under the {guilabel}`Project Tokens` section, in the `Token` column next to the project's name.
```

```{envvar} MEND_PROJECT_ID
The Project's ID on the Mend's Portal. Can be found as `id` parameter in the Project's URL address. e.g.`https://app-eu.whitesourcesoftware.com/Wss/WSS.html#!project;id=<project-ID>;orgToken=<org-uuid>`. It is assumed that the user will always input a valid `id`, as no validation is carried out.
```

```{envvar} MEND_REPORT_TYPE
The report type to be fetched. Supported values are `alerts` and `vulnerabilities`. If not set, the fetcher will fetch the `vulnerabilities` report by default.
```

```{envvar} MEND_ALERTS_STATUS
Status of the fetched alerts. Supported values are `all`, `active`, `ignored`, `library_removed`, `library_in_house` and `library_whitelist`. By default `active` alerts will be fetched.
```

```{envvar} MEND_MIN_CONNECTION_TIME
The time in milliseconds between requests for fetching the vulnerabilities. It is used for controlling the fetcher to stay under Mend's API requests limits. By default value `50` is used.
```

```{envvar} MEND_MAX_CONCURRENT_CONNECTIONS
The number of concurrent requests for fetching the vulnerabilities.  It is used for controlling the fetcher to stay under Mend's API requests limits. By default the value `50` is used.
```

```{envvar} MEND_RESULTS_PATH
The path were the {file}`results.json` will be stored. By default {file}`results.json` will be stored in current working director, `./`.
```

## Fetching Multiple Projects

To retrieve data for multiple projects, specify multiple pairs of {envvar}`MEND_PROJECT_TOKEN`'s and, optionally, {envvar}`MEND_PROJECT_ID`'s separated by commas `,`. Each {envvar}`MEND_PROJECT_ID` is associated with its respective {envvar}`MEND_PROJECT_TOKEN`. The order of appearance matters: the first {envvar}`MEND_PROJECT_ID` should correspond to the first {envvar}`MEND_PROJECT_TOKEN`, the second to the second, and so on. Ensure that the number of {envvar}`MEND_PROJECT_ID`'s matches the number of {envvar}`MEND_PROJECT_TOKEN`'s provided, either by specifying a {envvar}`MEND_PROJECT_ID` or leaving it empty (as it is an optional parameter) by placing a comma `,`.

For example, lets assume that we have three projects, with the following {envvar}`MEND_PROJECT_TOKEN` configuration:

```yaml
env:
   ...
   MEND_PROJECT_TOKEN: MEND_PROJECT_TOKEN_1,MEND_PROJECT_TOKEN_2,MEND_PROJECT_TOKEN_3
   ...
```

- Valid {envvar}`MEND_PROJECT_ID` configurations for fetching data from the three projects are:

1. `MEND_PROJECT_ID: MEND_PROJECT_ID_1,MEND_PROJECT_ID_2,MEND_PROJECT_ID_3`\
Will set the project ID's for all three projects.
2. `MEND_PROJECT_ID: MEND_PROJECT_ID_1,MEND_PROJECT_ID_2,`\
Will set the project ID's for the first two projects but not for the last one (empty project ID after comma).
3. `MEND_PROJECT_ID: MEND_PROJECT_ID_1,,MEND_PROJECT_ID_3`\
Will set the project ID's for the first and last project but not for the second one (empty project ID between the two commas).
4. `MEND_PROJECT_ID: MEND_PROJECT_ID_1,,`\
Will set the project ID for the first project but not for the second and third one (empty project ID's between and after commas).

- However, the following configurations are invalid:

1. `MEND_PROJECT_ID: MEND_PROJECT_ID_1,MEND_PROJECT_TOKEN_2`\
There are only two project ID's separated by a comma (no trailing comma for third project ID), as the list of tokens has three items.

2. `MEND_PROJECT_ID: MEND_PROJECT_ID_1`\
There is only one project ID (no commas for the other two project ID's), as the list of tokens has three items.

```{note}
Please note that no validation is performed on the provided {envvar}`MEND_PROJECT_ID`s. It is assumed that users will input valid Project IDs when specifying the environment variable.
```

[MEND_PORTAL_EU]: https://app-eu.whitesourcesoftware.com/Wss/WSS.html
