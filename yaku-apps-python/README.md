<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# yaku-apps-python

Python apps for fetching and evaluating data from remote services.

## Introduction

This directory for the Python apps is set up as a monorepo with
[pants](https://www.pantsbuild.org).  If you want to work with the files in
here, open the `yaku-apps-python` directory in your IDE, e.g. VS Code, and work
with the files in there.

The Python apps are organized in the `apps` directory. Each app has its own
directory with the following structure:

- `src/`: The source code of the app.
- `tests/`: The tests for the app.
- `tests-integration/`: The integration tests for the app (optional).
- `tests-pex/`: The tests for the pex "binary" file (optional).

There are some shared directories:

- `packages/`: Shared Python packages, mainly the `autopilot_utils` package.

## Getting started

To get started, you need to install [pants](https://www.pantsbuild.org) first.

There is a [Makefile](Makefile) with some useful commands. You can run `make
help` (or just `make`) to get an overview over the available commands.

If you don't have `make` installed, you can also run the commands directly, e.g.
`pants lint ::` instead of `make lint` or `pants test ::` instead of `make test`.

Here are some useful pants commands:

- `pants test apps/sharepoint-fetcher/tests::` to run the tests of the SharePoint fetcher.
- `pants run apps/sharepoint-fetcher -- -h` to run the SharePoint fetcher with the help message.
- `pants test --debug-adapter apps/sharepoint-fetcher/tests/test_something.py` to run a test
  with the debug adapter so that you can attach your IDE to the running test.
- `pants package apps/sharepoint-fetcher` to build a `.pex` file of the SharePoint fetcher.

See the next section for more details.

## Development

We are using [pants](https://www.pantsbuild.org) for the monorepo setup.

Get `pants` from <https://www.pantsbuild.org/docs/installation>.
You might need to install some
[prerequisites](https://www.pantsbuild.org/docs/prerequisites) like
`python3-dev` and `python3-distutils`.

### Upgrading pants

Pants itself is upgraded automatically, so that the pants version given in
[`pants.toml`](pants.toml) is used.

But the pants launcher needs to be updated from time to time.
To [update the pants launcher](https://www.pantsbuild.org/docs/installation), execute:

```sh
SCIE_BOOT=update pants
```

### Git hooks

To install Git hooks, run `make install-hooks`.

### Lock files

If you encounter error messages like

> To regenerate your lockfile, run `pants generate-lockfiles --resolve=python-default`.

you have to recompute your Python lockfiles. Please use `make update-lockfiles`
to regenerate the lockfiles. This automatically updates the
`dependabot-requirements.txt` file.

### Updating vulnerable packages

As mentioned in the section above about lock files, the GitHub dependabot
will read the `dependabot-requirements.txt` file and warn in case of vulnerable
dependencies.

In that case, simply run `make update-lockfiles` to update the lockfiles. This
will also update the `dependabot-requirements.txt` file.

If you want to tighten our dependencies' versions, you can also start adding
more precise version requirements into the requirements files, add exact
version requirements to `3rdparty/requirements.txt`. The next time, when
there is a warning by dependabot, you can then just bump the version to the
next secure version.

For example if there is a line for `urllib==2.0.6` and you need to update
`urllib` to 2.0.7, just change the line to `urllib==2.0.7` and then run
`make update-lockfiles` again.

### Formatting and linting

To lint files, run `pants lint ::`, and to apply formatting, run `pants fmt ::`.
Or just `make lint` and `make format`.

### Running tests

To run tests, just enter `pants test ::` on the console. You can also specify
subtargets, e.g. `pants test apps/artifactory-fetcher/::` or`pants test
apps/artifactory-fetcher/tests/` or even `pants test
apps/artifactory-fetcher/tests/test_main.py`.

For _print-debugging_ tests, run `pants --test-debug test ...` which will not
redirect I/O and will then work with `print()` and `breakpoint()`.

This will run both unit and integration tests. To run only the unit tests you can run:

```sh
pants --tag="-integration" test ::
# or
make test
```

#### Tests with coverage

To run the tests, and collect and print coverage information, run:

```sh
pants test --test-use-coverage ::
# or
make testcov
```

#### Integration tests

To run integration tests against real services, you need to run:

```sh
pants --tag="integration" test
# or
make testint
```

In order to pass down environment variables to the integration tests you have to use the `PANTS_TEST_EXTRA_ENV_VARS` environment variable.
For example, to pass down the `SHAREPOINT_USERNAME` environment variable you have to run the following command:

```sh
PANTS_TEST_EXTRA_ENV_VARS="['SHAREPOINT_PROJECT_SITE', 'SHAREPOINT_USERNAME', 'SHAREPOINT_PASSWORD']"
```

To run the Integration tests, you need to export and pass down the following additional environment
variables:

- `SHAREPOINT_PROJECT_SITE` (e.g. `https://sites.internal.company.com/sites/123456/`)
- `SHAREPOINT_USERNAME` (set to your user)
- `SHAREPOINT_PASSWORD` (set to your password)

### Building and packaging

To build [pex](https://pex.readthedocs.io/en/latest/index.html) files of the
autopilots, simply run

```sh
pants package ::
# or
make package
```

This will build all .pex files and store them in `dist/{PEX_NAME}` where
`{PEX_NAME}` consists of the name given in the `pex_binary()` target in the
`BUILD` files of the different autopilot apps.

You can execute them simply by calling them, e.g.

```sh
dist/apps.splunk-fetcher/splunk-fetcher.pex
```

## Concepts

### Status reporting and exit codes

For normal operations, the autopilot apps should always report their status
using JSON line data (at least with a `status` and `comment`).
Also, the exit code should be `0` for normal operations, even if the status is `FAILED`.
The exit code should be unequal to zero if something unexpected happened,
e.g. a network connection failed or a file could not be written due to IO errors.
In this case, a full stack trace should be displayed in addition to the
`FAILED` status and the `comment` about the error.

Logging can be used to provide additional messages that are not directly
related to the autopilot output, e.g. progress messages or non-critical
warnings. The log messages will be made available to the user in case
of non-zero exit codes.

In Python autopilots, normal errors can be raised as `AutopilotError` (defined
in `yaku.autopilot_utils.errors`) and in the CLI main function, those exceptions
can be distinguished from other non-expected exceptions, so that in one case the
error message can be printed as `comment` and in the other case, additionally
the stack trace can be printed.

See `apps/sharepoint-fetcher/src/yaku/sharepoint_fetcher/__main__.py` for an example.

### Logging

We are using [loguru](https://github.com/Delgan/loguru) for logging. This means
that you must _not_ use the standard `logging` module, but _always_ use:

```python
from loguru import logger
...
logger.info("Some log info about: {}", my_variable)  # no %-formatting allowed here!
```

### Releases

There is a GitHub workflow for publishing an app to Azure storage account.
The workflow can be found in [create-release.yml](./.github/workflows/create-release.yml).

It basically runs `pants package <app>`, removes the `.pex` file extension from
the PEX file and then uploads the PEX file to Azure.

## Integration with VS Code

### Preparation

VS Code doesn't know of Pants' isolated build environments, so you need to
manually export a virtualenv with all the dependencies so that VS Code can find
them.

Run `make vscode-integration`.

### Debugging

Pants supports [remote debugging for Python](https://www.pantsbuild.org/docs/python-run-goal#debugging).

To debug tests you can use the following steps:

1. **Set a breakpoint** in VS Code in your code, e.g. in a test file.
2. **Run the test via pants** and add the `--debug-adapter` argument, e.g.:

   ```sh
   pants test --debug-adapter apps/artifactory-fetcher/tests
   ```

3. **Connect VS Code** to the remote debugger. Press `<F5>` to launch the command
   defined in [launch.json](.vscode/launch.json).

To debug a function of an app, you can use the following steps:

1. **Set a breakpoint** in VS Code in your code
2. **Run the script via pants** and add the `--debug-adapter` argument, e.g.:

   ```sh
   pants run --debug-adapter apps/pdf-signature-evaluator/src/yaku/pdf_signature_evaluator/digital_signature_verification.py
   ```

3. **Connect VS Code** to the remote debugger. Press `<F5>` to launch the command
   defined in [launch.json](.vscode/launch.json).
