<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Autopilots

Autopilots are the workhorses of {{ PRODUCTNAME }}. Every automated check is performed
by a script and that script might use additional apps for special functionality
like fetching data from a website or inspecting special document formats like PDF.

For understanding the following pages, please take a look at the following term definitions:

````{glossary}
Autopilot
  Generic term for the automation of checks. It refers to an {term}`autopilot script`
  and some configurations like environment variables or additional config files.

Autopilot script
  A shell script code snippet which is written in the autopilot section of a
  QG config file. This code snippet implements the automatic check of a
  requirement or question and evaluates evidence data.

Autopilot app
  Usually a command line application, which is called from within an
  {term}`autopilot script`. Many autopilot apps are included in {{ PRODUCTNAME }}, see
  {ref}`autopilot-list` below.

  ```{code-block} yaml
  ---
  caption: Example of an autopilot script in the autopilot section of a QG config file
  emphasize-lines: 4-6
  ---
  autopilots:
    my-autopilot:
      run: |
        # here comes the autopilot shell script, for example:
        artifactory-fetcher
        pdf-signature-evaluator
      env:
        ARTIFACTORY_URL: ...
        ...
  ```

Autopilot result
  Every autopilot needs to return a structured result, which includes a status
  (e.g., RED, YELLOW, GREEN) and a reason for that status.
  Additionally, detailed results can be given by including criteria and their
  fulfillment status.
  The result data is transmitted as [JSON lines in the console output](../reference/interfaces/json-lines) of an autopilot.

Finalizer
  A command line application, which is called from within the finalize section of a QG config file or, in some cases, an autopilot script. They take {{ PNAME }} results and convert them into an arbitrary output format, e.g. pdf, zip, html or upload them to external systems like OneQ, Jira and more.
````

(autopilot-list)=

## List of autopilots

```{toctree}
:maxdepth: 1
:hidden:

ado/index
artifactory/index
defender-for-cloud/index
docupedia/index
filecheck/index
git/index
ilm/index
jira/index
json/index
manual-answer/index
mend/index
papsr/index
python-apps/index
pdf-signature/index
sharepoint/index
sonarqube/index
splunk/index
```

| Autopilot Apps                                 | Fetcher | Evaluator |
| ---------------------------------------------- | ------- | --------- |
| [Azure DevOps WorkItems](ado/index)            | x       | x         |
| [Artifactory](artifactory/index)               | x       |           |
| [Defender for Cloud](defender-for-cloud/index) | x       | x         |
| [Docupedia](docupedia/index)                   | x       |           |
| [Filecheck](filecheck/index)                   |         | x         |
| [Git](git/index)                               | x       |           |
| [ILM](ilm/index)                               |         | x         |
| [Jira](jira/index)                             | x       | x         |
| [JSON](json/index)                             |         | x         |
| [Manual Answers](manual-answer/index)          |         | x         |
| [PAPSR](papsr/index)                           | *       | *         |
| [PDF Signatures](pdf-signature/index)          |         | x         |
| [Sharepoint](sharepoint/index)                 | x       | x         |
| [SonarQube](sonarqube/index)                   | x       | x         |
| [Splunk](splunk/index)                         | x       |           |

(*) [PAPSR](papsr/index) can be used to implement both fetchers and evaluators.
