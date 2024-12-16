<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Downloading and checking files from on-premise instances

```{note}
This tutorial was created with example data for a certain on-premise instance of SharePoint.
If you want to set up the SharePoint fetcher for your own on-premise instance of SharePoint,
make sure to adapt the config values like IP addresses and URLs accordingly.
```

```{note}
In this tutorial, we are using the {envvar}`SHAREPOINT_FETCHER_PROJECT_URL` variable to specify the URL for the data we are going to fetch. Another way to achieve this is by setting the {envvar}`SHAREPOINT_FETCHER_PROJECT_SITE` and {envvar}`SHAREPOINT_FETCHER_PROJECT_PATH` variables. Although the {envvar}`SHAREPOINT_FETCHER_PROJECT_URL` takes precedence, both methods yield the same results, and it is up to you which method you choose. If you are familiar retrieving the URL directly from the SharePoint interface in the correct format, we recommend using the first approach. Otherwise, manually constructing the URL based on the project site and path might be the better solution for you. For more information, please refer to {doc}`../reference/sharepoint-fetcher-reference`.
```

```{note}
If you want a tutorial with example data for a cloud instance of SharePoint please check {doc}`./sharepoint-fetcher-and-evaluator-cloud`.
```

## Introduction

With the Sharepoint fetcher and evaluator, you can fetch files from a SharePoint site that you have access to and subsequently evaluate them based on their SharePoint-related properties (last modified date, revision status, archiving period etc.).

### Use-case

For this example, we are using the following use case:

* The SharePoint fetcher downloads a specific file from SharePoint and evaluates it based on its `Modified` property.
* We want to verify that its last modification took place within the last 12 months.

This can for example be useful if you have a document like the state-of-the-art (SOTA) assessment for your project that you update once a year and you want to ensure that the content isn't outdated.

```{note}
The SharePoint config files in this example need to be adapted to your network and
your SharePoint servers. Please make sure to adapt the files accordingly.
```

## Preparation

### Download resources

Please go ahead and download the following files. They will be required in the subsequent steps.

* {download}`qg-config.yaml <resources/qg-config.yaml>`
* {download}`sharepoint-evaluator-config-file.yaml <resources/sharepoint-evaluator-config-file.yaml>`

## Adjusting the config files

### The qg-config.yaml

Now that you have an accessible SharePoint site, you need to set a few environment variables in the `qg-config.yaml`. Feel free to have a look at the downloaded file first, to get an overview of it. Subsequently we will go over the parts that you want to adjust step by step.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
lines: 12-13
lineno-match:
---
```

Lines 12 and 13 require your Windows username for the variable
{envvar}`SHAREPOINT_FETCHER_USERNAME` and Windows password for the variable
{envvar}`SHAREPOINT_FETCHER_PASSWORD`. Add them to the
_Secrets_ to your namespace. If you need help with that, check out:
{doc}`../../../core/secrets/how-to-add-secrets`.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
lines: 14-17
lineno-match:
---
```

Please add the URL of the project site that you want to use in this example in line 14. For more information about how to retrieve the {envvar}`SHAREPOINT_FETCHER_PROJECT_URL` variable and what format it requires, please check {doc}`../how-to/how-to-share-url-on-prem`.

Sometimes, you might need to overwrite the IP address of the SharePoint server.
This is sometimes the case if the SharePoint site is not accessible via the URL
due to DNS issues and proxies. In this case, you can set the
{envvar}`SHAREPOINT_FETCHER_FORCE_IP` variable in the `qg-config.yaml` file. The
IP address can be found by following these steps:

* Copy the hostname of the project site, e.g. `sites.sharepoint.mycompany.com`
* Open a command line terminal on your and enter `nslookup <hostname>`.
* This should print some IP addresses. The one of the hostname is what you're looking for.

### The Sharepoint fetcher config

Now that you have configured the `qg-config.yaml`, you can go ahead and create the fetcher and evaluator configs.

If you want to download multiple specific files within a folder or are interested in downloading files that match certain conditions (other than the filename), you can provide a config file for the SharePoint fetcher. You can learn more about that here: {ref}`sharepoint-fetcher-config-file`. For our use case we don't need that, since we only want to evaluate one specific file that we identify by its name.

### The Sharepoint evaluator config

Here, we're defining the rules for the evaluation of a specific file. This file is rather short and only contains the following content:

```{literalinclude} resources/sharepoint-evaluator-config-file.yaml
---
language: yaml
linenos:
---
```

In line 1, you need to provide the name of the file you want to evaluate, including its extension. If you want to evaluate multiple files, just copy and paste the same structure as in lines 1 to 4 below each other. You can then decide if you want to use the same, or a different set of rules for the specified file.

The evaluator uses properties of the downloaded files to evaluate a given condition. Here, we are using the `Modified` property.

```{attention}
The property names for the evaluator differ between on-premise and cloud SharePoint instances. Ensure that you use the correct name to accurately evaluate the fetched files.
```

Line 4 contains the condition that has to be met for the `Modified` property. In this case, it checks whether the document has been modified within the last 12 months or not. The result is `GREEN` in case the check passes and `RED` if it does not.

## Running the example

Now, you can run the example. Upload the {file}`sharepoint-evaluator-config-file.yaml`, using the same name as stated in the {envvar}`SHAREPOINT_EVALUATOR_CONFIG_FILE` variable (line 16 in the {file}`qg-config.yaml`) as well as the `qg-config.yaml`.
