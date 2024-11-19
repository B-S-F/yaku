<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Result File Schema

```{note}
This section is targeted at developers who want to further process the result
file. It explains the format of the workflow's result file.
```

The following documentation provides an overview of the QG result file.
This result file {file}`qg-result.yaml` can be found inside the evidence
zip file after a workflow run has completed.

## Result Schema Overview

The Result Schema is used to represent the output of an autopilot evaluation, containing information about various criteria, chapters, checks, and their statuses. The schema includes the following key components:

1. **Metadata:** Contains metadata of the result, such the current result version.

2. **Header:** Contains details about the project, such as project name, version, current date, and the version of the backend tools that are used.

3. **Statistics:** Includes statistics about the result, such as the total number of checks, automated checks, manual checks, unanswered checks, and percentages of automation and completion.

4. **Overall Status:** Represents the overall status of the evaluation, derived from the statuses of individual chapters.

5. **Chapters:** A collection of chapters, each containing requirements and checks.

6. **Finalize:** Information about the finalization step after the autopilot evaluations.

7. **Chapter:** Contains information about a specific chapter, including its title, text, status, and associated requirements.

8. **Requirement:** Represents a specific requirement, including its title, text, status, and associated checks.

9. **Check:** Contains details about a particular check, its title, type (autopilot or manual), status, and evaluation results.

10. **CheckResult:** Contains the result of a check, including the name of the autopilot, status, reason, a list of AutopilotResults, outputs, and execution information.

11. **AutopilotResult:** Represents the results of an autopilot evaluation, including the criterion, fulfillment status, justification, and metadata.

12. **ExecutionInformation:** Contains information about the execution of the autopilot, such as logs, error logs, evidence path, and exit code.

## Schema Elements

Below are detailed descriptions of each element in the Result Schema:

### Result

- **metadata** (object, required): [Metadata](#metadata) of the result.
- **header** (object, required): [Header](#header) of the result.
- **overallStatus** (string, required): Overall status of the result (composed of the statuses of chapters).
- **statistics** (object, required): [Statistics](#statistics) of the result.
- **chapters** (object, required): [Chapters](#chapter) containing [requirements](#requirement) and [checks](#check).
- **finalize** (object, required): Information about the [finalization step](#finalize) after the autopilot evaluations.

### Metadata

- **version** (string, required): The version of the result.

### Header

- **name** (string, required): Name of the project.
- **version** (string, required): Version of the project.
- **date** (string, required): Current date.
- **toolVersion** (string, required): Version of the used backend tools.

### Statistics

- **counted-checks** (integer, required): Number of total checks.
- **counted-automated-checks** (integer, required): Number of automated checks.
- **counted-manual-check** (integer, required): Number of manual checks.
- **counted-unanswered-checks** (integer, required): Number of unanswered checks.
- **degree-of-automation** (integer, required): Percentage of automated checks.
- **degree-of-completion** (integer, required): Percentage of answered checks.

### Chapter

- **title** (string, required): Title of the chapter.
- **text** (string, optional): Text of the chapter.
- **status** (string, required): Status of the chapter (composed of the statuses of requirements).
- **requirements** (object, required): [Requirements](#requirement) to answer the chapter.

### Requirement

- **title** (string, required): Title of the requirement.
- **text** (string, optional): Text of the requirement.
- **status** (string, required): Status of the requirement (composed of the statuses of checks).
- **checks** (object, required): [Checks](#check) to answer the requirement (referring to Check).

### Check

- **title** (string, required): Title of the check.
- **status** (string, required): Status of the check (derived from autopilot status).
- **type** (string, required): Type of the check (autopilot or manual).
- **evaluation** (object, required): Evaluation of the check containing the [result](#checkresult).

### CheckResult

- **autopilot** (string, optional): Name of the autopilot.
- **status** (string, required): Status of the autopilot.
- **reason** (string, required): Reason associated with the status.
- **results** (array of objects, optional): [Results](#autopilotresult) of the autopilot.
- **outputs** (object, optional): Outputs of the autopilot.
- **execution** (object, optional): [Execution information](#executioninformation) of the autopilot.

### AutopilotResult

- **criterion** (string, required): Criterion of the autopilot that was evaluated.
- **fulfilled** (boolean, required): Fulfilled flag of the criterion that was evaluated.
- **justification** (string, required): Justification of the criterion that was evaluated.
- **metadata** (object, required): Metadata of the criterion that was evaluated.

### ExecutionInformation

- **logs** (array of strings, optional): Logs from the execution of the autopilot.
- **errorLogs** (array of strings, optional): Error logs from the execution of the autopilot.
- **evidencePath** (string, required): Path where the evidence of the autopilot is stored.
- **exitCode** (integer, required): Exit code of the autopilot.

### Finalize

- **execution** (object, optional): Execution information of the finalize step (referring to ExecutionInformation).

## Example Result

An example result adhering to this schema:

```yaml
metadata:
  version: "v1"
header:
  name: "My Project"
  version: "0.1.0"
  date: "2023-08-03 16:16"
  toolVersion: "0.1.0"
overallStatus: "GREEN"
statistics:
  counted-checks: 2
  counted-automated-checks: 1
  counted-manual-check: 1
  counted-unanswered-checks: 0
  degree-of-automation: 50
  degree-of-completion: 100
chapters:
  chapter1:
    title: "Chapter 1"
    text: "This is Chapter 1"
    status: "GREEN"
    requirements:
      requirement1:
        title: "Requirement 1"
        text: "This is Requirement 1"
        status: "GREEN"
        checks:
          check1:
            title: "Check 1"
            status: "GREEN"
            type: "autopilot"
            evaluation:
              autopilot: "my-autopilot"
              status: "GREEN"
              reason: "This is my reason"
              results:
                - criterion: "Criterion 1"
                  fulfilled: true
                  justification: "This is my justification"
                  metadata:
                    foo: "bar"
                    baz: "qux"
              outputs:
                output1: "output_value"
              execution:
                logs:
                  - "Hello World"
                  - "This is my log"
                errorLogs:
                  - "Hello Error"
                  - "This is my error log"
                evidencePath: "/path/to/evidence"
                exitCode: 0
            check2:
                title: "Check 2"
                status: "GREEN"
                type: "manual"
                evaluation:
                    status: "GREEN"
                    reason: "This is my reason"
finalize:
  execution:
    logs:
      - "Finalization completed successfully"
    errorLogs: []
    evidencePath: "/path/to/evidence"
    exitCode: 0
```
