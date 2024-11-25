<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Evaluator Background Information

The evaluator checks the quality gate status fetched by the fetcher and returns RED if any of the gate checks doesn't have an OK status.

For example, the result of evaluating the fetched quality gates status below will be RED, because _new_coverage_ and _bugs_ metrics don't have OK status.

```{literalinclude} resources/sonarqube_qg_status.json
---
language: json
emphasize-lines: 22, 30
---
```

## Environment variables

```{envvar} SONARQUBE_ONLY_FAILED_METRICS
If set to true, only failing metrics will be listed in the run report. Default value: false
```

## Example config

Below is an example configuration file that runs SonarQube evaluator. The autopilot is configured in lines: 7-17. Required environment variables are read from provided run environment variables or secrets. Then the autopilot is used by the check 1.1 in line 32 which is part of requirement 5.1.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-17, 32
---
```
