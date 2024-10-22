# html-finalizer

## Setup

As developer, use turbo to install and setup entire mono-repo.

## How to use

### Run

Inputs are read via environment variables and listed below.

```shell
html-finalizer
```

The finalizer will generate following files:

- qg-result.html: An overview report that contains a list of all requirements and their final status. The status of a requirement depends on the status of its underlying checks.
- qg-evidence.html: This report contains a detailed list of all checks and components and their status. It also contains links to the generated output folder of each run in evidence folder so they could be accessed.
- qg-dashboard.html: A graphical overview that shows statics of the current run.
- qg-full-report.html: A file that contains the three previous html reports.

### Env

#### result_path

The path of the evidence folder provided by the qg cli

- string

#### [optional] HIDE_UNANSWERED

If this environment is provided and set to true, all unanswered questions will be hidden in the html result.

- boolean

## How to update integration tests snapshots

To update the snapshot file of the integration tests, run the following command in the app folder:

```shell
npx vitest --config vitest-integration.config.ts
```

You'll get the following message:

```shell
Tests failed. Watching for file changes...
       press u to update snapshot, press h to show help
```

Press **u** to update the snapshot file, then press **q** to quit.
