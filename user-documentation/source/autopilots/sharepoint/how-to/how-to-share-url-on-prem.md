# How to get the URL of a file or folder from on-premise SharePoint

## Introduction

This guide shows you how to obtain the URL of files and folders from on-premise SharePoint with the purpose of using it with the SharePoint Fetcher.
Below, you can find details about how the URL should look like, how to obtain it, and examples for cloud instances.

## Supported URL formats

The different share options within SharePoint can result in different URLs. The supported formats of the URL that you can use with the SharePoint Fetcher must contain some form of the _file or folder path_ of the instances you want to fetch.

### Examples of supported on-premise URLs

```{list-table}
:header-rows: 1
:name: Examples of supported URLs
:widths: 70 30

* - URL (with file/folder path)
  - Result
* - `https://sites.sharepoint.mycompany.com/sites/123456/Documents/
    FileTypes/Document.docx?d=w3c1d9786e7624a68910fde3aebf03055`
  - SharePoint-Fetcher will fetch the file 'Document.docx'
* - `https://sites.sharepoint.mycompany.com/sites/123456/Documents/
    SomeFile.txt`
  - SharePoint-Fetcher will fetch the file 'SomeFile.txt'
* - `https://sites.sharepoint.mycompany.com/sites/123456/Documents/
    Forms/AllItems.aspx?RootFolder=%2Fsites%2F123456%2FDocuments%2F
    FileTypes&FolderCTID=0x012000BC338E4EB6B0EC449F989D33D3C3F6EC&
    View=%7B42344837%2D3D01%2D4C43%2DA191%2D825AAA17E7B2%7D`
  - SharePoint-Fetcher will fetch the folder 'FileTypes'
```

### Examples of not supported on-premise URLs

```{list-table}
:header-rows: 1
:name: Example of not supported URLs
:widths: 70 30

* - URL (without file/folder path)
  - Result
* - `https://inside-share-hosted-apps.mycompany.com/DMS/
    GetDocumentService/Document.svc/GetDocumentURLdocumentID=P15S123456-1745658655-8362`

    `https://sites.sharepoint.mycompany.com/sites/123456/_layouts/15/
    guestaccess.aspx?guestaccesstoken=dejbHIYw58z6qmi2Ng%2fTX9AfFVtO
    atTuZiiqlIFJrkc%3d&docid=2_19fcb8105eb964addb3062463aaf19e4e&rev=1`
  - SharePoint-Fetcher cannot find file or folder based on document ID
```

## Getting the URL from on-premise SharePoint

In case of on-premise SharePoint the URL of a file will differ from the URL of a folder and are obtained in different ways.

### Files

The URL of on-premise SharePoint **files** will have a similar format to the following URL:
```https://sites.sharepoint.mycompany.com/sites/SiteName/SomeFolder/SomeFile.docx?d=w8fa7104af9f149d58f14db3aeff39b1f```

The URL of a file can be obtained as follows: open the document, click on the Share button, select the 'Copy link' option from the Share window.

```{figure} resources/how-to-share-url-on-prem/onprem_copy_link.png
:alt: Screenshot of the 'Copy link' button location for on-premise SharePoint instances
:class: image-stroke

'Copy link' button location for on-premise SharePoint instances: From inside the document select 'Copy link' under the Share option
```

If the opened document does not have a 'Share' option, such as in case of PDF documents, simple text documents and others, then the URL can be copied from the browser bar.

```{figure} resources/how-to-share-url-on-prem/onprem_copy_link_browser.png
:alt: Screenshot of the correct URL obtained from the browser
:class: image-stroke

The URL of files that do not have a 'Share' option (e.g.: PDF, .txt etc.) can be copied directly from the browser.
```

### Folders

The URL of on-premise SharePoint **folders** will have a similar format to the following URLs:
`https://sites.sharepoint.mycompany.com/sites/SiteName/Documents/Forms/AllItems.aspx?RootFolder=%2Fsites%2FSiteName%2FDocuments%2FSomeFolder&FolderCTID=0x012000BC338E4EB6B0EC449F989D33D3C3F6EC&View=%7B42344837%2D3D01%2D4C43%2DA191%2D825AAA17E7B2%7D`

`https://sites.sharepoint.mycompany.com/sites/123456/default.aspx?RootFolder=%2Fsites%2F123456%2FDocuments%2FSomeFolder&FolderCTID=0x012000BC338E4EB6B0EC449F989D33D3C3F6EC&View=%7B9006477E%2DE840%2D49A5%2DA2C4%2D306FEC0DB619%7D`

To obtain the folder URL, navigate to the desired folder and copy the URL from the browser bar.

```{figure} resources/how-to-share-url-on-prem/onprem_folder_url.png
:alt: Screenshot of a folder's URL obtained from the browser
:class: image-stroke

The URL of folders can be copied directly from the browser.
```
