<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Configuration Files

A {{ PNAME }} {term}`workflow` is defined by one or more configuration files.

The main config file is the {file}`qg-config.yaml` file. It has two purposes:

1. It defines the **questions and criteria** of your release evaluation.
2. It includes **commands and scripts** for the automation of your release evaluation.

There might be other configuration files in your workflow {term}`configuration`,
for example a configuration file of the {doc}`JSON evaluator
<../../autopilots/json/index>`.

The main config file is explained in {doc}`main-config-file`.

There are other guides available which explain things like the usage of
variables or secrets. See below for a complete list.

## Guides

```{toctree}
:maxdepth: 1

main-config-file
parameter-replacement
```
