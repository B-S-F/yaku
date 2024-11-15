# Run Variables

```{note}
This article describes what {term}`run variables` are, how you can use them in a
{file}`qg-config.yaml` file, and how they can be changed with every run.

Please note that run variables can currently only be used when triggering
a run through the REST API endpoint {http:post}`/api/v1/namespaces/{namespaceId}/runs`.
```

First we take a look at the definition and use-case of {term}`run variables`.
Afterwards we show you how to declare placeholders in the config file and
populate them with values when starting a new run.

## Definition and use-case

Usually, environment variables are used inside the {file}`qg-config.yaml` file
to provide parameters for autopilots. They are kind of static in a way that you
have to change the config file for changing their values.

However sometimes, a few of these variables need to be changed with every run.
Imagine a certain date tag, that should get inserted into the report.
Or the Git hash of the latest source code to be scanned.
Changing the config file for every run would not be a good solution.

For a better distinction from other uses of environment variables, we are
calling them {term}`run variables`.

```{glossary}
run variables
  variables which are provided during the API call for starting a
  new workflow run. They are specified inside the JSON body of the HTTP request.
  They can be used inside the config file as variables, e.g. `${{ vars.VAR_NAME }}`.
```

## How to use run variables

In the next two sections, we will look at how you can make use of run variables
in your configuration. This requires two steps:

1. {ref}`Declare placeholders in the config <declare-placeholders-in-the-config>`
2. {ref}`Send run variables via HTTP request <send-run-variables-via-http-request>`

(declare-placeholders-in-the-config)=

### Declare placeholders in the config

In order to provide a placeholder in the config file, you have to use the following syntax:

```{code-block} yaml
---
caption: Syntax of a placeholder
---
${{ vars.VAR_NAME }}
```

where `VAR_NAME` is the name of your {term}`run variable <run variables>`, which
will be used to replace the placeholder.

If you want to define a default value for the {term}`run variable <run variables>`, you can use the `default.vars` the following way:

```{code-block} yaml
---
caption: Adding a default value for a placeholder
---
[...]
header:
  name: My config
  version: ${{ vars.VERSION }}
default:
  vars:
    VAR_NAME: "default value"
env:
[...]
```

If you do not provide a value for the {term}`run variable <run variables>` in the default section and during the API call, the placeholder will be replaced by an empty string.

If you take a look at the following example, you will see that the placeholders
can be used in almost all parts of the config file. The limitation is that you
must not use them in a yaml key (which is the name left of a colon, e.g. `key: value`).

```{code-block} yaml
---
caption: Parts of a `qg-config.yaml` file with {term}`run variable <run variables>` placeholders
emphasize-lines: 4,6,15,17,21,22,25,28,32
---
[...]
header:
  name: My config
  version: ${{ vars.VERSION }}
env:
  SOME_ENV: ${{ vars.SOME_GLOBAL_ENV_VAR }}
[...]
autopilots:
  some-autopilot:
    run: |
      if [ -z "${SOME_ENV}" ] || [ -z ${SOME_OTHER_ENV} ]; then
        echo '{"status": "FAILED"}'
        exit 1;
      fi
      calls-some-command-here ${SOME_ENV} ${SOME_OTHER_ENV} ${{ vars.SOME_VARIABLE }}
    env:
      SOME_OTHER_ENV: ${{ vars.SOME_AUTOPILOT_ENV_REPLACER }}
[...]
chapters:
  "1":
    title: Release version ${{ vars.VERSION }} must be deployed
    description: The release version ${{ vars.VERSION }} must be deployed to production.
    requirements:
      "1":
        title: The api must return the version ${{ vars.VERSION }} when calling /api/version
        checks:
          "1"
            title: Retrieving the version from the api and comparing it with ${{ vars.VERSION }}
            automation:
              autopilot: get-version-autopilot
              env:
                EXPECTED_VERSION: ${{ vars.VERSION }}
[...]
```

(send-run-variables-via-http-request)=

### Send run variables via HTTP request

For the next step, we assume that you have already uploaded your config file with
the placeholders. For the POST request, you will also need the ID of the
configuration.

Use your favorite HTTP client and send the {term}`run variables` to the
{http:post}`/api/v1/namespaces/{namespaceId}/runs` endpoint.

The request body must contain the {term}`run variables` inside the
`environment` object:

```{code-block} json
---
caption: HTTP POST Request Body with extra run variables
---

{
  "configId": 123,
  "environment": {
    "VERSION": "1.0.0",
    "SOME_GLOBAL_ENV_VAR": "some value",
    "SOME_AUTOPILOT_ENV_REPLACER": "some other value",
    "SOME_VARIABLE": "another value"
  }
}
```
