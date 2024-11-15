# Sharepoint Uploader

The `sharepoint` cli can be used to upload files or folders to an on-premise Sharepoint instance.
For example it could be used for postprocessing the results of an Automated
Software Release and upload them to a Sharepoint folder.

Thereby the `sharepoint` cli provides following commands:

```{literalinclude} resources/sharepoint-cli-description.txt
---
language: text
---
```

## How-Tos

```{toctree}
:maxdepth: 1

how-to/upload-files
how-to/upload-folder
```

## Environment Variables

```{envvar} SHAREPOINT_PROJECT_SITE
The URL of the Sharepoint instance to upload to. For example https://mycompany.sharepoint.com/sites/my-site
(required, string)
```

```{envvar} SHAREPOINT_USERNAME
The username to use for authentication.
(required, string)
```

```{envvar} SHAREPOINT_PASSWORD
The password to use for authentication.
(required, string)
```

```{envvar} SHAREPOINT_FORCE_IP
This variable is only required in case of a broken DNS configuration.
See {envvar}`SHAREPOINT_FETCHER_FORCE_IP` for more information.
(optional)
```

```{envvar} LOG_LEVEL
The log level to use for logging. Possible values are "INFO" and "DEBUG".
If you need to debug your run, set this to "DEBUG".
(optional, default: "INFO", string)
```
