<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Implicit Global Environment Variables

Whenever a QG run is executed, a set of implicit environment variables is
provided to the autopilot scripts. This article explains what the different
sources for those environment variables are and if and how you can modify them.

## Sources for Environment Variables

There are three sources for environment variables:

1. Defaults from QG API Service
2. Variables set in qg-config.yaml
3. Individual variables per Run
4. Secrets

The QG API Service comes with a set of default environment variables, e.g. for
proxy settings and SSL file locations. These defaults have the lowest priority
and can be overridden by variables set in the {file}`qg-config.yaml` file. These
in turn can be overridden by variables which are specified in a run request.
Individual variables can be overridden by secrets, and secrets will never be
overridden.

Overriding variables includes removing them, which can be achieved by overriding
them with an empty string as value.

### Default variables

Depending on the server instance and its network configuration, there might be
one or more of the following environment variables:

`http_proxy`, `https_proxy`, `HTTP_PROXY`, `HTTPS_PROXY`, `no_proxy`,
`NO_PROXY`, `REQUESTS_CA_BUNDLE`, `NODE_EXTRA_CA_CERTS`, `SSL_CERT_FILE`,
`HTTPLIB2_CA_CERTS`

Usually, those variables should _not_ be modified, as this will very likely
break some network connections.

### Individual Variables per Run

When calling the {http:POST}`/api/v1/namespaces/{namespaceId}/runs` endpoint for
starting a new QG config run, it is possible to add environment variables to the
optional `environment` section of the request body, for example:

```{code-block} json
---
caption: HTTP Request Body Example for POST of a new run
---

{
  "configId": 123,
  "environment": {
    "ENV_VAR_1": "abc",
    "ENV_VAR_2": "123"
  }
}
```

As mentioned above, these variables provided in the `environment` section
override variables that have been defined in other places, like the
{file}`qg-config.yaml` file.

## Example

Suppose the following values apply to the default environment variables. For the
sake of brevity, only a subset of the actual default variables is used:

```bash
HTTP_PROXY=http://my.proxy:8080
HTTPS_PROXY=http://my.proxy:8080
NO_PROXY=localhost
```

Further assume that the following secrets were created in the user's namespace:

```bash
SECRET_1=abc123
SECRET_2=def456
```

And finally assume that the current QG config file uses those variables, e.g.:

```yaml
[...]
autopilots:
  http-query-autopilot:
    run: |
      echo "Uses ${MY_HTTPS_PROXY} as proxy unless prohibited by no_proxy: ${MY_NO_PROXY}"
    env:
      MY_HTTPS_PROXY: ${{ env.HTTPS_PROXY }}
      MY_NO_PROXY: ${{ env.NO_PROXY }}
  another-secret-autopilot:
    run: |
      echo "First secret: ${FIRST_SECRET}. Second secret: ${SECOND_SECRET}"
    env:
      FIRST_SECRET: ${{ secrets.SECRET_1 }}
      SECOND_SECRET: ${{ secrets.SECRET_2 }}
  some-simple-autopilot:
    run: |
      echo "Here is ${SOME} thing and here is ${OTHER} thing."
    env:
      SOME: ${{ env.SOME_VARIABLE }}
      OTHER: ${{ env.OTHER_VARIABLE }}
[...]
```

If the following POST request body is sent to {http:post}`/api/v1/namespaces/{namespaceId}/runs`:

```json
{
  "configId": 123,
  "environment": {
    "NO_PROXY": "localhost,127.0.0.1,internal.site",
    "SECRET_1": "new secret value",
    "OTHER_VARIABLE": "some other value"
  }
}
```

Then, the service will replace environment variables so that the internally used
config will look like this:

```yaml
[...]
autopilots:
  http-query-autopilot:
    run: |
      echo "Uses ${MY_HTTPS_PROXY} as proxy unless prohibited by no_proxy: ${MY_NO_PROXY}"
    env:
      MY_HTTPS_PROXY: "http://my.proxy:8080" # from default variables
      MY_NO_PROXY: "localhost,127.0.0.1,internal.site" # from POST request body
  another-secret-autopilot:
    run: |
      echo "First secret: ${FIRST_SECRET}. Second secret: ${SECOND_SECRET}"
    env:
      FIRST_SECRET: "abc123" # secret - cannot be overwritten by POST request
      SECOND_SECRET: "def456" # secret - cannot be overwritten by POST request
  some-simple-autopilot:
    run: |
      echo "Here is ${SOME} thing and here is ${OTHER} thing."
    env:
      SOME: ${{ env.SOME_VARIABLE }} # SOME_VARIABLE is not defined - this would result in an error
      OTHER: "some other value" # from POST request body
[...]
```
