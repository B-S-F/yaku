# Finalizers

Finalizers are special types of autopilots used for post-processing like
generating reports, compressing evidence, or uploading result files. They take
{{ PNAME }} results and convert them into an arbitrary output format, e.g. html
or upload them to external systems like Jira. They can be defined within the
finalize section of a QG config file or, in some cases, of an autopilot script.

In order to use finalizers, add the `finalize section`.

```{code-block} yaml
finalize:
  run: |
    html-finalizer
```

```{toctree}
:maxdepth: 1
:hidden:

html/index
jira/index
sharepoint/index
```
