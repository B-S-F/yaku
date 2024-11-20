<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Fetcher Background information

Work items are fetched from Azure Devops via the Work Item Tracking API. It can be configured by a [configuration file](#the-fetchers-config-file) that contains a Wiql (WorkItems Query Language) query and other filtering criteria.

## Environment variables

```{envvar} ADO_API_ORG
It defines the Azure Devops organization name to fetch data from.
```

```{envvar} ADO_API_PROJECT
It defines the Azure Devops Project name within the given organization to fetch data from.
```

```{envvar} ADO_API_PERSONAL_ACCESS_TOKEN
To be able to fetch work items from the DevOps organization, you require a personal access token with sufficient permissions. To generate a new personal access token, click on the "User settings" icon in the top right corner of Azure Devops, select "Personal access tokens", then select "New Token". Give the token `Read, write & manage` access to work items of the project.
```

```{envvar} ADO_APPLY_PROXY_SETTINGS
(Optional) Should be set to true if you are the fetcher behind a proxy.
```

```{envvar} ADO_WORK_ITEMS_JSON_NAME
(Optional) It defines the name of the file where the fetcher response will be stored in. The location of this file is set according to the {envvar}`evidence_path` environment variable. If you don't provide this variable, the file will be called `workItems.json` by default. This variable is also being used by the ado work items evaluator.
```

```{envvar} ADO_CONFIG_FILE_PATH
It is the path to the fetcher's  and evaluator's config file. More details about the config file can be found right below.
```

## The fetcher's config file

The definition of which work items are to be fetched, is given by a yaml file.
The location of this file is then referenced by the {envvar}`ADO_CONFIG_FILE_PATH` environment variable.

```{note}
This config files is used to configure the Azure work items fetcher and evaluator. For having a better understanding of the config, check out: {doc}`ado-evaluator-reference`.
```

This config file should have the following structure:

```{literalinclude} resources/fetcher-config.yaml
---
language: yaml
---
```

The value of the _"query"_ field is what the fetcher will send inside the request in order to filter the data.
To learn more about WIQL syntax, please see the [official docs](https://docs.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax?view=azure-devops).

```{note}
As stated in the official docs, it's not taken into account which fields are requested by using the `SELECT` statement. No matter which fields are included, the API returns only work item IDs. Therefore, we have to send new requests for getting the full information, which is then filtered based on the `neededFields` property.
```

Each element of the _"neededFields"_ list has to be specified by it's [reference name or by it's friendly name](https://docs.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax?view=azure-devops#limits-on-wiql-length).

**Example:** _"friendly name"_: `TargetDate`, _"reference name"_: `Microsoft.VSTS.Scheduling.TargetDate`

By default, the result will contain the Id, Url, State and Title.

## Example Output

The ado work items fetcher creates a file in the evidence path called `workItems.json` (if you didn't specify a different name in the {envvar}`ADO_WORK_ITEMS_JSON_NAME`). It has the following structure and contains all of the fetched work items:

```{literalinclude} resources/workItems.json
---
language: json
---
```

## Example config

You can find a complete example configuration in {doc}`../tutorials/ado-fetcher-evaluator-tutorial`.
