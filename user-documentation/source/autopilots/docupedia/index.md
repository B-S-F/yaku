<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Docupedia

```{note}
Docupedia is an alias for the Confluence wiki on-premise product by Atlassian.
```

If you need to collect and check wiki pages that contain new release information before releasing the new software version, the Docupedia autopilot can do that for you!

The fetcher gets the content along with the metadata of a Docupedia page via Confluence REST API, downloads and stores it in the evidence folder. Additionally, it can be configured to also store a diff between two Docupedia page versions.

## Tutorials

```{toctree}
:maxdepth: 1

tutorials/docupedia-fetcher-tutorial
```

## How-Tos

```{toctree}
:maxdepth: 1

how-to/how-to-manage-configuration-sources
how-to/how-to-get-diff
how-to/how-to-get-diff-threshold
how-to/how-to-timeout
```

## Reference

```{toctree}
:maxdepth: 1

reference/docupedia-fetcher-reference
reference/docupedia-fetcher-metadata
```
