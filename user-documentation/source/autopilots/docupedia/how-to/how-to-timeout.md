<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# How to use timeout mechanism

## Introduction

The Docupedia Fetcher is equipped with a custom timeout mechanism, allowing the user to choose the period of time after which the fetching operations are interrupted. The timeout has a default value of `590` s, in case it was not configured by the user.

## Adjust the qg-config.yml file

1. Start with the example configuration file from {doc}`../tutorials/docupedia-fetcher-tutorial`
2. Add the timeout environment variable, shown at line 15. By setting {envvar}`DOCUPEDIA_TIMEOUT` to `300` the fetcher will have a cut-off period of `300` seconds configured. After this period of time passes, the fetching operations will be interrupted and the autopilot's status will be set to `FAILED`.

```{literalinclude} resources/qg-config-timeout.yaml
---
language: yaml
linenos:
lineno-match:
start-at: autopilots
end-before: finalize
emphasize-lines: 10
---
```

## Upload and run the config

You can now upload the config to the {{ PNAME }} service and run it.
You should then find the downloaded content in the evidence zip file.
