<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Scopes of Environment Variables

As you might have already found out, there are multiple places where environment variables can be defined. In this section, we will explore the behavior of environment variables in different contexts.

(environment-variable-scopes)=

## Overview

```{list-table}
:header-rows: 1
:widths: auto

* - Scope
  - Definition Location
  - Availability
  - Variable Priority
  - Variable Access
* - Global Environment
  - Top-level `env` section of `qg-config.yaml`
  - Entire configuration file
  - Lowest priority, can be overwritten by other levels
  - `${{ env.<name> }}` (or `$<name>` in scripts)
* - Autopilot Environment
  - `env` section of an autopilot
  - Only in the autopilot's `run` or the check's `env` section
  - Overrides global, can be overwritten by check level
  - `${{ env.<name> }}` (or `$<name>` in scripts)
* - Check Environment
  - `env` section of a `check`
  - Only in the autopilot's `run` section
  - Overrides global and autopilot levels
  - `${{ env.<name> }}` (or `$<name>` in scripts)
```

```{figure} env-scopes.drawio.png
:width: 100%
:alt: Overview of the different levels and scopes of environment variables
```

```{hint}
See [the Autopilots section](../configuration/main-config-file.md#autopilots) for an explanation
of the differences between `$NAME`, `${NAME}`, and `${{ env.NAME }}`.
```

## Global Variables

Environment variables that are defined in the top-level `env` section of the
{file}`qg-config.yaml` file are available globally in the entire configuration
file.
Those variables will be available as environment variables in each
{term}`autopilot script` and can be used in the same way as any other
environment variables in a shell script via `$<name>`, `${<name>}` or `${{ env.<name> }}`.
However, keep in mind that variables set at this global level are the least
prioritized and can be overwritten by variables from other levels.

```{list-table}
:header-rows: 1
:name: Global Environment Variables Overview
:widths: auto

* - Scope
  - Description
* - Definition Location
  - Top-level `env` section of `qg-config.yaml`
* - Availability
  - Global, accessible throughout the entire configuration file
* - Variable Priority
  - Lowest priority, can be overwritten by variables from other levels
* - Variable Access
  - Accessible in autopilot scripts as `$<name>` or `${<name}`, everywhere else as `${{ env.<name> }}`
```

```{code-block} yaml
:caption: Example for a global variable used in an autopilot run script

[...]
env: # global environment variables
  MY_VARIABLE: "my_value"
[...]
autopilots:
  [...]
  my-autopilot:
    run: |
      echo $MY_VARIABLE # prints "my_value"
  [...]
```

## Autopilot Variables

Environment variables that are defined in the `env` section of an
{term}`autopilot` overwrite environment variables from the global scope.
Those variables will be available as environment variables during execution of
the related {term}`autopilot` and can be used in the same way as any other
environment variables in a shell script via `$<name>`, `${<name>}` or `${{
env.<name> }}`.
Still, keep in mind that environment variables from the autopilot level override
variables from the global level, but can be overwritten by environment variables
from the check level.

```{list-table}
:header-rows: 1
:name: Autopilot Environment Variables Overview
:widths: auto

* - Scope
  - Description
* - Definition Location
  - `env` section of an autopilot
* - Availability
  - Only in the autopilot's `run` or the check's `env` section
* - Variable Priority
  - Overrides global environment variables, but can be overwritten by check level variables
* - Variable Access
  - Accessible in autopilot scripts as `$<name>` or `${<name}`, everywhere else as `${{ env.<name> }}`
```

```{code-block} yaml
:caption: Example for global and autopilot variables used in an autopilot script

env: # global environment variables
  GLOBAL_VARIABLE: "my_value"
  OVERRIDDEN_VARIABLE: "my_other_value"
[...]
autopilots:
  [...]
  my-autopilot:
    run: |
      echo $GLOBAL_VARIABLE # prints "my_value"
      echo ${OVERRIDDEN_VARIABLE} # print "autopilot_overrides_global"
    env: # autopilot environment variables
      OVERRIDDEN_VARIABLE: "autopilot_overrides_global"
```

## Check Variables

Environment variables that are defined in the `env` section of a `check`
`automation` overwrite environment variables from the global and
{term}`autopilot` scope.
Those variables will be available as environment variables during execution of
the {term}`autopilot` in reference to the related `check` and can be used in the
same way as any other environment variables in a shell script via `$<name>`,
`${<name>}`, or `${{ env.<name> }}`.
Still, keep in mind that environment variables from the check level override
variables from the global and autopilot level.

```{list-table}
:header-rows: 1
:name: Check Environment Variables Overview
:widths: auto

* - Scope
  - Description
* - Definition Location
  - `env` section of a `check` automation
* - Availability
  - Limited to the execution of the autopilot associated with the check
* - Variable Priority
  - Overrides global and autopilot environment variables
* - Variable Access
  - Accessible in autopilot scripts as `$<name>` or `${<name}`, everywhere else as `${{ env.<name> }}`
```

````{tip}
By setting `env` variables on check level, you can parametrize the autopilot used in the check. This is useful if you want to use the same autopilot multiple times with different parameters.

```yaml
autopilots:
  my-autopilot: # is called for both checks, but with different FILE value
    run: |
      echo Executing check for file ${FILE}...
chapters:
  [...]
  checks:
    '1':
      title: Check file A
      automation:
        autopilot: my-autopilot
        env:
          FILE: A
    '2':
      title: Check file B
      automation:
        autopilot: my-autopilot
        env:
          FILE: B
```

````

### Examples

```{code-block} yaml
:caption: Using a check environment variable in an autopilot

[...]
autopilots:
  [...]
  my-autopilot:
    run: |
      echo $MY_VARIABLE # prints "check_variable"
chapters:
  [...]
  requirements:
    [...]
    checks:
      '1':
        title: Check 1
        automation:
          autopilot: my-autopilot
          env: # check environment variables
            MY_VARIABLE: "check_variable"
```

```{code-block} yaml
:caption: Overriding an autopilot variable with a check variable

[...]
autopilots:
  [...]
  my-autopilot:
    run: |
      echo $MY_VARIABLE # prints "check_overrides_autopilot"
    env: # autopilot environment variables
      MY_VARIABLE: "autopilot_variable"
chapters:
  [...]
  requirements:
    [...]
    checks:
      '1':
        title: Check 1
        automation:
          autopilot: my-autopilot
          env: # check environment variables
            MY_VARIABLE: "check_overrides_autopilot"
```

```{code-block} yaml
:caption: Overriding a global variable with a check variable

env: # global environment variables
  MY_VARIABLE: "my_global_value"
[...]
autopilots:
  [...]
  my-autopilot:
    run: |
      echo $MY_VARIABLE # prints "check_overrides_global"
chapters:
  [...]
  requirements:
    [...]
    checks:
      '1':
        title: Check 1
        automation:
          autopilot: my-autopilot
          env: # check environment variables
            MY_VARIABLE: "check_overrides_global"
```
