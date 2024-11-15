# How to manage different configuration sources

## Introduction

Since the Docupedia Fetcher supports environment variables, CLI flags and configuration files as configuration sources, some simple examples for each variant are presented below. In addition, the user can mix and match the specified values so that one, two or all variants can be used simultaneously.

```{note}
When mixing and matching different types of configuration sources, be aware of [their precedence](../reference/docupedia-fetcher-reference.md#precedence-of-the-variables).
```

## Example with environment variables

In qg-config.yaml below, lines 12 and 13 are required.

```{literalinclude} resources/qg-config-source-env.yaml
---
language: yaml
linenos:
emphasize-lines: 12, 13
---
```

## Example with CLI flags

In qg-config.yaml below, line 9 is required.

```{literalinclude} resources/qg-config-source-cli.yaml
---
language: yaml
linenos:
emphasize-lines: 9
---
```

## Example with configuration file

In qg-config.yaml below, lines 9 and 12 are required.

```{literalinclude} resources/qg-config-source-config-file.yaml
---
language: yaml
linenos:
emphasize-lines: 9, 12
---
```

The CLI flag for the configuration file can be either `-c` or `--configFile`.

The configuration file would look like this:

```{literalinclude} resources/configFile.yaml
---
language: yaml
linenos:
---
```

```{note}
For this case, the DOCUPEDIA_PAT must be set via environment variables or CLI flags.
```

## Upload and run the config

You can now upload the config to the {{ PNAME }} service and run it.
You should then find the downloaded content in the evidence zip file.
