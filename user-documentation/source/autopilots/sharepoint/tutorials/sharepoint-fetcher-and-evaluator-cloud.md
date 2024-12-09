<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Downloading and checking files from cloud instances

```{note}
In this tutorial, we are using the {envvar}`SHAREPOINT_FETCHER_PROJECT_URL` variable to specify the URL for the data we are going to fetch. Another way to achieve this is by setting the {envvar}`SHAREPOINT_FETCHER_PROJECT_SITE` and {envvar}`SHAREPOINT_FETCHER_PROJECT_PATH` variables. Although the {envvar}`SHAREPOINT_FETCHER_PROJECT_URL` takes precedence, both methods yield the same results, and it is up to you which method you choose. If you are familiar retrieving the URL directly from the SharePoint interface in the correct format, we recommend using the first approach. Otherwise, manually constructing the URL based on the project site and path might be the better solution for you. For more information, please refer to {doc}`../reference/sharepoint-fetcher-reference`.
```

```{note}
If you want a tutorial with example data for an on-premise instance of SharePoint please check {doc}`./sharepoint-fetcher-and-evaluator-on-premise`.
```

## Introduction

With the SharePoint fetcher and evaluator, you can fetch files from a SharePoint site that you have access to and subsequently evaluate them based on their SharePoint-related properties (last modified date, revision status, archiving period etc.).

### Use-case

For this example, we are using the following use case:

* The SharePoint fetcher downloads a specific file from cloud SharePoint and evaluates it based on its `lastModifiedDateTime` property.
* We want to verify that its last modification took place within the last 12 months.

This can for example be useful if you have a document like the state-of-the-art (SOTA) assessment for your project that you update once a year and you want to ensure that the content isn't outdated.

```{note}
The SharePoint config files in this example need to be adapted to your network environment
and your server locations. Please make sure to adapt the files accordingly.
```

## Preparation

### Download resources

Please go ahead and download the following files. They will be required in the subsequent steps.

* {download}`qg-config.yaml <resources/qg-config-cloud.yaml>`
* {download}`sharepoint-evaluator-config-file.yaml <resources/sharepoint-evaluator-config-file-cloud.yaml>`

## Adjusting the config files

### The qg-config.yaml

You need to set a few environment variables in the `qg-config.yaml`. Feel free
to have a look at the downloaded file first, to get an overview of it.
Subsequently we will go over the parts that you want to adjust step by step.

If you want to find out more about how you can configure the Registration App in
Azure Active Directory and how to get the credentials, please have a look at:
{doc}`../how-to/how-to-auth-cloud-sharepoint`.

```{literalinclude} resources/qg-config-cloud.yaml
---
language: yaml
lines: 12-14
lineno-match:
---
```

Lines 12-14 require credentials from the AAD Registration App: tenant id for the variable {envvar}`SHAREPOINT_FETCHER_TENANT_ID`, client id for the variable {envvar}`SHAREPOINT_FETCHER_CLIENT_ID` and client secret value for the variable {envvar}`SHAREPOINT_FETCHER_CLIENT_SECRET`. Open your Yaku UI and add them to the _Secrets_ to your namespace. If you need help with that, check out: {doc}`../../../core/secrets/how-to-add-secrets`.

```{literalinclude} resources/qg-config-cloud.yaml
---
language: yaml
lines: 15-16
lineno-match:
---
```

Please add the URL of the project site that you want to use in this example in line 15. For more information about how to retrieve the {envvar}`SHAREPOINT_FETCHER_PROJECT_URL` variable and what format it requires, please check {doc}`../how-to/how-to-share-url-cloud`. In line 16 you need to set the {envvar}`SHAREPOINT_FETCHER_IS_CLOUD` variable to "True" since we want to fetch data from a cloud SharePoint instance.

### The SharePoint evaluator config

Here, we're defining the rules for the evaluation of a specific file.

```{literalinclude} resources/sharepoint-evaluator-config-file-cloud.yaml
---
language: yaml
linenos:
---
```

In line 1, you need to provide the name of the file you want to evaluate, including its extension. If you want to evaluate multiple files, just copy and paste the same structure as in lines 1 to 4 below each other. You can then decide if you want to use the same, or a different set of rules for the specified file.

The evaluator uses properties of the downloaded files to evaluate a given condition. Here, we are using the `lastModifiedDateTime` property.

```{attention}
The property names for the evaluator differ between on-premise and cloud SharePoint instances. Ensure that you use the correct name to accurately evaluate the fetched files.
```

Line 4 contains the condition that has to be met for the `lastModifiedDateTime` property. In this case, it checks whether the document has been modified within the last 12 months or not. The result is `GREEN` in case the check passes and `RED` if it does not.

## Running the example

Now, you can run the example. Upload the {file}`sharepoint-evaluator-config-file.yaml`, using the same name as stated in the {envvar}`SHAREPOINT_EVALUATOR_CONFIG_FILE` variable (line 17 in the {file}`qg-config.yaml`) as well as the `qg-config.yaml`.
