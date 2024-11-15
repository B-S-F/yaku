# Interfaces

The communication between the {{ PNAME }} service and the custom workflow
components (i.e. {term}`autopilots <autopilot>`) is defined by several
interfaces.

The following graphic illustrates the different interfaces:

```{mermaid}
flowchart LR
    subgraph c["Yaku Core"]
      direction LR
      appContext[ ]
      subgraph a["Autopilot Context"]
        a1["App"]
      end
      appOutput[ ]
    end
    subgraph ui["Web UI"]
    end
    envVars[ ] -- "<span class='text-turquoise'>Environment<br>Variables" --> c
    qgConfig[ ] -- "<span class='text-blue'>Configuration<br>File" --> c
    runVars[ ] -- "<span class='text-turquoise'>Run<br>Variables" --> c
    appContext -- "<span class='text-turquoise'>Files &<br>Environment<br>Variables" --> a
    a -- "<span class='text-turquoise'>JSON<br>Lines" --> appOutput
    c -- "<span class='text-purple'>QG Result File" --> ui[ ]

    class ui,a,c,a1 mermaid-no-fill
    class envVars,runVars,qgConfig,appContext,appOutput mermaid-hidden
```

The three most important interfaces are:

The <span class='text-blue'>Configuration File</span>
: This file defines the whole {term}`workflow` with all checks and autopilots.
  As new features are added to {{ PNAME }}, the file format might change.
  The latest format of the main config file, the {file}`qg-config.yaml` file, is
  explained in the chapter {doc}`../../core/configuration/main-config-file`.

The <span class='text-turquoise'>JSON Lines</span> interface
: This interface is used for outputs of an autopilot. The console output of an
  autopilot is parsed by Yaku Core. Yaku Core will then evaluate the status and the
  results of the autopilot. See the page on {doc}`./json-lines` for more details.

The <span class='text-purple'>QG Result File</span>
: This is a YAML file that contains all results from all checks in one single
  file. This file is used internally for displaying the run results in the
  user interface, or for converting the results into an HTML report.
  If you want to evaluate a workflow's result in some other context, e.g.
  in a CI/CD pipeline, you can access all necessary information from this file.
  You can find more information on the format of the result file
  in the chapter {doc}`./result/index`.

Furthermore, there are environment variables or configuration files which
provide the inputs for the {term}`autopilots <autopilot>`.
You can read more about environment variables in the chapter on
{doc}`../../core/environment-variables/index`.

## Subsections

```{toctree}
---
maxdepth: 1
---

json-lines
result/index
```
