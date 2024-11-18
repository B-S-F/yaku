# How to use the Jira-Finalizer in a qg-config

## Prerequisites

First, you need to define a mapping between Jira issues and the qg-requirements. This is described here: {doc}`./how-to-map-issues-and-requirements`

## Using the finalizer

In order to use the finalizer in your qg configuration, make sure to:

1. Add the `jira-finalizer update-issues` command to the `run` script in the `finalize` section of your {file}`qg-config.yaml` file.
2. Add the mandatory [environment variables](../reference/jira-finalizer-reference.md#environment-variables): usually:

   - {envvar}`JIRA_USERNAME`,
   - {envvar}`JIRA_PASSWORD` and
   - {envvar}`JIRA_API_URL`.

Below is an except of a {file}`qg-config.yaml` file which shows
the `finalize` section. If you don't have a `finalize` section, just
add it using the following code:

```{literalinclude} ../resources/jira-finalizer-run-env.yaml
---
language: yaml
caption: Excerpt of the `finalize` section of a {file}`qg-config.yaml` file
---
```

```{note}
While the Jira username can also be entered als clear text, make sure to always use secrets for sensitive information in qg-config files: see {doc}`../../../core/secrets/how-to-use-secrets`.
```
