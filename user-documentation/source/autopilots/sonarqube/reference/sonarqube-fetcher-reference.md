<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Fetcher Background Information

The fetcher makes a request against the Sonarqube API, gets the the current status of the project quality gates and saves it as a json file to the evidence path.

## Environment variables

```{envvar} SONARQUBE_HOSTNAME
The hostname of the Sonarqube server api.
```

```{envvar} SONARQUBE_ENDPOINT
The path on the host leading to the Sonarqube endpoint. Example: `/sonarqube`
```

```{envvar} SONARQUBE_PORT
The port number used to to connect with the Sonarqube api.
```

```{envvar} SONARQUBE_PROTOCOL
The protocol used to to connect with the Sonarqube api. Default value: _https_
```

```{envvar} SONARQUBE_PROJECT_KEY
The project key from the Sonarqube portal. _Not_ the project name, but often very similar.
```

```{envvar} SONARQUBE_PROJECT_TOKEN
The API token generated from the Sonarqube portal.
```

## Example Output

The SonarQube fetcher creates a file in the evidence path called `sonarqube_qg_status.json`. It has the following structure and contains the status of project quality gates:

```{literalinclude} resources/sonarqube_qg_status.json
---
language: json
---
```

## Example config

Below is an example configuration file that runs SonarQube fetcher. The autopilot is configured in lines: 7-17. Required environment variables are read from provided run environment variables or secrets. Then the autopilot is used by the check 1.1 in line 32 which is part of requirement 5.1.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-17, 32
---
```
