<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Upload files

The cli can be used to upload files to sharepoint.
The files will be uploaded to the Sharepoint instance specified by the environment variable  {envvar}`SHAREPOINT_PROJECT_SITE`.
Authentication is done using the environment variables  {envvar}`SHAREPOINT_USERNAME` and  {envvar}`SHAREPOINT_PASSWORD`.
The files will be uploaded to the path specified by the `--sharepoint-path` option.
The `--sharepoint-path` option is relative to the root of the Sharepoint instance and does always start with `Documents` (e.g. `Documents/my-results-folder`).
Make sure that the path exists before uploading files to it, otherwise the upload will fail.

The `sharepoint upload-files` command offers the following options:

```{literalinclude} resources/sharepoint-cli-upload-files-description.txt
---
language: text
---
```

In order to use the uploader in your qg configuration, make sure to add the mandatory environment variables, arguments and options.
This is a complete example of a qg configuration using the `sharepoint` cli to upload files to a Sharepoint instance:

```{literalinclude} resources/qg-config-upload-files.yaml
---
language: yaml
---
```
