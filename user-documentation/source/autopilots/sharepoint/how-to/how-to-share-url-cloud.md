<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# How to get the URL of a file or folder from cloud SharePoint

## Introduction

This guide shows you how to obtain the URL of files and folders from cloud SharePoint with the purpose of using it with the SharePoint Fetcher.
Below, you can find details about how the URL should look like, how to obtain it, and examples for cloud instances.

## Supported URL formats

The different share options within SharePoint can result in different URLs. The supported formats of the URL that you can use with the SharePoint Fetcher must contain some form of the _file or folder path_ of the instances you want to fetch.

The URL of files and folders on cloud SharePoint will have a similar format to the following URL: \
`https://mycompany.sharepoint.com/:w:/r/sites/SiteName/Shared%20Documents/SomeFolder/SomeFile.docx?d=wab34894xxxxxxxxxxxxxxxxxxxxxx811&csf=1&web=1&e=DbAidp`

Notice that after the `SiteName` follows the path `Shared%20Documents/SomeFolder/SomeFile.docx` that identifies the file.

```{Note}
You do not need to worry about the URL encoded characters inside the URL, such as the `%20` representing a whitespace in the above example.
You can use the URLs copied from SharePoint as they are.
```

### Examples of supported cloud URLs

```{list-table}
:header-rows: 1
:name: Examples of supported URLs
:widths: 70 30

* - URL (with file/folder path)
  - Result
* - `https://mycompany.sharepoint.com/:w:/r/sites/msteams_5xxxxxx5/
    Shared%20Documents/FileTypes/Document.docx?d=wcf572efef7754
    f72a122143bcd4659a6&csf=1&web=1&e=UfxAZp`
  - SharePoint-Fetcher will fetch the file 'Document.docx'
* - `https://mycompany.sharepoint.com/:f:/r/sites/msteams_5xxxxxx5/
    Shared%20Documents/General?csf=1&web=1&e=pGzsrm`
  - SharePoint-Fetcher will fetch the folder 'General'
```

### Examples of not supported cloud URLs

```{list-table}
:header-rows: 1
:name: Example of not supported URLs
:widths: 70 30

* - URL (without file/folder path)
  - Result
* - `https://mycompany.sharepoint.com/:f:/s/msteams_5xxxxxx5/
    Ets0EmnPuWRKkFWBlaR5FH0B7fGwmFL4VVFcDScwLpk5aQ?e=fDxsSw`

    `https://mycompany.sharepoint.com/:w:/r/sites/msteams_5xxxxxx5/_layouts/
    15/Doc.aspx?sourcedoc=%7B6494D8AF-718F-44CD-9F6E-25A813D18A9C%7D&
    file=file%20with%20%23.docx&action=default&mobileredirect=true`
  - SharePoint-Fetcher cannot find file or folder based on document ID
```

## Getting the URL on cloud SharePoint

The URL of a file or folder inside the cloud SharePoint can be obtained through the {guilabel}`Copy link` button.
This button is reachable in multiple ways, as shown below:

- You can either directly right-click on a file or select it from the options menu marked by the three-dot icon

  ```{figure} resources/how-to-share-url-cloud/cloud_copy_link_option1.png
  :alt: Screenshot of the 'Copy link' button location on cloud SharePoint
  :class: image-stroke

  'Copy link' button location on cloud SharePoint: Right click on document or three-dot icon
  ```

- Or you can select a file and click {guilabel}`Copy link` from the Menu bar

  ```{figure} resources/how-to-share-url-cloud/cloud_copy_link_option2.png
  :alt: Screenshot of the 'Copy link' button location on cloud SharePoint
  :class: image-stroke

  'Copy link' button location on cloud SharePoint: select the document and click 'Copy link' from the Menu bar
  ```

- If you have opened a file already, click on the {guilabel}`Copy link` under the Share options (only for files)

  ```{figure} resources/how-to-share-url-cloud/cloud_copy_link_option3.png
  :alt: Screenshot of the 'Copy link' button location on cloud SharePoint
  :class: image-stroke

  'Copy link' button location on cloud SharePoint: From inside the document select 'Copy link' under the Share option
  ```

- Or if you want to get the URL for a folder, like the first two bulletpoints above, look for the {guilabel}`Copy link` button.

  ```{figure} resources/how-to-share-url-cloud/cloud_copy_link_folder.png
  :alt: Screenshot of the 'Copy link' button location on cloud SharePoint
  :class: image-stroke

  'Copy link' button location on cloud SharePoint: Select the folder and click 'Copy link' from the Menu bar or from the options menu marked by the three-dot icon.
  ```
