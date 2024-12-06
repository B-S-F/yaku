<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Getting Started with Splunk Fetcher

```{note}
This tutorial offers an example of how you can configure the Splunk Fetcher using a configuration file.
```

## Introduction

With the Splunk fetcher, you can fetch and store data from Splunk via search queries.

### Use-case

For this example, we are using the following use case:

* We will fetch data from a Splunk server using environment variables for connection and a search query to fetch only the needed data

## Preparation

### Download resources

Please go ahead and download the following file. It will be required in the subsequent steps.

* {download}`qg-config.yaml <../reference/resources/qg-config.yaml>`

Feel free to have a look at the downloaded file first, to get an overview of it.

## Adjust the QG config file

The autopilot consists of two steps:

1. First, we call the {command}`splunk-fetcher` app (line 9). For that, we also
   need to configure the necessary environment variables (we will do this
   in the next section).
2. Then, we need to verify the fetched data (lines 10-15). In our example here,
   we just make sure that there are some results. For this, we are using the
   {command}`jq` command line application which can parse and evaluate JSON
   files.  See <https://jqlang.github.io/jq/> for details about jq.

Here is the code snippet of the autopilot's `run` section:

```{literalinclude} ../reference/resources/qg-config.yaml
---
language: yaml
linenos:
lineno-match:
start-at: run
end-before: env
---
```

### Adapt environment variables for Splunk

There are a few environment variables which must be set for the
{command}`splunk-fetcher` command.

```{literalinclude} ../reference/resources/qg-config.yaml
---
language: yaml
linenos:
lineno-match:
start-at: env
end-before: finalize
---
```

The next sections give you some details about the environment
variables and for what they are used.

```{note}
For more information about all available environment variables for the fetcher
have a look at {doc}`../reference/splunk-fetcher-reference`.
```

#### 1. Connection parameters

This type of environment variable helps at connecting to the Splunk server.
For example, you need to provide username and password for a user account
which has access to the Splunk server.

Now, replace the values behind the colon in the first four lines for the
{envvar}`SPLUNK_HOST`, {envvar}`SPLUNK_PORT`, {envvar}`SPLUNK_USERNAME` and
{envvar}`SPLUNK_PASSWORD` environment variables.

For the password, a secret should first be created and then referenced in the configuration: `${{ secrets.SPLUNK_PASSWORD }}`. For more information on how you can create secrets, check {doc}`../../../core/secrets/index`.

#### 2. Query parameters

The next two parameters are query parameters, which are used to specify a query in order to get the needed information.

Please replace the text behind the colon for the {envvar}`SPLUNK_APP` and {envvar}`SPLUNK_QUERY` environment variables with your Splunk app from which you want to fetch the data and your specific search query. For more information about Splunk query search, please follow the [documentation](https://docs.splunk.com/Documentation/Splunk/9.1.0/Search/WhatsinSplunkSearch).

````{note}
Take care with the query string: it might contain special characters or quotes,
so for example if the query string contains a `"` character, you could surround the whole value (behind the colon) with a `'` character, e.g.

```yaml
SPLUNK_QUERY: 'search index="abc" ...'
```

Same for the other way round:

```yaml
SPLUNK_QUERY: "search index='abc' ..."
```

Moreover, the query string must always start with the `search` keyword along with the query from the Splunk UI.

````

#### 3. Output parameter

This parameter represents where you want the fetched data to be stored. You can change the value of {envvar}`SPLUNK_RESULT_FILE` to specify the file name you want.

This is especially useful if you want to process the file further, like we are doing in line 10.

## Upload and run the example

Now you can run the example by uploading `qg-config.yaml`.

### Add result validation

If the run was successful you can now try to add a validation for the fetched data.
In order to enable the validation, you need to pass the `--validate-results` flag to the `splunk-fetcher` command, or set the {envvar}`SPLUNK_VALIDATE_RESULTS` environment variable to `true`.
