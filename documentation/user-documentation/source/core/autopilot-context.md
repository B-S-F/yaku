<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Autopilot Execution Context

Autopilots are executed as subprocesses. This page explains how these
subprocesses are executed and how the results from the subprocesses are
evaluated.

{term}`Autopilot scripts <autopilot script>` are called as a `/bin/bash -c`
script. Other shells are not supported today.

Inside the script, usually one or more {term}`autopilot apps <autopilot app>` are called.

The autopilot's **inputs** are variables or configuration files while the
**output** is done by JSON lines or files.

See below for more information on [Autopilot Inputs](#autopilot-inputs) or
[Outputs](#autopilot-outputs).

## Autopilot Inputs

The {term}`autopilot script` and the {term}`autopilot apps <autopilot app>` can
make use of dynamic **input** data, for example:

* **Configuration files**, which are used for some autopilot apps.
* **Environment variables**, which might
  originate from different sources, see chapter
  {doc}`../../../core/environment-variables/index`.
* **Secrets** to provide credentials or other confidential
  information to an autopilot app, see chapter {doc}`../../../core/secrets/index`.
* **Run variables**, in case you have a dynamically
  configurable config file, see chapter {doc}`../../../core/run-variables/index`
  for more details.

### Configuration Files

All configuration files which are contained in the {term}`configuration` are
accessible in the current working directory of an {term}`autopilot script`.

```{attention}
Every autopilot which is called from a check is executed in a dedicated folder,
one folder per check.
This is necessary to separate the inputs and outputs of one check from the data
of another check.

Thereby the autopilot script must not access anything outside of that directory.
Files and folders should only be stored in the current working directory.
```

### Environment Variables

Inputs to autopilot scripts are usually passed using
{term}`environment variables <environment variable>`.
These environment variables can be configured in
{doc}`the main config file <../../../core/configuration/main-config-file>`.

### Run variables

{term}`Run variables <run variables>` are configuration variables that can be
used to parameterize the configuration.
For more information, see {doc}`../../../core/run-variables/index`.

### Secrets

{term}`Secrets <secret>` are passwords or access tokens.
They must not be stored inside the `qg-config.yaml` file.
Instead, they can be stored as {term}`service secrets <service secret>`.
See chapter {doc}`../../../core/secrets/index` for more details.

## Autopilot Outputs

An autopilot usually evaluates documents or other artifacts.  The result of the
evaluation is then passed on to {{ PNAME }}. This happens via specially
formatted text lines on the standard output of the autopilot.

You can read more on the format of those text lines in {doc}`../reference/interfaces/json-lines`

Often, an autopilot creates files or directories. Any file or subdirectory
in the working directory will be stored as {term}`evidence` and can later be
downloaded from the run result.
