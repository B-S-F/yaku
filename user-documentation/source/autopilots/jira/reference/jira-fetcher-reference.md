# Fetcher Background Information

A fetcher to get issues from Jira Tracker via the Jira Rest API. It can be configured by a [configuration file](#the-fetchers-config-file) that contains a query and other filtering criteria.

## Prerequisites

The user id that is set for the fetcher in {envvar}`JIRA_USERNAME` (or the owner of the {envvar}`JIRA_PAT`) must have access to the project in Jira tracker in order for the fetcher to work.

## Environment variables

```{envvar} JIRA_URL
The Jira tracker server url. An example would be `https://intran.net/some/path/to/jira`. If your full URL is `https://intran.net/some/path/to/jira/browse/ABC-123`, you need to remove the last part starting with `/browse/` so that you obtain the URL in the correct format.
```

```{envvar} JIRA_USERNAME
A valid user NT-ID.
```

```{envvar} JIRA_USER_PORTAL_PASSWORD
The user WAM/Portal password. For technical users it might be different from ldap password.
```

```{envvar} JIRA_PAT
The personal access token. For more information on how to create a PAT check the [JIRA documentation](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html).
This may be used instead of the Basic authentication via username and password.
```

```{envvar} JIRA_CONFIG_FILE_PATH
The path to the fetcher's and evaluator's config file. More details about the config file can be found right below.
```

## The fetcher's config file

The definition of which issues to be fetched, is given by a yaml file.
The location of this file is then referenced by the {envvar}`JIRA_CONFIG_FILE_PATH` environment variable.

:::{note}
This config files is used to configure the Jira fetcher and evaluator. For having a better understanding of the config, check out: {doc}`jira-evaluator-reference`.
:::

This config file should have the following structure:

```{literalinclude} resources/jira-config-structure.yaml
---
language: yaml
emphasize-lines: 1-4
---
```

The values of the _"query"_ and _"neededFields"_ properties is what the fetcher will send inside the request in order to filter the data. For more details about the query language and possible fields, check the official docs:

- [What is advanced searching in Jira Cloud?](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-searching-in-jira-cloud/)
- [Advanced searching - fields reference](https://confluence.atlassian.com/jirasoftwareserver/advanced-searching-fields-reference-939938743.html)

In Jira UI, if you go to `Issues -> Search for issues`, you can find an advanced search bar, which accepts jql. This could help to construct and validate your query.

## Example Output

The Jira fetcher creates a file in the evidence path called `data.json`. It has the following structure and contains all of the fetched issues:

```{literalinclude} resources/data.json
---
language: json
---
```

## Example config

Below is an example jira fetcher configuration file. It runs a query to fetch all issues of type **TASK** from **PROJECT1** Jira project. The fetched fields that will be evaluated and saved in the **data.json** fetcher output file are defined under **neededFields**

```{literalinclude} resources/jira-config.yaml
---
language: yaml
emphasize-lines: 1-5
---
```

The example configuration file below runs Jira fetcher. The autopilot is configured in lines: 7-15. Required environment variables are read from provided run environment Then the autopilot is used by the check 1.1 in line 30 which is part of requirement 2.6.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-15, 30
---
```
