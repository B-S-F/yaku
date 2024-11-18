# Setting up custom property mappings

## Introduction

Custom properties in SharePoint (like those used in the proprietary ILM SharePoint extension) need to be treated differently than normal file properties, as they are linked internally to a list of possible values.

This guide will demonstrate how you can get the three different names that need to be assigned to the {envvar}`SHAREPOINT_FETCHER_CUSTOM_PROPERTIES` variable in case you want to use custom properties.

```{note}
In case you're looking for the _Revision Status_ or the _Work On Status_ property, here's your quick solution:

Just set the {envvar}`SHAREPOINT_FETCHER_CUSTOM_PROPERTIES` variable to
`"RevisionStatusId=>RevisionStatus=>RevisionStatus|WorkOnStatusId=>WorkOn Status=>WorkOnStatus"`
```

If you already have the triplet mapping and want to know how you can use them in your config, have a look at: {doc}`how-to-custom-props-config`.

If you're looking for other custom properties, simply follow the steps described below.

## Getting the first name

Look for the desired key name in the downloaded properties file {file}`your_doc_file_name__properties__.json`. You'll find it in the evidence folder of the respective autopilot after completing a run. The property name there might already differ from the one you'll find in the web interface. Also, the value might be different. Instead of a term found in the web interface like "Valid", you could find an integer there. For example in the Browser we have a property called `Status` with the value `Valid`. In the downloaded file, the same property is called `RevisionStatusId` and contains a value of `2`. Figuring out which name from the file belongs to which name from the web interface can be a bit difficult sometimes. Once you figured that out, you've found your first required name. So for our example, the first name would be `RevisionStatusId`.

```{figure} resources/custom-props-get-names/1st-name.png
:alt: Screenshot of the 'my_doc__properties__.json' file, opened in the browser.
:class: image-stroke

Screenshot of the {file}`my_doc__properties__.json` file, opened in the browser.
```

## Getting the second name

Adjust the first part of the following link to use your desired SharePoint site and open it: `https://some.sharepoint.server/sites/123456/_api/web/Lists/`. There, go ahead and use the find in page functionality to help you find the name you're looking for. Enter `Title>YOUR_SEARCH_TERM` as the string it should search for and play around with the `YOUR_SEARCH_TERM`. In our case, we tried it with `Title>Revision` and found `<d:Title>RevisionStatus</d:Title>`, that's the structure you're looking for. If the term between the tags sounds promising to you, note it down. So our second name is `RevisionStatus`.

```{figure} resources/custom-props-get-names/2nd-name.jpg
:alt: Screenshot of the file retrieved from the URL given above, opened in the browser.
:class: image-stroke

Screenshot of the file retrieved from the URL given above, opened in the browser.
```

## Getting the third name

Again, adjust the following link to use the right SharePoint site and of course also adjust `RevisionStatus` with the name you found in the previous step: `https://some.sharepoint.server/sites/123456/_api/web/Lists/GetByTitle('RevisionStatus')/items(1)`. Use the find in page functionality to help you find the next name you're looking for. Enter `d:YOUR_SEARCH_STRING` and again, play around with the search term. We've simply used `d:Revision` again and found `<d:RevisionStatus>Draft</d:RevisionStatus>`. This time, you'll find the name you're looking for in the tags at the beginning and the end. In between the two, you have one of the human-readable names/possible values of the overall property. So our third name is `RevisionStatus`. In this case, this is the same as the second name, but for other properties all three names are different.

```{figure} resources/custom-props-get-names/3rd-name.jpg
:alt: Screenshot of the file retrieved from the URL given above, opened in the browser.
:class: image-stroke

Screenshot of the file retrieved from the URL given above, opened in the browser.
```

If you now want to know how you can use the mapping in your own config, have a look at: {doc}`how-to-custom-props-config`.
