# How to get Diff between two Docupedia Page Versions

## Introduction

The Docupedia Fetcher can be configured to produce the diff between two Docupedia page content versions. The result is stored in the evidence folder as a simple html file and a json file which contain insertions and deletions.

The expected output files are {envvar}`OUTPUT_NAME``_diff.html` and {envvar}`OUTPUT_NAME``_diff.json`.

## Adjust the qg-config.yml file

1. Start with the example configuration file from {doc}`../tutorials/docupedia-fetcher-tutorial`
2. Add the diff environment variable, shown at line 15. By setting {envvar}`DOCUPEDIA_PAGE_DIFF_VERSIONS` to `0,-1` the Fetcher will produce the diff between latest and previous Docupedia page version.
3. For demonstration purposes, we will just output a GREEN status in line 10. Usually, you would make use of an evaluator here to check the downloaded Docupedia data for some expected properties.

```{literalinclude} resources/qg-config-diff-basic.yaml
---
language: yaml
linenos:
lineno-match:
start-at: autopilots
end-before: finalize
emphasize-lines: 5, 10
---
```

## Upload and run the config

You can now upload the config to the {{ PNAME }} service and run it.
You should then find the downloaded diff information in the evidence zip file.
