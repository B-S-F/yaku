# Upload a folder

The cli can be used to upload a folder to sharepoint.
This includes all files and sub folders recursively.
The folder will be uploaded to the Sharepoint instance specified by the environment variable {envvar}`SHAREPOINT_PROJECT_SITE`.
Authentication is done using the environment variables {envvar}`SHAREPOINT_USERNAME` and {envvar}`SHAREPOINT_PASSWORD`.
The folder will be uploaded to the path specified by the `--sharepoint-path` option.
The `--sharepoint-path` option is relative to the root of the Sharepoint instance and does always start with `Documents` (e.g. `Documents/my-results-folder`).
Make sure that the path exists before uploading a folder to it, otherwise the upload will fail.
This can be used to e.g. upload the complete run result of an Automated Software Release to a Sharepoint folder.

The `sharepoint upload-folder` command offers the following options:

```{literalinclude} resources/sharepoint-cli-upload-folders-description.txt
---
language: text
---
```

The environment variables are the same as for the `sharepoint upload-files` command.
In order to use the uploader in your qg configuration, make sure to add the mandatory environment variables, arguments and options.
This is a complete example of a qg configuration using the `sharepoint` cli to upload the run result to a Sharepoint instance:

```{literalinclude} resources/qg-config-upload-folder-finalize.yaml
---
language: yaml
---
```
