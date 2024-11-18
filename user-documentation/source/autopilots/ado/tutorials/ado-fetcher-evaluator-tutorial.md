# Getting started with Azure DevOps autopilot

## Introduction

With the ado fetcher and evaluator, you can fetch tickets/work items from an ado project of your organization and subsequently check, whether their properties meet certain conditions. This Tutorial gives an introduction to the Ado fetcher and evaluator and demonstrates how you can configure them. To understand this guide, it is important that you have already completed the {doc}`../../../onboarding`.

For this tutorial, we're using the following example use case:

* We want to evaluate `Epic` work items which aren't finished/done yet.
* For a priority of 1 and 2, they must neither be overdue, nor unassigned to return a `GREEN` status.

You can follow along this tutorial in two different ways:

1. If **you have access to an ado project**, just use that one.
2. In case **you do not have access** to any ado projects, you can upload an additional file and then still successfully run the example. What exactly you're required to do for that will be explained later. The beginning will be relevant for everyone.

## Download resources

Please go ahead and download the following files. They will be required in the subsequent steps.

* {download}`qg-config.yaml <resources/qg-config.yaml>`
* {download}`ado-fetcher-evaluator-config.yaml <resources/ado-fetcher-evaluator-config.yaml>`
* {download}`workItems.json <resources/workItems.json>` (only download this if you don't have access to ado)

## Adjusting the config files

### The Ado fetcher and evaluator config file

Unlike other fetcher/evaluator combinations, the ado-fetcher and ado-evaluator share a common config file. Feel free to have a look at the downloaded {file}`ado-fetcher-evaluator-config.yaml` file first, to get an overview of it. Subsequently, we we will go over the file's parts, step by step.

The fetcher requires the query you can find below.

```{literalinclude} resources/ado-fetcher-evaluator-config.yaml
---
language: yaml
lines: 1-2
lineno-match:
---
```

The query in line two is written in WIQL and is being used to fetch the required work items from the ado project of your choice. (You will set the project that should be used later on in the environment variables). Here, we're fetching all items which are declared as `Epic` for their category and are in state `To Do` or `Doing`, and have a priority of 1 or 2 assigned to them. All of the downloaded work items are subsequently taken into consideration for evaluation.

See the [official WIQL documentation](https://learn.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax?view=azure-devops) if you want to find out more about writing your own queries.

In the next step, you need to define which properties/fields you require from your tickets in azure for the evaluation process.

```{literalinclude} resources/ado-fetcher-evaluator-config.yaml
---
language: yaml
lines: 3-5
lineno-match:
---
```

In this case, we require the `Assigned To`, the `State` and the `Target Date` property for our check, so we list them in the required fields. Since `State` is part of the [default list](../reference/ado-evaluator-reference.md#default-list), it doesn't need to be specified. Beware that you must use [camelCase](https://en.wikipedia.org/wiki/Camel_case) (with an initial lowercase!) to reference the property names. So for example, `Target Date` (as it's spelled in the web interface of ado) becomes `targetDate`.

Next up, we're going to specify some settings for the evaluator.

```{literalinclude} resources/ado-fetcher-evaluator-config.yaml
---
language: yaml
lines: 6-11
lineno-match:
---
```

In line 8, you need to state the name of the field that defines the `Due Date` of a ticket. Also, you need to enter the terms that are used to label `work items` which should be considered as being closed in the `closedStates`, depending on the exact terms your tickets use.

Now that we have specified the items that the checks are executed on and the evaluator is set up, we can take care of configuring what the evaluator should actually check for.

```{literalinclude} resources/ado-fetcher-evaluator-config.yaml
---
language: yaml
lines: 12-19
lineno-match:
---
```

In line 15, you can set a name for the first check that you want to define. Below comes the name of the field which is being evaluated in this check. The property you enter here needs to be part of either the `neededFields` or the `default list`. The next keyword follows in line 18, where you can set the condition type. In this case we're using `resolved` to check, whether the due date is in the past. Since we don't want to check for any specific value, we can simply use an empty string as the reference value. If you need more information on that, please see: {doc}`../reference/ado-evaluator-reference`.

We continue by defining the second condition we need, in order to match our use case's requirements.

```{literalinclude} resources/ado-fetcher-evaluator-config.yaml
---
language: yaml
lines: 20-24
lineno-match:
---
```

The second check uses the same logic as before. Here, we can use the condition type `illegal` so we get a `RED` status in case the property isn't defined.

Congratulations, we're all set with the config file for the ado-fetcher and -evaluator now. Of course, you could also define further checks if you want to. Note that the different checks are always connected with a logical `AND`. If you want to learn more about realizing more complex conditions, check {doc}`../how-to/how-to-realize-or-conditions`. However, make sure to finish this tutorial first.

Now that we have configured the fetcher and evaluator, we need to adjust the {file}`qg-config.yaml` so that they are being used to provide evidence for the desired question. Additionally, we need to provide the required environment variables to the fetcher and evaluator.

```{note}
If you don't have access to an ado project of your own, skip the next step and jump to {ref}`alternative-qg-config`.
```

### The qg-config.yaml

```{literalinclude} resources/qg-config.yaml
---
language: yaml
lines: 7-8
lineno-match:
---
```

First of all, you need to take care of the two lines 7, 8 above and exchange them with their respected values directly in the file. State the ado organization and the project name you want the items to be fetched from.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
lines: 16
lineno-match:
---
```

Next, go ahead and create a personal access token for ADO. To generate a new personal access token, click on the {guilabel}`User settings` icon in the top right corner of Azure Devops, select {guilabel}`Personal access tokens`, then select {guilabel}`New Token`. Give the token `Read, write & manage` access to work items of the project. You don't need to grant any other permissions. Add the token as a secret to the {{ PNAME }} secrets endpoint. If you need help with that, check out: {doc}`../../../core/secrets/how-to-add-secrets`.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
lines: 38-39
lineno-match:
---
```

In case you want to change the filename of the fetcher/evaluator's config file, you also need to adjust the statement in line 39. In line 40, you can define the name of the file that the fetcher creates, containing all the matching work items from the query.

## Running the example

Now, you can run the example. Upload the config file for the fetcher and evaluator, using the same name as given in line 39 as well as the {file}`qg-config.yaml`.

Before executing a run, go ahead and create some applicable work items in your ado project to test the config with.

(alternative-qg-config)=

## Running the example without Azure DevOps access

Using the ado-fetcher requires access to ado, using the ado-evaluator does not. So what you can do instead of running the fetcher is uploading the {file}`workItems.json` file you've downloaded in the beginning. It contains a couple of work items in the same format that the ado-fetcher would store them locally after fetching them. By following the subsequent steps, you can tell the ado-evaluator to use that file and it will work as if the ado-fetcher had been run ordinarily.

```yaml
7   # ADO_API_ORG: team-neutrinos
8   # ADO_API_PROJECT: playground
```

Comment out line number 7 and 8.

```yaml
9      autopilots:
10        ado-work-items-autopilot:
11          run: |
13            # ado-work-items-fetcher
14            ado-work-items-evaluator
15      # env:
16          # ADO_API_PERSONAL_ACCESS_TOKEN: ${{ secrets.ADO_API_PERSONAL_ACCESS_TOKEN }}
```

Comment out line 13, 15 and 16 in the autopilot section.

If you want to, you can have a look at the {file}`workItems.json` file. It contains example work items, formatted as json objects. Their titles suggest, if and why they should fail or not. Of course, you can also have a look at the `targetDate` and `assignedTo` properties to see and understand their actual values.

Now, you can run the example. Upload the config file for the fetcher and evaluator, using the same name as given in line 39 as well as the {file}`qg-config.yaml`. Additionally upload the {file}`workItems.json` file.

In the end, your result should like like that:

```{figure} resources/report-screenshot.png
:alt: Screenshot of the qg-full-report.html opened in the browser
:class: image-stroke

Screenshot of the {file}`qg-full-report.html`, opened in the browser
```
