# Fetcher Background Information

The fetcher gets the content along with the metadata of a Docupedia page via Confluence REST API, downloads and stores it in the evidence folder. The fetcher will store in the evidence folder three types of content:

- a simple html file,
- a metadata file and
- a styled html version along with all its assets(images, css styles, fonts, js, etc).

If configured, the fetcher will store additionally two types of content:

- a html diff file, and
- a json diff file

with content insertions and deletions between two versions.

```{note}
The current diff functionality limitation is that the json diff file only shows insertions and deletions of HTML tags content(e.g. no formatting, no attributes changes) and without any context(no line or column numbers).
```

## Prerequisites

Access for the Docupedia page in order for the fetcher to work is granted based on {envvar}`DOCUPEDIA_PAT`. Go to [Getting started with Docupedia Autopilot](../tutorials/docupedia-fetcher-tutorial.md#docupedia-access-prerequisites) for detailed instructions.

## Diff Versions Selection

The Fetcher diff functionality is enabled _only_ if {envvar}`DOCUPEDIA_PAGE_DIFF_VERSIONS` is set. The expected output files are {envvar}`OUTPUT_NAME``_diff.html` and {envvar}`OUTPUT_NAME``_diff.json` and are created regardless if there are any differences between selected Docupedia page content versions.

Valid values for {envvar}`DOCUPEDIA_PAGE_DIFF_VERSIONS` are two comma separated numbers equal or less than `0`(zero), e.g. `0,-1`.

Valid value for {envvar}`DOCUPEDIA_PAGE_DIFF_DATE_THRESHOLD` is an [ISO 8601-1:2019](https://www.iso.org/standard/70907.html) Date and Time, e.g. `1970-01-01T00:00:00.000Z` for January 1st, 1970 12:00:00 AM, Coordinated Universal Time(UTC)

When {envvar}`DOCUPEDIA_PAGE_DIFF_VERSIONS` is set to `offset1,offset2` then:

- If {envvar}`DOCUPEDIA_PAGE_DIFF_DATE_THRESHOLD` is set to [valid](https://www.iso.org/standard/70907.html) `datetime`:
  - `offset1` is based on latest version. i.e. `current = latest + offset1`
  - `offset2` is based on latest version _before_ `datetime`. i.e.`preceding = latest_before_datetime + offset2`
- Else
  - `offset1` and `offset2` are based on latest version. i.e. `current = latest + offset1` and `preceding = latest + offset2`

```{figure} resources/docupedia-version-selection.gif
Example of version selection with and without date threshold
```

## Environment variables

```{deprecated} 0.8.0
```{envvar} DOCUPEDIA_API_URL
(Optional) The rest api url for Docupedia. If not set, the default value is configured to use to the Bosch Docupedia. An example would be `http://example.com:8080/confluence/rest/api`.
```

```{envvar} DOCUPEDIA_PAGE_ID
To get the page id from a confluence page: go to the Docupedia page you want to get the content from, click on the 3 dots in the top-right corner and select `Page Information`. You can see the page id now in the URL e.g. `https://docupedia.site.com/confluence/pages/viewinfo.action?pageId=<your-page-id>`
```

```{envvar} DOCUPEDIA_SCHEME_ID
The mechanism used by the Docupedia Fetcher exports the content as an html file. The export scheme is used to format the html output, so the fetcher needs the ID of a valid scheme. The ID can be found in the last step of the export configuration.
```

```{deprecated} 0.8.0
```{envvar} DOCUPEDIA_USER
A valid user id for Docupedia access. Because it is deprecated, the value will be ignored.
```

```{envvar} DOCUPEDIA_PAT
This is the Docupedia PAT(Personal Access Token) to access Confluence API.
```

```{deprecated} 0.8.0
```{envvar} DOCUPEDIA_STYLED_PAGE_URL
(Optional) The rest url for fetching the Docupedia page with all the Bosch styling. It helps to get the data related to the Docupedia page as a zip folder. Because it is deprecated, the value will be ignored.
```

```{envvar} OUTPUT_NAME
(Optional) The output name of the fetched Docupedia content. The default value is {file}`docupedia_content`.
This would result in the outputs {file}`docupedia_content.html` and {file}`docupedia_content.json` created in the evidence folder.
```

```{envvar} OUTPUT_PATH
(Optional) The output path where the fetched Docupedia content is stored. The default value is the current working directory.
```

```{envvar} DOCUPEDIA_PAGE_DIFF_VERSIONS
(Optional) Two comma separated numbers equal or less than `0`(zero) representing the offsets for `current` and `preceding` Docupedia page content versions. The `preceding` Docupedia page version selection can depend on {envvar}`DOCUPEDIA_PAGE_DIFF_DATE_THRESHOLD`'s value.
```

```{envvar} DOCUPEDIA_PAGE_DIFF_DATE_THRESHOLD
(Optional) The Date and Time in [ISO 8601-1:2019](https://www.iso.org/standard/70907.html) format. If set, the {envvar}`DOCUPEDIA_PAGE_DIFF_VERSIONS`'s `preceding` offset is based on this value.
```

```{envvar} DOCUPEDIA_EXPORTER_ID
(Optional) The ID of the plug-in used to get the HTML exported schema for a Docupedia Page. The default value is `com.k15t.scroll.scroll-html:html-exporter`.
```

```{envvar} DOCUPEDIA_TIMEOUT
(Optional) This allows the user to configure a cut-off period for the Docupedia Fetcher. If the fetcher runs past this period of time, it will interrupt the fetching operations and autopilot's status will be set to `FAILED` with an appropriate message. The default value is `590`, representing the time in seconds.
```

```{envvar} DOCUPEDIA_URL
(Optional) This represents a Docupedia URL, including a context. For example, `http://example.com:8080/confluence`, where `confluence` represents the context.
```

## CLI Options

```{literalinclude} ../reference/resources/docupedia-fetcher-command-description.txt
---
language: text
---
```

## Config file

```{literalinclude} resources/docupedia-fetcher-config-file.yaml
---
language: yaml
linenos:
---
```

```{note}
In case of using the Config file, either the {envvar}`DOCUPEDIA_PAT` environment variable or the CLI flag `--token` must be set.
```

## Precedence of the variables

The Docupedia Fetcher supports CLI flags, environment variables, and configuration files given as configuration source, but it also provides default values for certain variables. Given this context, there is a specific order that determines which value takes precedence over others when several of them are set.
The order is CLI > ENV > CONFIG > DEFAULT VALUES.
For instance, if a value is provided as a CLI flag, it overrides any corresponding value set in the environment variables. At the same time, if a value is set in the environment variables, it takes precedence over any matching value from the configuration file. Moreover, if none of the above values are provided, the default values are used.
