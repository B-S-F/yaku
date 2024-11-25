<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Getting Started with ILM Evaluator Autopilot

## Introduction

**Important note:** ILM is a Bosch-specific implementation.

ILM Evaluator Autopilot is a tool that allows you to retrieve the WorkOn status for a specific SharePoint file, together with the workflow requestor and approvers. This tutorial provides an introduction to ILM Evaluator and demonstrates how to configure it. To understand this guide, it is essential to have completed the following steps:

* Obtain access to a Bosch SharePoint server
* Complete {doc}`../../../onboarding`

### Use-cases

For this example, we are using the following use cases:

* For a SharePoint file, we will determine whether a WorkOn exists and if it has been approved
* If a WorkOn exists, we will determine who is the requestor
* If a WorkOn exists, we will determine who are the approvers (if applicable)

## Preparation

### Download resources

Please download the following files first:

* {download}`qg-config.yaml <resources/qg-config.yaml>`
* {download}`input-file.json <resources/input-file.json>`

Upload the files to the {{ PNAME }} service. If you are unsure how to perform those steps, take a look at the {doc}`../../../quickstart`.

The following steps for editing the configuration files are done directly in the web interface and the integrated editor.

## Adjust the config files

You should have uploaded the files already to the {{ PNAME }} web interface.

Now open the editor of the config, which you have created for this tutorial.

### Use ILM Evaluator in qg-config.yaml

1. Open the {file}`qg-config.yaml` file and take a look at the sections.
    The interesting lines are the definition of the `ilm-evaluator` autopilot:

    ```{literalinclude} resources/qg-config.yaml
    ---
    language: yaml
    lines: 7-13
    lineno-match:
    ---
    ```

2. Now you need to adapt the environment variables defined for this autopilot script:
    * Line 11: The variable {envvar}`ILM_USERNAME` must contain the username used to connect to the ILM service. This is usually your Windows username.
    * Line 12: The variable {envvar}`ILM_PASSWORD` must contain the password used to connect to the ILM service. This is usually your Windows password.
    * Line 13: The variable {envvar}`PROPERTIES_FILE_PATH` must contain the path to the input file. Since we uploaded the files in {{ PNAME }}'s user interface, the path can simply be the file name. There is no need to change the value since it is already set to "input-file.json".

### Adjust the input file

The input file that we downloaded previously contains the following two fields:

```sh
{
    "ServerRedirectedEmbedUri": "<<your_sharepoint_site>>/_layouts",
    "OData__dlc_DocId": "<<shor_id_of_target_file>>"
}
```

All we have to do is to replace the marked values.

* ```<<your_sharepoint_site>>``` is simply the address of a Bosch SharePoint server.
* ```<<shor_id_of_target_file>>``` is the ShortID of the target file. If ShortID is missing from the SharePoint library, please see [the follwing link](https://inside-docupedia.bosch.com/confluence/pages/viewpage.action?pageId=565221724#ILMFeatures(EN)-Workflows.1), section "How to create the column ShortID?"

A concrete example of the input file would be:

```sh
{
    "ServerRedirectedEmbedUri": "https://sites.sharepoint.mycompany.com/sites/123456/_layouts",
    "OData__dlc_DocId": "P12S164897-190373571-7713"
}
```

## Run the example

You can now save the files and start a new run of this configuration.
Please see the [ilm evaluator references](../reference/ilm-evaluator-reference.md#example-output) for the possible results of the runner.
