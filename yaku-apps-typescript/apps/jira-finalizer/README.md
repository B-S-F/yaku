<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# jira-finalizer

The Jira finalizer is currently a POC.
It allows you to add comments or attachments to Jira issues.

## Usage

```plain
Usage: jira-finalizer <argument1> <argument2> ...

API client for JIRA

Options:
  -V, --version                        output the version number
  -h, --help                           display help for command

Commands:
  add-comment <issueId> <comment>
  add-attachment <issueId> <filePath>
  update-issues
  help [command]                       display help for command
```

## Configuration

The configuration of the finalizer has to be specified in a configuration file which has to be available at runtime.
In this file you tell which issues are mapped to which qg requirement.

The jira configuration file contains the following:

```yaml
requirements:
  '1.15': # requirement ids from qg-config
    issues: # A list of mapped issues that should be updated with the content of the requirement result.
      - AQUATEST-3
```

In order to use the finalizer in your qg configuration add the following code to your configuration:

```yaml
finalize:
  run: |
    export JIRA_USERNAME=<your username> 
    export JIRA_PASSWORD=<your password>
    jira-finalizer update-issues
```

## Env

### JIRA_USERNAME

The username of the JIRA user to authenticate with

### JIRA_PASSWORD

The password of the JIRA user to authenticate with (e.g. WAM password)

### OPTIONAL JIRA_API_URL

The api url of the JIRA instance

- string
  **default**: "https://tracker.example.com/tracker01/rest/api"

### OPTIONAL JIRA_API_VERSION

The api version to be used

- string
  **default**: "2"

### OPTIONAL JIRA_CONFIG_NAME

The name of the JIRA finalizer configuration file

- string
  **default**: "jira-finalizer-config.yaml"

### OPTIONAL result_path

Path where the result of the qg generation is stored, which is provided automatically by Onyx.

- string
