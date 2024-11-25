<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# SharePoint Fetcher Background Information

The fetcher makes a request against the SharePoint REST API, downloads all the specified files and folders present inside the directory and saves it to the evidence path. The evidence path is set during the execution of a run and read as an environment variable by the sharepoint-fetcher.

```{note}
The SharePoint Fetcher currently supports Kerberos authentication for the on-premise SharePoint instances and authentication via the use of an app registration to access OAuth-protected sites at `mycompany.sharepoint.com` for the cloud instances!
```

## Prerequisites

For the on-premise SharePoint, the user id that is set for the fetcher in {envvar}`SHAREPOINT_FETCHER_USERNAME` must have access to the project site and defined project directory in order for the fetcher to work.

For the cloud SharePoint, the AAD Registration app needs to have all the permissions in place so that the data can be fetched from the SharePoint sites. For more information on how you can set up the App Registration, please check {doc}`../how-to/how-to-auth-cloud-sharepoint`.

## Environment variables

Considering fetching data from both on-premise and cloud SharePoint instances requires the use of different environment variables, for simplicity, we are going to split the variables into variables used by both fetch processes and also specific ones.

```{attention}
Make sure to include all the mandatory environment variables for your use case (both common and specific mandatory variables)!
```

### Common environment variables

```{attention}
For the SharePoint Fetcher, you must include either the `SHAREPOINT_FETCHER_PROJECT_URL` environment variable or together the `SHAREPOINT_FETCHER_PROJECT_SITE` and `SHAREPOINT_FETCHER_PROJECT_PATH` environment variables.
```

```{envvar} SHAREPOINT_FETCHER_PROJECT_URL

(Optional) This variable contains the full URL of the SharePoint file or folder you want to download.
The correct format of the URL should include the project site and file/folder path.
For more information about the URL and how to obtain it please visit {doc}`../how-to/how-to-share-url-cloud` or {doc}`../how-to/how-to-share-url-on-prem`.

```{note}
Please note that the `SHAREPOINT_FETCHER_PROJECT_URL` environment variable takes precedance over the `SHAREPOINT_FETCHER_PROJECT_SITE` and `SHAREPOINT_FETCHER_PROJECT_PATH` environment varibales.
Therefore, it is recommended to primarily use the URL.
```

```{envvar} SHAREPOINT_FETCHER_PROJECT_SITE

(Optional) This variable contains the URL of the SharePoint site from which you want to download some files.
(Note: a SharePoint URL consists of two parts: first comes the site URL, followed by the path to the actual file or folder. The path part is stored in the `SHAREPOINT_FETCHER_PROJECT_PATH` variable, whereas the site part is stored in this variable).

The site URL usually follows the following pattern:
 - for on-premise instances: `https://{hostname}/sites/{site}/`, for example https://sites.inside-share2.org.com/sites/1234567/
 - for cloud SharePoint instances: `https://mycompany.sharepoint.com/sites/{site}/`, for example https://mycompany.sharepoint.com/sites/msteams_5xxxxxx5/

The site link must be given in the correct format as shown above because the internal logic depends on it.
```

```{envvar} SHAREPOINT_FETCHER_PROJECT_PATH

(Optional) This variable contains the path to the folder inside SharePoint which contains the files you want to fetch, e.g.,
`Documents/fossid-tools-report-ok/`.

The first part of this path contains the name of the root folder of your SharePoint site. Usually, this is `Documents` for on-premise and `Shared Documents` for cloud instances, but check the URL to your file if you are unsure.

If you want to download only a single file, you can specify the file path instead of its parent directory.

If the given path ends with a slash (`/`), it is assumed that the path points to a directory.
If it doesn't end with a slash, the argument is assumed to point to a single file.

```{envvar} SHAREPOINT_FETCHER_IS_CLOUD
(Optional) If this variable is set to `True`, `true` or `1` the connection to a cloud SharePoint instance is possible. If set to `False`, `false` or `0` the SharePoint fetcher will work with an on-premise instance.

```

```{envvar} SHAREPOINT_FETCHER_DESTINATION_PATH / SHAREPOINT_FETCHER_OUTPUT_DIR
(Optional) Both names can be used interchangeably and have the same effect. This variable specifies the path to the destination folder where the fetcher should save the downloaded content. By default, the value is set to the current working directory.
```

```{envvar} SHAREPOINT_FETCHER_CONFIG_FILE
(Optional) This variable contains the path to the config file of the fetcher. This config file is optional. You can find more information below in the section {ref}`sharepoint-fetcher-config-file`.

```

```{envvar} SHAREPOINT_FETCHER_FILTER_CONFIG_FILE
(Optional) This variable contains the path to the filter config file of the fetcher. Unlike in most other cases, this config file is optional. You can find more information below in the section {ref}`sharepoint-fetcher-filter-config-file`.

```

```{envvar} SHAREPOINT_FETCHER_DOWNLOAD_PROPERTIES_ONLY
(Optional) If you are not interested in the files' contents but only in their properties, you can save resources and bandwidth by only downloading file properties and not the files themselves. However, beware that you can not evaluate files, if you haven't downloaded them. The properties file on its own is not sufficient for that.

Simply set this variable to "1" or "true" to disable file downloading.
```

````{envvar} SHAREPOINT_FETCHER_FORCE_IP
(Optional) In case the name resolution of the SharePoint site is faulty, you can override
the DNS name resolution by providing a custom IP address which will then be used
instead of the DNS-resolved IP address for the given hostname.

