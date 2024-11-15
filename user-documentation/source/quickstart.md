# Quickstart Tutorial

## Introduction

Welcome to your first interaction with {{ PRODUCTNAME }}. This tutorial is intended to give you a simple first impression of what working with the service feels and looks like. It should also give you an idea of what you can achieve with the service.
In the following steps, you are going evaluate a document and check, whether it has been updated within the last year or not. This information is then used to answer a certain question of the QG catalogue. In the end you will get a report, showing you the question and its result.

So let's get started!

## Open the UI

Have a look at the UI of {{ PRODUCTNAME }} that you can find under the following link:
<https://portal.bswf.tech/>

There you can see an overview of all the different configurations that are currently stored in your namespace. Make sure you have selected the right namespace and environment. Pick the combination according to where you want the example to be executed at. Depending on the service's installation, multiple environments might be available, i.e. public cloud, on-premise.

```{figure} resources/quickstart/config-overview-yaku-ui.png
:alt: Screenshot of the Configuration Overview Screen in the Web UI
:width: 100%
:class: image-stroke

Screenshot of the Configuration Overview Screen in the {{ PNAME }} UI
```

## Download the required files

- Please continue by downloading the following files:

  - [qg-config.yaml](./resources/quickstart/qg-config.yaml)
  - [sharepoint-evaluator-config-file.yaml](./resources/quickstart/sharepoint-evaluator-config-file.yaml)
  - [example-document.txt](./resources/quickstart/example-document.txt)
  - [example-document.txt.\_\_properties\_\_.json](./resources/quickstart/example-document.txt.__properties__.json)

```{ytvideo} https://www.youtube.com/watch?v=ltReFSeTG5U
```

## Create a new configuration

You will now create a new configuration according to the needs of our use case, based on the {file}`qg-config.yaml` file. This file is the heart of automating your release process.

- Click {guilabel}`Create Configuration`
- Select {guilabel}`Start with an existing YAML file`
- Choose the {file}`qg-config.yaml` file you've just downloaded

## Set up the configuration

The {file}`qg-config.yaml` file references a couple of other files that you need to upload now, for example the document that we want to evaluate along with some further configuration files.

- On the new page, click the {guilabel}`+ Add files` button on the left
- Select the other three files you've downloaded (you can select all of them at once)
- Click {guilabel}`Save & Execute Test Run`

## Read the results

You are now on the run overview screen. A run that's using the configuration you've just created, was already started. The table shows all runs that were previously executed in your namespace.

- Wait for the icon on the left at the top of the table turn from the arrows (the run is still running) to a green circle (the run was finished successfully and the overall result is `GREEN`)
- As soon as it's green, click on the download {guilabel}`Evidence` button when hovering over the respective row
- Find the file in your local computer's downloads folder and extract it
- Open the {file}`qg-result.html`

This is what it should look like:

```{figure} resources/quickstart/report-screenshot.jpg
:alt: Screenshot of the qg-result.html opened in the browser
:width: 100%
:class: image-stroke

Screenshot of the {file}`qg-result.html`, opened in the browser
```

Here you can find the question 4.6 which is defined in the {file}`qg-config.yaml` and the result from the check we ran. Since the uploaded file was modified within the last year, you can find the green checkmark-icon next to the question. If the check had failed, you would find a red instead of a green result here. Also, you would find further information on why it failed and when the file was modified for the last time.

**Congratulations!** You've made your first step in automating you release process. If you're interested in learning more about how {{ PRODUCTNAME }} works and how you can configure your own checks, continue with our document on {doc}`onboarding`.
