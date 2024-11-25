<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Creating secrets

You can add a {term}`service secret` via the interface of your choice, either
[via the Web UI](add-secret-via-web-ui) or [via the REST API](add-secret-via-rest-api).

(add-secret-via-web-ui)=

## Via the Web UI

1. Open the [Web UI](https://portal.bswf.tech/)
2. In the left sidebar, click on the keys icon (if you expand the sidebar first,
   the name of this icon will be {guilabel}`Secrets`).
   A new browser window will open.

    ```{figure} resources/how-to-add-secrets/web-ui-1.png
    :width: 100%
    :alt: Screenshot showing where to find the Secrets button in the Web UI.
    :class: image-stroke

    Screenshot showing where to find the Secrets button in the Web UI.
    ```

3. Click on {guilabel}`Create Secret` on top of the page to open the popup dialog.
4. Fill out the required fields accordingly (see image below).
5. Click on {guilabel}`Create Secret` in the popup dialog to create and save your new secret.

    ```{figure} resources/how-to-add-secrets/web-ui-2.png
    :width: 100%
    :alt: Screenshot of the Secret popup in the Web UI.
    :class: image-stroke

    Screenshot of the Create Secret popup dialog in the Web UI.
    ```

(add-secret-via-rest-api)=

## Via the REST API

There is full support for managing secrets in our REST API.
See the section on secrets in our API description: {http:get}`/api/v1/namespaces/{namespaceId}/secrets`.

## Via the Swagger UI

```{todo}
Write a tutorial/howto for authentication in Swagger and link below.
```

1. Authenticate yourself in the Swagger UI of your Yaku UI instance.
2. Head to the {http:post}`/api/v1/namespaces/{namespaceId}/secrets` endpoint.
3. Click on the row to expand it.
4. Click the {guilabel}`Try it out` button.
5. Enter the id of the namespace you want to add the secret to.
6. Fill out name, description and value of the secret in the request body field

    ```{figure} resources/how-to-add-secrets/api.png
    :width: 100%
    :alt: Screenshot of the POST secrets endpoint in the Swagger UI.
    :class: image-stroke

    Screenshot of the POST secrets endpoint in the Swagger UI.
    ```

7. Click on {guilabel}`Execute`.
