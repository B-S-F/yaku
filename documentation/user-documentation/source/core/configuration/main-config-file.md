<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# The QG config file

The {file}`qg-config.yaml` file is the main configuration file of {{ PRODUCTNAME }}.
It is used as a configuration interface for our service.

When new features are added to {{ PNAME }}, the format of the config file might change.
This is why the config file has a metadata version. You can find the version of
the config file in the `metadata` section (see [below](#metadata)).

| File Format Version | Status                          |
| :------------------ | ------------------------------- |
| v1                  | The current version             |
| v0                  | Removed, not supported any more |

## Overview

The {file}`qg-config.yaml` file must be written in YAML format.
It might look similar to the following example:

```{code-block} yaml
---
caption: A sample {file}`qg-config.yaml` file
---
metadata:
  version: v1
header:
  name: QG4 Evaluation
  version: 1.0.0
env:
  FILE_DIRECTORY: "/tmp"
autopilots:
  check-file-availability:
    run: |
      if [ -f ${FILE_PATH} ]; then
        echo '{"status": "RED", "reason": "File ${FILE_PATH} was not found!"}'
        echo '{"result": {"criterion": "File ${FILE_PATH} must exist.", "fulfilled": false, "justification": "File ${FILE_PATH} was not found!"}}'
      else
        echo '{"status": "GREEN", "reason": "File ${FILE_PATH} was found."}'
        echo '{"result": {"criterion": "File ${FILE_PATH} must exist.", "fulfilled": true, "justification": "File ${FILE_PATH} was found."}}'
      fi
    env:
      FILE_PATH: ${{ env.FILE_DIRECTORY }}/${{ env.FILE_NAME }}
chapters:
  "1":
    title: My first chapter
    requirements:
      "1":
        title: My first requirement
        text: The files "a.txt" and "b.txt" must exist.
        checks:
          check-file-availability:
            title: Check if file A is available.
            automation:
                autopilot: check-file-availability
                env:
                    FILE_NAME: "a.txt"
          check-file-availability2:
            title: Check if file B is available.
            automation:
                autopilot: check-file-availability
                env:
                    FILE_NAME: "b.txt"
      "2":
        title: My second requirement
        text: The file "c.txt" must exist.
        checks:
          check-file-availability:
            title: Check if file C is available.
            manual:
              status: GREEN
              reason: "File c.txt is not needed anymore."
```

As you may already see, the file consists of different sections:

- `metadata`: This section contains metadata about the configuration file itself, e.g., the version of the configuration file.
  [Read more...](#metadata)
- `header`: This section contains metadata about the component that is being configured, e.g., the name and version of the component.
  [Read more...](#header)
- `env`: This section contains environment variables that are available globally in the configuration file.
  [Read more...](#env)
- `autopilots`: This section contains the definitions of the autopilots that are used in the configuration file.
  [Read more...](#autopilots)
- `chapters`: This section contains a tree-like structure of chapters, requirements and checks that are used to map quality gate requirements to their answers in a structured way.
  [Read more...](#chapters)

## Terms and Definitions

To understand the structure of a QG config file, the following terms are helpful:

```{glossary}
chapter
  A chapter is a section in the config file that is used to group {term}`requirements <requirement>`
  together. It is used to structure the config file.

requirement
  A requirement is a section in the config file that is used to define a process requirement.
  Each requirement can contain multiple {term}`checks <check>`.

check
  A check is a section in the config file that is used to define a process check.
  Each check is mapped to an {term}`autopilot` definition.

autopilot
  An autopilot is a definition of an {term}`autopilot script` together with
  some environment variables which are necessary for executing the script.

autopilot script
  An autopilot script is a script that is defined in the `run` section of an autopilot.
  This script is executed as part of a workflow run.

workflow
  A {{ PNAME }} workflow is defined by the QG config file.
  It is the sum of all chapters and autopilots.

configuration
  In {{ PNAME }}, a configuration is a set of files. It consists of at least the
  {term}`workflow` configuration file {file}`qg-config.yaml`, plus additional
  configuration files which might be necessary for {term}`autopilot apps
  <autopilot app>` inside your workflow.
```

## Metadata

The `metadata` section contains metadata about the configuration file itself.

Currently, it only contains the version of the configuration file.
This is used to ensure that the configuration file can be read correctly by the {{ PRODUCTNAME }} service.
The current version is `v1`.

```{code-block} yaml
----
caption: Example of a `metadata` section
----
metadata:
  version: v1
```

## Header

The `header` section contains metadata about the component that is being configured.
This is used to provide some context in the final report.

```{note}
The `name` and `version` header fields are mandatory.
```

```{code-block} yaml
----
caption: Example of a `header` section
----
header:
  name: "My component"
  version: 0.1.1
```

<!--
You can provide your own arbitrary header fields. Simply add them to the `header` section:

```yaml
header:
  name: My Product
  version: 1.0
  managed-by: TX/AQC
  git-revision: 03db9a
  git-tag: 1.0-rc1
```
-->

## Env

The `env` section contains environment variables that are available globally in the configuration file.

The environment variables can be referenced in the config file by using the `${{
env.VARIABLE_NAME }}` syntax. For example:

```{code-block} yaml
---
caption: Example `env` section and usage of the environment variable in a chapter title
---
env:
  NAME: Jupiter
[...]
chapters:
  "1":
    title: My first chapter for product ${{ env.NAME }}
    requirements:
```

See {doc}`../environment-variables/scope-of-env-vars` for more details, especially about other places where you can define and use environment variables.

## Autopilots

The `autopilots` section contains the definitions of the {term}`autopilots
<autopilot>` that are used in the configuration file. An autopilot definition
always contains a `run` section. Additionally it can contain an `env` and a
`config` section.

```{code-block} yaml
---
caption: Example of an `autopilots` section
---
autopilots:
  sample-autopilot:
    run: |
      echo "Hello ${{ env.NAME }}!"  # prints "Hello World!"
    env:
      NAME: World
```

The `run` section contains the script that is executed when the
{term}`autopilot` is called.  The script is executed in a bash shell
environment.

The (optional) `config` section can contain names of additional configuration files
that are used in the autopilot.  See
{doc}`../environment-variables/replacing-in-an-additional-config` for usage
examples.

The `env` section contains environment variables on {term}`autopilot` level that
are passed to the script.  The environment variables can be referenced in the
script using the `${{ env.VARIABLE_NAME }}` or `$VARIABLE_NAME` syntax.

````{admonition} What is the difference between $VAR and $\{\{ env.VAR \}\} ?
The syntax `$VAR` (or `${VAR}`) is actually a shell feature. When the
{term}`autopilot script` is executed in the integrated shell, the shell script
lines are parsed by the shell and such variable references are replaced by
(environment or shell) variable values.

The syntax `${{ env.VAR }}` however is a {{ PNAME }} feature and is replaced
with the variable's value _before_ the shell is called!

Let's take a look at an example:

```yaml
autopilots:
  variable-replacement-autopilot:
    run: |
      echo $NAME, ${NAME}, ${{ env.NAME }}
      NAME=Bob
      echo $NAME, ${NAME}, ${{ env.NAME }}
    env:
      NAME: "Alice"
```

When this autopilot is executed, the `${{ env.NAME }}` placeholders are replaced
by the `NAME` environment variable first. Then, the lines of the `run:` section
are handed over to the shell and executed by the shell.
The shell script that is actually executed looks like:

```bash
echo $NAME, ${NAME}, Alice
NAME=Bob
echo $NAME, ${NAME}, Alice
```

The first `echo` line resolves the `NAME` reference by the environment variable
`NAME=Alice`, whereas the second `echo` line uses the local shell variable
`NAME=Bob` for the replacement.

The final output is then:

```sh
Alice, Alice, Alice
Bob, Bob, Alice
```

````

## Chapters

The chapters section contains a tree-like structure of {term}`chapters <chapter>`,
{term}`requirements <requirement>` and {term}`checks <check>` that are used to
map quality gate requirements to their answers in a structured way.

A chapter is an entity in the config file that is used to group requirements together.
It must contain a `title` field with context about the chapter.
Optionally, a `text` field can be given with more details about the chapter's intention.
Usually, it contains multiple {term}`requirements <requirement>`.

A requirement is an entity in the config file that is used to define a process
requirement.  It can contain a `title` and a `text` field, which are used
to describe the requirement.  Besides that it usually contains multiple
{term}`checks <check>`.

```{code-block} yaml
---
caption: Example of a `chapters` section (without `checks` yet)
---
chapters:
  "1":
    title: "Chapter 1"
    text: Some optional description about chapter 1
    requirements:
      "1":
        title: README file
        text: A README file must exist!
        checks:
          [...]
```

A check is an entity in the config file that is used to define a process check.
It must contain a `title` field with context about the check.
Additionally it must contain either an `automation` or a `manual` section.

The `automation` section contains the definition of an autopilot that is used to automate the check.
It must contain an `autopilot` property and optionally an `env` or a `config` section.
The `autopilot` property contains the name of the autopilot that is used to automate the check.
The `env` section contains environment variables on check level that are passed to the autopilot.
The `config` section contains names of additional configuration files that are used.
(Note: You must mention config files if you want to
[replace environment variables inside extra config files](../environment-variables/replacing-in-an-additional-config.md))

```{code-block} yaml
---
caption: Example of a `requirements` section with a check and an autopilot reference
---
autopilots:
  check-for-readme-autopilot:
    [...]
chapters:
  "1":
    title: "Chapter 1"
    requirements:
      "1":
        title: README file
        text: A README file must exist
        checks:
          '1':
            title: 'Check for existence of README file'
            automation:
              autopilot: check-for-readme-autopilot  # ← must be same name as above!
              env:
                README_NAME: README.txt
```

The `manual` section describes a manual or hardcoded answer for the check.
It must contain a `status` and a `reason` field.
The `status` field contains the status of the check (either `GREEN`, `RED`, `YELLOW`, `NA` or `UNANSWERED`).
The `reason` field contains the reason for the status of the check.

```{code-block} yaml
---
caption: Example of a `requirements` section with a check with a manual answer
---
chapters:
  "1":
    title: "Chapter 1"
    requirements:
      "1":
        title: README file
        text: A README file must exist
        checks:
          '1':
            manual:
              status: GREEN
              reason: "Is automatically generated during build"
```
