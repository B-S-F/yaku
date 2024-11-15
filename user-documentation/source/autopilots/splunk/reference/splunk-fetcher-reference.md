# Splunk Fetcher Reference

## Environment variables

```{envvar} SPLUNK_HOST
The hostname of the Splunk server.
```

````{envvar} SPLUNK_PORT
The port number used to connect with the Splunk server.

**Default is 8089**

```{note}
Make sure you use the port value for the API not for the UI because the values may be different.
```
````

```{envvar} SPLUNK_USERNAME
A username that have access to the Splunk server
```

```{envvar} SPLUNK_PASSWORD
The password of the user.
```

````{envvar} SPLUNK_APP
The Splunk app that the fetcher will query data from.

```{note}
The app is a part of the URL, being identified by the `/app/SPLUNK_APP`path e.g. in `https://splunk.mycompany.com/en-US/app/your_splunk_app/search?...` the `SPLUNK_APP` is `your_splunk_app`.
```
````

```{envvar} SPLUNK_QUERY
The query that defines what data to fetch.
```

```{envvar} SPLUNK_FILE
A file that contains the Splunk query. This variable is ignored if you have the {envvar}`SPLUNK_QUERY` already set to define the query.
```

```{envvar} SPLUNK_OUTPUT_FORMAT
(Optional) The data format to be fetched from the Splunk server.

**Allowed values**:

- json
- csv

**Default is json**
```

```{envvar} SPLUNK_VALIDATE_RESULTS
(Optional) A flag to enable the validation of the fetched data. It verifies whether the number of locally retrieved results matches the data from the online source.
{WARNING} This flag is not available if the oneshot mode is enabled.
**Default is false**
```

````{envvar} SPLUNK_ONEQ_UPLOAD
(Optional) A flag to enable uploading fetched data to the OneQ server.
**Default is false**

```{note}
OneQ is a proprietary quality management tool. If you don't have access to it, you can safely ignore this variable.
```

````

```{envvar} SPLUNK_ONE_SHOT
(Optional) A flag to enable a one shot search. This means that the search is not dispatched, but executed immediately.
**Default is false**
```

```{envvar} SPLUNK_START_TIME
(Optional) The start time of the one shot search.
Check the [required syntax reference](http://labix.org/python-dateutil#head-a23e8ae0a661d77b89dfb3476f85b26f0b30349c)

**Default is `SPLUNK_END_TIME` - 1 day**
```

```{envvar} SPLUNK_END_TIME
(Optional) The end time of the one shot search.
Check the [required syntax reference](http://labix.org/python-dateutil#head-a23e8ae0a661d77b89dfb3476f85b26f0b30349c)

**Default is now**
```

```{envvar} SPLUNK_RESULT_FILE
(Optional) The name of the file to store the fetched data. The fetcher creates a file with this name in the evidence path.
```

## Command line options

The Splunk Fetcher is a small CLI that can be used to fetch data from Splunk via a search query.
It can be called in a {{ PNAME }} workflow with the {command}`splunk-fetcher` command.
The CLI of {command}`splunk-fetcher` offers the following options (see also {command}`splunk-fetcher --help`):

```{literalinclude} ../reference/resources/splunk-fetcher-command-description.txt
---
language: text
---
```

When calling the CLI, you need to have the {envvar}`evidence_path` environment variable set. Moreover, if you do not provide any options, you will be prompted afterwards to provide the app name, username and password.
