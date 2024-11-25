<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# How to get Diff between two Docupedia Page Versions based on Threshold

## Introduction

As an extension to [getting a diff between two page versions](./how-to-get-diff.md),
the Fetcher can be configured to get a page version relative to a certain date threshold.

For example, you want to verify that a page was modified after a certain date. You
could now configure the fetcher to compare the latest page version (offset `0`) with
the latest one _before a certain date threshold_ (still offset `0` but with an extra
date threshold set).

## Adjust the qg-config.yml file

1. Take the config file from {doc}`./how-to-get-diff`.
2. Insert line 15 (see below) with the {envvar}`DOCUPEDIA_PAGE_DIFF_DATE_THRESHOLD`.
   If both {envvar}`DOCUPEDIA_PAGE_DIFF_DATE_THRESHOLD` and
   {envvar}`DOCUPEDIA_PAGE_DIFF_VERSIONS` are set, the Fetcher will produce the
   diff between latest Docupedia page version and the previous one _before_ the
   set {envvar}`DOCUPEDIA_PAGE_DIFF_DATE_THRESHOLD` value. In the case below, it
   will be the most recent page version just before end of January 2023.

```{literalinclude} resources/qg-config-diff-threshold.yaml
---
language: yaml
linenos:
lineno-match:
start-at: autopilots
end-before: finalize
emphasize-lines: 10, 11
---
```

## Upload and run the config

You can now upload the config to the {{ PNAME }} service and run it.
You should then find the downloaded diff information in the evidence zip file.
