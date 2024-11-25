<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Using custom ILM properties

```{note}
Information Lifecycle Management (ILM) is a custom extension for SharePoint used by some customers. It can only be used for the on-premise SharePoint instances and it is not available from Microsoft by default.

```

## Introduction

This guide shows you how you can use custom properties (e.g. many of the properties used in Bosch SharePoint ILM are custom properties) in your config. Therefore, you need a triplet of property names. If you don't already know those three names, check {doc}`how-to-custom-props-get-names`.

## Adjusting the qg-config.yaml

You can simply go ahead and add those three names to the autopilot's environment variables that run the SharePoint fetcher and evaluator in the qg-config.yaml. The variable is called {envvar}`SHAREPOINT_FETCHER_CUSTOM_PROPERTIES`. You can pass it one or more name mappings, using the following syntax: `"custProp1Name1=>custProp1Name2=>custProp1Name3"` – note the double quotes. Multiple mappings can be applied by using a `|` in between them.

So adding the Revision Status custom property would look like the following:

```yaml
SHAREPOINT_FETCHER_CUSTOM_PROPERTIES: "RevisionStatusId=>RevisionStatus=>RevisionStatus"
```

## Adjusting the evaluator's config file

When applying custom mappings, you also need to take care of the property-name you're referencing in the check, defined in the config file of the evaluator. You can only provide the first or the second name, the third one won't work. If you use the first one, you're working with the integer values, if you use the second one, you're dealing with the resolved values. Therefore, you also need to change the value that is used for the check respectively. Here is an example:

The first option, using the first name with the integer:

```yaml
  rules:
    - property: 'RevisionStatusId'
      equals: "2"
```

The second option, using the second name with the resolved value:

```yaml
  rules:
    - property: 'RevisionStatus'
      equals: "Valid"
```

Both options actually do the same thing. However, since there can be multiple different integers referencing the same value, it probably never really makes sense to use the first name instead of the second one for custom properties. But in case you're interested, you can check all available numbers and their resolved values in the {file}`__custom_property_definitions__.json` file. It's stored in the evidence folder of the SharePoint autopilot, once you properly create the triplet and execute a run using the updated config. There you can e.g. see that two different numbers are both referencing `No Workflow`. So in this case you would probably rather want to reference the second name to avoid this problem.

```{figure} resources/custom-props-get-names/resolved-values-overview.png
:alt: Screenshot of the '__custom_property_definitions__.json' file, opened in the browser.
:class: image-stroke

Screenshot of the `__custom_property_definitions__.json` file, opened in the browser.
```
