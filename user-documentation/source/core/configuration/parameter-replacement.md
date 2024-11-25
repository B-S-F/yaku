<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Variable types and their usage

Variable replacement is a powerful feature in {{ PNAME }} configuration files
that enhances flexibility in configuration. It allows you to:

* **Use placeholders to dynamically adjust settings**: this allows you to
  use the same configuration file(s) or the same automation script for different
  software modules or different artifacts, e.g., documents.
* **Securely use secrets**: you can use variables to securely handle sensitive
  information within your configuration files, instead of writing them in clear
  text into your files.
* **Reuse settings in different places**: you can use global variables to
  replace hard-coded values which appear multiple times in your configuration
  files.

```{glossary}
variables
  Variables are placeholders which can be used in the {{ PNAME }} configuration files.
  There are three different types of variables that can be replaced in a QG config file:

  - [Environment variables](#environment-variables)
  - [Run Variables](#run-variables)
  - [Secrets](#secrets)
```

In the next three sections, you will learn what those parameters are, what they
are used for and how you can use them in your own configuration files.

## Environment variables

In the config file, you can define environment variables in the `env` section.
This can look like this:

```{code-block} yaml
---
caption: Example global `env` section with two global environment variables
---
env:
  MY_VARIABLE: "my_value"
  MY_OTHER_VARIABLE: "my_other_value"
```

You can reference environment variables in the config file with `${{ env.<name> }}`.
For example, if you want to reference the environment variable `MY_VARIABLE` of
the global environment variables in an autopilot, you can use `${{ env.MY_VARIABLE }}`.

For more information, see {doc}`../environment-variables/index`.

## Run Variables

[Run variables](../run-variables/index) are specified by the user via our {{ PNAME }} Service. They are available for the whole QG config file and all the referenced config files. You can reference variables in the config file with `${{ vars.<name> }}`. For a detailed example of a config file, see {doc}`../run-variables/index`.

## Secrets

Secrets can be specified via our {{ PNAME }} Service. They are available for the whole OG config file but are not allowed in the referenced config files. You can reference secrets in the config file with `${{ secrets.<name> }}`. See {doc}`../secrets/how-to-add-secrets` and {doc}`../secrets/how-to-use-secrets` for more details.
