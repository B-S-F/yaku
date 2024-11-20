<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Filecheck

The `filecheck` app can be used for simple checks like testing if a file...

* ...exists
* ...is empty
* ...is not empty
* ...is smaller than a maximum size
* ...is larger than a required size

The benefit of this app is that it outputs the result of the check in the
correct format so that {{ PNAME }} understands it and can parse it properly.

```{code-block} bash
---
caption: Simple usage example for the filecheck app
---
filecheck exists 'ProjectPlan.pdf'
filecheck size --min 100000  'ProjectPlan.pdf' # must be larger than 100k bytes
```

## How-Tos

```{toctree}
:maxdepth: 1

how-to/file-existence-check
how-to/file-size-check
```
