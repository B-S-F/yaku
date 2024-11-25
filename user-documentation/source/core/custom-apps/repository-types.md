<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Repository Types

For now we only support one repository type: `curl`.
In the future, we will support a variety of repository types.

```{note}
Each repository type can have its own set of properties and configuration options. When you are editing the configuration file in the editor, the editor will not be able to provide code completion or syntax checking for the repository configuration. It will only be able to verify the type.
The actual configuration values will then be validated during runtime, when the repository plugin receives the configuration.
```

## Curl

The `curl` repository type allows you to download {term}`custom apps <custom app>` from a URL.
You can use placeholders in the URL to dynamically adjust the download path.
The allowed placeholders are:

- `{name}`: The name of the custom app.
- `{version}`: The version of the custom app.

An example configuration for a `curl` repository looks like this:

```{code-block} yaml
:emphasize-lines: 7-11

metadata:
  version: v1
header:
  name: My first QG config
  version: 1.0
repositories:
  - name: my-repository
    type: curl
    configuration:
      url:  https://example.com/folder-with-apps/{name}/{version}
      # if authentication is needed for the URL, see below for details
```

In this example, the custom app is downloaded from `https://example.com/folder-with-apps/{name}/{version}`.
The placeholders `{name}` and `{version}` are replaced with the actual name and version of the custom app, defined in the autopilot configuration.

### Authentication

If the URL requires authentication, you can provide the credentials in the `configuration` section of the repository configuration.
The allowed authentication methods are:

- `basic`: Basic authentication with a username and password.
- `token`: Token-based authentication.

#### Basic Authentication

For basic authentication, you need to provide the `username` and `password` in the `configuration` section.

```{code-block} yaml
:emphasize-lines: 11-14

metadata:
  version: v1
header:
  name: My first QG config
  version: 1.0
repositories:
  - name: my-repository
    type: curl
    configuration:
      url:  https://example.com/folder-with-apps/{name}/{version}
      auth:
        type: basic
        username: my_username
        password: my_password
```

#### Token Authentication

For token-based authentication, you need to provide the `token` in the `configuration` section.

```{code-block} yaml
:emphasize-lines: 11-13

metadata:
  version: v1
header:
  name: My first QG config
  version: 1.0
repositories:
  - name: my-repository
    type: curl
    configuration:
      url:  https://example.com/folder-with-apps/{name}/{version}
      auth:
        type: token
        token: my_token
```
