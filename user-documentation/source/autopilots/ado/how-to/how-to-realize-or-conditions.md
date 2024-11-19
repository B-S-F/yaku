<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# How to combine two checks with an 'OR'

## Introduction

This guide describes, how you can realize more complex condition checks, that require connecting multiple conditions with an `OR` instead of the default `AND`. For this example, we're reusing the use case from {doc}`../tutorials/ado-fetcher-evaluator-tutorial`, extending it with a second requirement. So the use case looks like the following:

Unclosed, epic work items with a **priority of 1 or 2** must:

- **not** be overdue
- **not** be unassigned

to return a `GREEN` status.

In case of a **priority of 3 or 4**, they only must:

- **not** be unassigned

to return a `GREEN` status.

You could try to tackle this problem by fetching all unclosed, epic work items and then define a check that follows a logic similar to that:

```yaml
(Priority == 1 || Priority == 2) && !isUnassigned && !isOverdue || (Priority == 3 || Priority == 4) && !isUnassigned
```

However, this is not possible since within one fetcher/evaluator config file, you're only able to pair different conditions with an `AND`.
So if you want to do something like in our use case, we need to split up the statement to get rid of the `OR` part. Subsequently, we can create a **distinct autopilot for each** of the two requirements, each of them processing a distinct config file:

1. The first one will fetch and check the items with priorities 1 & 2 and
2. the second autopilot fetches and checks the items with priorities 3 & 4.

Both autopilots will then create a report that can be added as evidence to the same question. Now, the overall result of the question will be `GREEN` in case both of the generated reports are `GREEN`. If one or both of the two reports are `RED`, the overall question will also have a `RED` status.

## Adjusting the config files

Let's start with setting up the two fetcher/evaluator config files before we adjust the qg-config.

### The first ado config

```{literalinclude} resources/or-conditions/ado-fetcher-evaluator-config-1.yaml
---
language: yaml
---
```

Here you can find the config file, corresponding to the first requirement.
The fetcher downloads all unfinished, epic work items with a priority of 1 or 2 and the evaluator verifies that they are not overdue and not unassigned.

### The second ado config

```{literalinclude} resources/or-conditions/ado-fetcher-evaluator-config-2.yaml
---
language: yaml
---
```

Here you can find the config file, corresponding to the second requirement.
The fetcher downloads all unfinished, epic work items with a priority of 3 or 4 and the evaluator verifies that they are not unassigned.

### The qg-config.yaml

In order to utilize both of those two config files now, you can just parameterize the autopilot in a second check:

```{literalinclude} resources/or-conditions/qg-config.yaml
---
language: yaml
emphasize-lines: 33,34,40,41
lineno-match:
---
```

The proper filenames need to be entered so that the two autopilots actually use the right configs (lines 33, 40) and access the proper files that the fetcher creates (lines 34 and 41).

## Resources

Find the full file, containing the code snippets here:

- {download}`qg-config.yaml <resources/or-conditions/qg-config.yaml>`
- {download}`ado-fetcher-evaluator-config-1.yaml <resources/or-conditions/ado-fetcher-evaluator-config-1.yaml>`
- {download}`ado-fetcher-evaluator-config-2.yaml <resources/or-conditions/ado-fetcher-evaluator-config-2.yaml>`
