<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Using secrets

After you have [created a secret in the service](./how-to-add-secrets) you can
use it in the QG config.

Make sure that you know what the secret's name is. You'll need this information below. For illustration, we are using the name `MY_SECRET` here.

## In an autopilot script

1. Find out the environment variable name used by the autopilot to retrieve the secret. For this example, we will refer to the variable as `AUTOPILOT_VARIABLE`.

    ```{note}
    The available environment variables for autopilots are usually described in the autopilots' reference documentation: see {doc}`../../autopilots/index`.
    ```

1. Create an `env` section in the autopilot script definition.
    Define an environment variable (i.e. `AUTOPILOT_VARIABLE`)
    and put your secret (i.e. `MY_SECRET`) down as value:

    ```{code-block} yaml
    :emphasize-lines: 5-6

    autopilots:
      my-sample-autopilot
        run: |
          ...
        env:
          AUTOPILOT_VARIABLE: ${{ secrets.MY_SECRET }}
    ```

  ```{note}
  Please be aware that you can also use secrets at other places in the config file. However, this is not recommended because there is a risk that the secrets will be exposed in the result of the QG run. This is also the reason why secrets are not allowed in referenced config files.
  ```
