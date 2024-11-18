# How to map issues and requirements

The configuration of the finalizer has to be specified in a configuration file which has to be available at runtime.
In this file you tell which issues are mapped to which qg requirement.

The Jira configuration file has the following structure:

```{literalinclude} ../resources/jira-finalizer-config.yaml
---
language: yaml
caption: "jira-finalizer-config.yaml"
---
```
