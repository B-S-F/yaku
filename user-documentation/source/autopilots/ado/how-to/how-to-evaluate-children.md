# How to evaluate child work items

## Introduction

This guide describes, how you can take child items into consideration for the evaluation of ado tickets/work items. The use case for this example looks like the following:

Epic work items, which are **not** in state "Done" must:

- **not** be overdue
- **not** have any related work items (children) which are **not** in state "Done" **and** overdue

to return a `GREEN` status.

## Adjusting the config files

### The ado fetcher/evaluator config

```{literalinclude} resources/children/ado-fetcher-evaluator-config.yaml
---
language: yaml
start-at: children
lineno-match:
---
```

Simply prepend the lines 20-24 before defining the checks you want to be executed for the `related work items` (children) of all of the items, fetched by the query of the file. Starting from line 25, you can define your desired checks, following the same principle as for the "regular" checks.

## Resources

Find the full file, containing the code snippets here:

- {download}`ado-fetcher-evaluator-config.yaml <resources/children/ado-fetcher-evaluator-config.yaml>`
