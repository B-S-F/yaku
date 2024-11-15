# Reference

## Prerequisites

The user defined in `JIRA_USERNAME` must have access to the Jira instance and all the issues that are modified by the finalizer.

## Environment Variables

{envvar}`JIRA_USERNAME`
The username of the JIRA user to authenticate with.

```{envvar} JIRA_PASSWORD
The password of the JIRA user to authenticate with (e.g. WAM password)
```

```{envvar} JIRA_API_URL
The API url of the JIRA instance.
(optional, default: "https://my.company.com/jira/rest/api")
```

```{envvar} JIRA_API_VERSION
The API version to be used.
(optional, default: "2")
```

```{envvar} JIRA_CONFIG_NAME
The name of the JIRA finalizer configuration file.
(optional, default: "jira-finalizer-config.yaml")
```

## Command line options

The `jira-finalizer` command has more subcommands and options, for example
for uploading attachments to an issue:

```{literalinclude} ../resources/jira-finalizer-command-description.txt
---
language: text
---
```
