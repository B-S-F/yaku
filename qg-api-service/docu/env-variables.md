# Environment Variables

Upon starting a new qg run using the `POST /namespaces/{namespaceId}/runs` endpoint, the QG API Service composes
environment variables from different sources and sends them to Argo by adding them to workflow spec in the script/env
section. There, they are subject to further processing in order to make them available to the scripts and applications
used within the qg run.

The scope of this document comprises the sources for the environment variables and their priority amongst each other.
Thus, further processing by Argo and other tools used within the subsequent process is not covered by this document.
This implies, that environment variables and values sent by the QG API Service may be ignored or overridden at a later
stage.

## Sources for Environment Variables

There are three sources for environment variables:

1. Defaults from QG API Service
2. Individual variables per Run

Defaults have the lowest priority and can be overridden by individual variables.

Overriding variables includes removing them, which can be achieved by overriding them with an empty string as value.

QG API Service reads the key/value pairs in the specified order and consolidates them in one JSON object. The
consolidated object is then forwarded to Argo.

### Defaults from QG API Service

If the QG API Service is deployed within a private cloud, it populates the environment variables with default values.
These values are partly read from the private cloud config, and partly hardcoded.

In the following table, the default environment variables are listed alongside their values:

| Name                | Value                              |
| ------------------- | ---------------------------------- |
| http_proxy          | $privateCloudConfig.proxy          |
| https_proxy         | $privateCloudConfig.proxy          |
| HTTP_PROXY          | $privateCloudConfig.proxy          |
| HTTPS_PROXY         | $privateCloudConfig.proxy          |
| no_proxy            | $privateCloudConfig.noProxyOn      |
| NO_PROXY            | $privateCloudConfig.noProxyOn      |
| REQUESTS_CA_BUNDLE  | /etc/ssl/certs/ca-certificates.crt |
| NODE_EXTRA_CA_CERTS | /etc/ssl/certs/ca-certificates.crt |
| SSL_CERT_FILE       | /etc/ssl/certs/BOSCH-CA-DE_pem.pem |
| HTTPLIB2_CA_CERTS   | /etc/ssl/certs/ca-certificates.crt |

### Individual Variables per Run

When calling the POST endpoint for starting a run, it is possible to add environment variables to the optional
`environment` section of the request body:

```json
{
  "configId": 123,
  "environment": {
    "ENV_VAR_1": "abc",
    "ENV_VAR_2": "123"
  }
}
```

As mentioned above, these variables override variables that have been defined in other places, like the 'qg-config.yaml' file. In order to ensure the correct overridding, the names of these variables are conveyed to the workflow execution engine.

## Example

Suppose the following values apply to the default environment variables. For the sake of brevity, only a subset
of the actual default variables is used:

`HTTP_PROXY=http://my.proxy:8080`
`HTTPS_PROXY=http://my.proxy:8080`
`NO_PROXY=localhost`

If the following request body is sent to `POST /namespaces/{namespaceId}/runs`:

```json
{
  "configId": 123,
  "environment": {
    "NO_PROXY": "localhost,127.0.0.1,internal.site",
    "OTHER_VARIABLE": "some other value"
  }
}
```

Then the request body sent to Argo will, among other values, contain:

```json
[
  {
    "name": "HTTP_PROXY",
    "value": "http://my.proxy:8080"
  },
  {
    "name": "HTTPS_PROXY",
    "value": "http://my.proxy:8080"
  },
  {
    "name": "NO_PROXY",
    "value": "localhost,127.0.0.1,internal.site"
  },
  {
    "name": "OTHER_VARIABLE",
    "value": "some other value"
  }
]
```