For example, if the SharePoint site is at `https://my.sharepoint.site/sites/`
(with IP address `1.2.3.4`), but the DNS server reports a faulty `9.9.9.9`, you
can set `SHAREPOINT_FETCHER_FORCE_IP=1.2.3.4` which will then cause the
SharePoint fetcher to get data from `https://1.2.3.4/sites/...` instead of
`https://9.9.9.9/sites/...`.

```{note}
Sometimes it is also required to define `no_proxy=1.2.3.4` so that the
connection to `1.2.3.4` is not routed through the default proxy server, which
might then route the request over some external network.
```

In {doc}`../tutorials/sharepoint-fetcher-and-evaluator-on-premise`, you can find more information on finding out about IP addresses of different SharePoint sites.
````

### On-premise SharePoint environment variables

```{envvar} SHAREPOINT_FETCHER_USERNAME
This variable contains the username of the account that is used to access the SharePoint server.
```

```{envvar} SHAREPOINT_FETCHER_PASSWORD
This variable must contain the password of the user given in {envvar}`SHAREPOINT_FETCHER_USERNAME`.
```

```{note}
The above information is required for Kerberos authentication to SharePoint on-premise servers.
```

```{envvar} SHAREPOINT_FETCHER_CUSTOM_PROPERTIES
(Optional) SharePoint supports custom properties for files and folders. Examples are things like _Confidentiality Class_ or _Workflow Status_.
For these properties, an enum of values exists, stored in a SharePoint List.

For example, a list with title `RevisionStatus` for a custom property `Revision Status` could have values like `Valid` or `Draft`.
The API URL for accessing this list and its items would be similar to this one:

`https://some.sharepoint.server/sites/144287/_api/web/Lists/GetByTitle('RevisionStatus')/items`

If you want to retrieve the custom properties with human-readable titles instead of some weird integer IDs, you need to provide a mapping from the list title to the title property of the list items which contains the human-readable names.

You need to provide three names:

1. The name of the file/folder property. E.g. `WorkOnStatusId`.
2. The name of the SharePoint list belonging to this custom property. E.g. `WorkOn Status`.
3. The name of the property which contains the list item title. E.g. `WorkOnStatus`.

These three names are then bundled into one mapping, e.g. `"WorkOnStatusId=>WorkOn Status=>WorkOnStatus"`. You can combine multiple mappings by separating them via `|` character.

If you want to find out how you can get those names, check {doc}`../how-to/how-to-custom-props-get-names`.
```

### Cloud SharePoint environment variables

```{envvar} SHAREPOINT_FETCHER_TENANT_ID
This variable contains the value for the Directory (tenant) id for the Azure Active Directory Registration App.
```

```{envvar} SHAREPOINT_FETCHER_CLIENT_ID
This variable contains the value for the Application (client) id for the Azure Active Directory Registration App.
```

```{envvar} SHAREPOINT_FETCHER_CLIENT_SECRET
This variable contains the value for the client secret created in the Azure Active Directory Registration App.
```

```{note}
The above information is required for the OAuth to access cloud-protected SharePoint sites.
```

```{attention}
Do not forget to set the {envvar}`SHAREPOINT_FETCHER_IS_CLOUD` variable to "True" in order to fetch data from cloud SharePoint instances, otherwise the fetcher will want to fetch data from on-premise and won't work properly!
```

(sharepoint-fetcher-config-file)=

## The fetcher's config file

The purpose of a configuration file is to gather all the settings needed for the fetcher to operate correctly in a single file, rather than using multiple environment variables. The configuration file must follow YAML syntax and consist of `variable: value` pairs.

The content of the file uses a naming convention derived from the corresponding environment variables. For example, the environment variable {envvar}`SHAREPOINT_FETCHER_IS_CLOUD` would be written as `is_cloud` in the configuration file.

Regarding precedence, environment variables take priority over configuration variables from the file. For instance, if the configuration file has the variable `project_site` with the value `https://mycompany.sharepoint.com/sites/123`, but the environment variable {envvar}`SHAREPOINT_FETCHER_PROJECT_SITE` is set to `https://mycompany.sharepoint.com/sites/456`, the autopilot will fetch data from the site specified by the environment variable.

It looks like the following:

```{literalinclude} resources/fetcher-config.yaml
---
language: yaml
---
```

```{attention}
The example above contains all the possible variables. You do not need to include all of them in your configuration file, only those that are relevant to your use case. Make sure to include all mandatory variables when fetching from an on-premise or cloud SharePoint instance!
```

```{note}
For more information about the logic behind each file variable, refer to the corresponding environment variable description.
```

(sharepoint-fetcher-filter-config-file)=

## The fetcher's filter config file

By default, all of the files, specified in the {envvar}`SHAREPOINT_FETCHER_PROJECT_PATH`, are going to be downloaded. However, instead of downloading all of the files, it is also possible to only select/filter for certain files, based on filename patterns or SharePoint properties.

The content of the filter config file is similar to what the SharePoint Evaluator expects.

It looks like the following:

```{literalinclude} resources/fetcher-filter-config.yaml
---
language: yaml
---
```

## Example config

You can find a complete example configuration here:

- for on-premise instances: {doc}`../tutorials/sharepoint-fetcher-and-evaluator-on-premise`.
- for cloud instances: {doc}`../tutorials/sharepoint-fetcher-and-evaluator-cloud`.
