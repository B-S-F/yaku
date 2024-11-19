<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Evaluator Background Information

An evaluator to check the response returned by the "jira-fetcher" according to the rules defined in a [configuration file](#the-evaluators-config-file)

## Environment variables

The Jira evaluator shares the following environment variables with the Jira fetcher:

* {envvar}`JIRA_CONFIG_FILE_PATH` - The path to the fetcher's and evaluator's config file. More details about the config file can be found right below.

## The evaluator's config file

A yaml file with the following structure should be created in the location referenced by the {envvar}`JIRA_CONFIG_FILE_PATH` environment variable. Here, you can define the conditions to be checked for the evaluation of the fetched issues. If all issues pass all checks, a `GREEN` status will be returned. Otherwise, the status will be `RED` and you can find information on which issues didn't match which condition in the report.

```{note}
This config file is used to configure the Jira fetcher and evaluator. For having a better understanding of the first part of the config, also check out: {doc}`jira-fetcher-reference`.
```

The file has the following structure:

```{literalinclude} resources/jira-config-structure.yaml
---
language: yaml
emphasize-lines: 5-18
---
```

## Condition types

There are two different validators (condition types) that you can use for your rules:

`expected`

* Throw an error if any of the issues DOES NOT have one of the enumerated values
* Report:
  * OK: All issues have one of the expected values: [expected]
  * NOK:
    * The following issues are invalid because they don't have one of the expected values ([expected])
    * list of all invalid issues.

`illegal`

* Throw an error if any of the issues DOES have one of the given values
* Report:
  * OK: None of the issues have one of these illegal values: [illegal]
  * NOK:
    * The following issues are invalid because they have one of the illegal values ([illegal])
    * list of all invalid issues.

To learn more about the query field of the yaml file, please check: {doc}`jira-fetcher-reference`.

## Example config

Below is an example configuration file that runs Jira evaluator. The autopilot is configured in lines: 7-15. Required environment variables are read from provided run. Then the autopilot is used by the check 1.1 in line 30 which is part of requirement 2.6.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-15,30
---
```

And an example jira configuration file, would look like below. In this example, the fetched Jira issues are expected to have **USER1** as assignee and status **DONE**. If any fetched issue doesn't have one of these conditions, the autopilot result will be RED.

```{literalinclude} resources/jira-config.yaml
```

## Apply AND condition between fields

By default, the evaluator checks the fetched issues against every field conditions separately with no connection between the fields.
This means: All fetched issues should have one of the expected values of each field.

In case you care about certain fields values to exist together in the fetched issues you can use the _AND_ logic setting.

### Example

Below is an example jira configuration file with _AND_ condition.

```{literalinclude} resources/jira-config-with-and.yaml
---
language: yaml
emphasize-lines: 7
---
```

By default, the output of this configuration file will be RED if any of the fetched issues doesn't have the expected assignee "USER1" or doesn't have the expected status "Done".

But when applying the AND condition, the output will be RED only if not all of the issues that have "USER1" as assignee have the status "Done".
