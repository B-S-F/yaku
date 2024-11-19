<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Sonarqube cli

**_NOTE:_** Handling sonarqube integrations

## Usage

In order to see all use-cases please use `sonarqube --help`

### Fetch a project's status

```bash
sonarqube fetch project-status --project-key <project-key> --hostname <hostname> --access-token <access-token>
```

You can also use the following environment variables:

- `SONARQUBE_HOSTNAME`
- `SONARQUBE_PROJECT_KEY`
- `SONARQUBE_ACCESS_TOKEN`
