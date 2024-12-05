<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Evaluating files with the JSON evaluator

```{note}
This tutorial does not configure any fetcher. It only uses the JSON evaluator to check if a manually uploaded file fulfills certain conditions.
```

## Introduction

With the JSON evaluator, you can evaluate JSON files based on their content.

### Use-case

For this example, we are using the following use case:

- We manually upload a JSON file to our service and then the JSON evaluator evaluates the file based on its content.

- We want to verify that the total test coverage in the JSON file is bigger than 70%.

## Preparation

### Download resources

Please go ahead and download the following files. They will be required in the subsequent steps.

- {download}`qg-config.yaml <resources/qg-config.yaml>`
- {download}`json-evaluator-config.yaml <resources/json-evaluator-config.yaml>`
- {download}`coverage-data.json <resources/coverage-data.json>`

## Adjusting the config files

### The qg-config.yaml

Feel free to have a look at the downloaded file first, to get an overview of it.
For the JSON evaluator, there are only two environment variables that need to be set, additional optional variables can however be specified for more precise control.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 11, 12
---
```

Lines 11 and 12 require the filename of the JSON formatted data to evaluate {envvar}`JSON_INPUT_FILE` and the the path to the JSON evaluator's configuration file {envvar}`JSON_CONFIG_FILE`.

The JSON evaluator config file is described in the next section. We already provided a config file for this example, so you don't have to adapt the config file for this example.

```{note}
Please refer to the [Evaluator Background Information](../reference/json-evaluator-reference.md#environment-variables) for
more detailed information and a comprehensive list of all available environment variables for the JSON evaluator.
```

### The JSON evaluator config

Now that you have configured the `qg-config.yaml`, you can go ahead and create the JSON evaluator config.

This file should be created with the same filename as given by the {envvar}`JSON_CONFIG_FILE` environment variable. Here, you can define the conditions to be checked for the evaluation of the input JSON data.

```{literalinclude} resources/json-evaluator-config.yaml
---
language: yaml
linenos:
emphasize-lines: 3, 4
---
```

In line 3, you need to provide a reference to the object in the JSON file that you want to evaluate. In this case, we want to evaluate the `percent_covered` property of the `totals` object (see also {doc}`../reference/jsonpath-reference`)
.

In line 4, you need to provide the condition that has to be met for the `percent_covered` property. In this case, it checks whether the value of the `percent_covered` property is bigger than 70%. The result is `GREEN` in case the check passes and `RED` if it does not.

## Running the example

Now, you can run the example. Upload the {file}`json-evaluator-config.yaml`, using the same name as stated in the {envvar}`JSON_CONFIG_FILE` variable (line 15 in the {file}`qg-config.yaml`) as well as the `qg-config.yaml`. Don't forget to also upload the {file}`coverage-data.json`.
