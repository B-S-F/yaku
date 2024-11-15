# Attaching the results of a run to a Jira Issue

## Introduction

The Jira finalizer allows you to add comments or attach files to Jira issues based on the results of a qg run. To understand this guide, it is important that you have already completed the steps in {doc}`../../../onboarding`.

### Use-Case

Within this example, we will do the following:

* update a Jira issue with information about the results of our run and also upload

## Preparation

### Download Resources

Please go ahead and download the following files:

* {download}`jira-finalizer-config.yaml <../resources/jira-finalizer-config.yaml>`
* {download}`qg-config.yaml <../resources/jira-finalizer-config.yaml>`

## Steps

### Map Issues and Requirements

First, adjust the {file}`finalizer-config.yaml` file to connect the requirements to the issue. You can find the Jira Issue ID either in the Web UI or extract it from the issue URL:

```{image} ../resources/jira-issue-id.png
:width: 100%
:alt: You can find the Jira Issue ID either in the Web UI or extract it from the issue URL
```

In the example config provided, change the placeholder to include your Jira issue id.

```{literalinclude} ../resources/jira-finalizer-config.yaml
---
language: yaml
emphasize-lines: 4
caption: jira-finalizer-config.yaml
---
```

### Create Secrets

Next, create two new secrets, as described here: {doc}`../../../core/secrets/how-to-use-secrets`.

* One secret should hold your **username** and
* the other secret should contain either the **Jira password** or a **personal access token** that can be used instead of the password (More information regarding this can be found here: <https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html>)

### Adjust the Config File

Lastly, update the config file with the previously created secrets. Also make sure that you have the environment variable {envvar}`JIRA_API_URL` set in case you are using a different Jira instance.

```{literalinclude} ../resources/qg-config.yaml
---
language: yaml
start-at: "finalize:"
end-before: "chapters"
caption: "`finalize` part of `qg-config.yaml`"
---
```
