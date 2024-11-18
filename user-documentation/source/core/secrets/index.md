# Secrets

## What is a secret?

```{glossary}
secret
  A secret is usually a password or token which is required to access external
  systems. For example if you want to fetch documents from an Artifactory
  server, you need an access token.

  Secrets should never be stored in plaintext in the config files, but provided as {term}`service secrets <service secret>`.

service secret
  Service secrets are being used to safely handle passwords and tokens that the
  autopilots require, without you having to write them as plain text into the
  config files. A service secret consists of three parts:

  1. The secret's **Name** is used as variable name under which the secret is
  made available to autopilot scripts. See {doc}`how-to-use-secrets`.

  2. For the **Description**, there are no rules, you can enter something that
  seems useful to you. E.g. you could write which service it's for, which
  fetcher/evaluator is using it etc. In case of a token you could state its
  expiration date or whatever else you think will be of interest for you.

  3. The **Value** contains the actual password or token that you want to add.
  Secret values are limited by size. The maximum size is configurable, default
  value for the maximum length is 8kb.
```

## Guides

```{toctree}
:maxdepth: 1

how-to-add-secrets
how-to-use-secrets
```
