<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Getting Started with Docupedia Autopilot

## Introduction

The Docupedia Fetcher Autopilot is a tool that allows you to download the content along with the metadata of a Docupedia page. The fetcher will store in the evidence folder three types of content:

- a simple html file,
- a metadata file and
- a styled html version along with all its assets(images, css styles, fonts, js, etc).

## Preparation

### Docupedia Access Prerequisites

In order for the Autopilot to work properly, a Personal Access Token (PAT) with access to the requested Docupedia page is needed.

To obtain the PAT go to your Docupedia profile icon in the top-right corner of the page, select {guilabel}`Settings` and click on {guilabel}`Personal Access Tokens`. Click [here][RBDocupediaPAT] or go directly to your Docupedia URL e.g. `https://<your-docupedia-site>/confluence/plugins/personalaccesstokens/usertokens.action` to quickly generate your PAT.

```{warning}
The default value for the {envvar}`DOCUPEDIA_URL` points to a Bosch server and can only be accessed from within BCN (Bosch Corporate Network). If you are not located in the BCN, you must change this. An appropriate value would be an URL including the context. For example, `http://example.com:8080/confluence`, where `confluence` represents the context.
```

### Limitations

The Docupedia Fetcher is currently limited to Docupedia pages without restrictions. If the page is restricted, the fetcher will not be able to download the content. This is due to the fact that the Docupedia REST API does not allow to download the content of restricted pages.

### Adjust the environment variables

To configure the Docupedia Fetcher, you will need to set the following environment variables:

1. To obtain {envvar}`DOCUPEDIA_PAGE_ID` go to your Docupedia page, click on the 3 dots in the top-right corner, select {guilabel}`Page Information` and look at the number following `pageId=` in the URL.
2. Set {envvar}`DOCUPEDIA_PAT` to the PAT obtained at [the step above where you set up your Personal Access Tokens](#docupedia-access-prerequisites).

Optionally,

3. Set {envvar}`DOCUPEDIA_URL` in case you need a Docupedia URL including context. An example would be `http://example.com:8080/confluence`.
4. Set {envvar}`DOCUPEDIA_PAGE_DIFF_VERSIONS` in case you need to obtain the diff between two Docupedia page content versions. This should be represented by two numbers equal or less than 0(zero), separated by a comma.
5. Set {envvar}`DOCUPEDIA_PAGE_DIFF_DATE_THRESHOLD` in case you need to get a page version relative to a certain threshold. This should be in [ISO 8601-1:2019](https://www.iso.org/standard/70907.html) format representing Date and Time.
6. Set {envvar}`OUTPUT_NAME` to desired name of the output files. The default value is set to `docupedia_content`.
7. Set {envvar}`OUTPUT_PATH` to desired name of the output path. The default value is the current working directory.

For advanced use-cases you may configure:

8. To obtain {envvar}`DOCUPEDIA_SCHEME_ID`, go to your Docupedia page, open the {guilabel}`Network` tab in developer tools of your browser and clear the activity. Click on the 3 dots in the top-right corner and select {guilabel}`Export to HTML`. Select the request to `export-scheme` endpoint and in the response you get a list of scheme IDs. Use the desired {guilabel}`id` value from the list. The default value is set to `bundled_default` if no scheme is specified.
9. To obtain {envvar}`DOCUPEDIA_EXPORTER_ID`, look at the request parameters of the previous steps. The value is associated to `exporterId` request parameter. The default value is set to `com.k15t.scroll.scroll-html:html-exporter`.

## Adjust the config file

### The qg-config.yaml

Below is an example configuration file that runs Docupedia Fetcher. The autopilot is configured in lines: 7-15. Required environment variables are read from provided run environment variables or secrets. Then the autopilot is used by the check 1.1 in line 30 which is part of requirement 2.6.

In this example, a simple check is done in line 10, to check if the page was downloaded successfully.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-15, 30
---
```

[RBDocupediaPAT]: https://inside-docupedia.bosch.com/confluence/plugins/personalaccesstokens/usertokens.action
