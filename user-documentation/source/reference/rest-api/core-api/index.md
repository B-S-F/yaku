# Core API Specification

You can find the OpenAPI YAML specification in the Swagger UI of your Yaku
instance. The Swagger UI is available at `/docs` on your Yaku instance. For
example, if your Yaku instance is available at `https://yaku-ui.mycompany.com`,
you can access the Swagger UI at `https://yaku-ui.mycompany.com/docs`.

```{warning}
The API only supports file uploads with utf8 encoding.

An exception is the {http:patch}`/api/v1/namespaces/{namespaceId}/configs/{configId}/config-from-excel` endpoint, where the `.xlsx` file is expected to be a binary Excel file.
```

```{eval-rst}
.. openapi:: openapi.yaml
    :group:
```
