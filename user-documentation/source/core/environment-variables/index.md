# Environment Variables

```{glossary}
environment variable
  Environment variables are usually used to define the _context of a computer process_.
  They are defined by a variable _name_ and a _value_. These environment variables
  are then made available to a computer process.

  In {{ PNAME }}, especially in the {file}`qg-config.yaml` file, environment
  variables can be used to alter the way how a certain {term}`autopilot script`
  behaves.

  While environment variables usually define the _environment_ in which a
  particular process runs, they can be defined and used in many different places
  inside a QG config file, not just close to the script in which they are used.
```

## Autopilot Parameters

The most common use is to **provide parameters to an autopilot** by specifying some
environment variables in the `env` section of an autopilot definition, or in the global
`env` section, e.g.

```{code-block} yaml
---
caption: Example of global and local environment variables in autopilots
---
env:
  GLOBAL_VAR: World

autopilots:
  # This autopilot prints "Hello World"
  hello-world-autopilot:
    run: |
      echo "${{ env.LOCAL_VAR }} ${{ env.GLOBAL_VAR }}"
    env:
      LOCAL_VAR: Hello

  # This autopilot prints "Goodbye World"
  goodbye-world-autopilot:
    run: |
      echo "${{ env.LOCAL_VAR }} ${{ env.GLOBAL_VAR }}"
    env:
      LOCAL_VAR: Goodbye
```

```{note}
You can find a list of environment variables for the different autopilot apps on
the [Index page](../../genindex.md).
```

## Secrets

Another example is the use of **environment variables for secrets**, for example when
an autopilot requires sensitive data like login credentials.

```{warning}
You should **never** store passwords, tokens, or other credentials in the config file.
Instead, store those credentials always as [secrets](../secrets/index)!
```

Most programs and apps will read credentials only from environment variables and not
from command line arguments. For this, you can reference the secret in the
environment variable definition:

```yaml
my-sensitive-autopilot:
  run: |
    download-something  # uses MY_SECRET internally by reading the environment variable
  env:
    MY_SECRET: ${{ secrets.SECRET_NAME }}  # as defined in the secret store
```

For more information on secrets, see {doc}`../secrets/how-to-add-secrets` and
{doc}`../secrets/how-to-use-secrets`.

## Advanced Topics

```{toctree}
:maxdepth: 1

scope-of-env-vars
replacing-in-an-additional-config
global-environment
```
