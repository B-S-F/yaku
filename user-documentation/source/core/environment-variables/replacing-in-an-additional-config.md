# How to use environment variables in extra config files

In the QG config file and all referenced config files, you can use environment
variables to make your configuration more flexible. This article describes how
you can reference environment variables in an extra configuration file, e.g. an
extra YAML file.

## Syntax

As described in {doc}`./index`, environment variables
are replaced basically everywhere _inside the main configuration file_.

For _extra config files_, the syntax is identical, so you can reference
environment variables in the config file using the syntax `${{ env.<name> }}`.

As a config file might be used in different autopilots, but with different
variable values, it is necessary to declare a config file inside an
autopilot configuration section. See below for an example.

```{attention}
You must add the extra config file to the list of `config` files for the
autopilot.

If you don't do this, none of the variable placeholders will be replaced!
```

## Example

Let's assume the following:

* There is an extra config file {file}`other-config.yaml`.
* Inside this config file, we are using the environment variable `MY_VARIABLE`.
* The variable `MY_VARIABLE` is defined in the main {file}`qg-config.yaml` file.

The extra config file uses the normal syntax for referencing environment variables:

```{code-block} yaml
---
caption: "Contents of file {file}`other-config.yaml`"
---
config-value: ${{ env.MY_VARIABLE }}
```

Inside the main config file, the variable `MY_VARIABLE` is defined as
global environment variable and the `some-autopilot` section contains
an `config` entry for the file {file}`other-config.yaml`:

```{code-block} yaml
---
caption: Excerpt of {file}`qg-config.yaml` file
emphasize-lines: 10
---
...
env:
  MY_VARIABLE: "some value"
autopilots:
  some-autopilot:
    run: |
      cat config.yaml
    config:
      # The extra config file MUST be listed here!
      - other-config.yaml
...
```

The output of the autopilot will then be:

```text
config-value: some value
```

If you forget the `config:` section above, the output will be:

```text
config-value: ${{ env.MY_VARIABLE }}
```

```{note}
Please be aware of the order of precedence: `check` > `autopilot` > `global`. The extra config will be attached to an autopilot and you can reference environment variables of all scopes with precedence in this order.

See also: {ref}`environment-variable-scopes`
```
