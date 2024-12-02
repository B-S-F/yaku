<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# How to use it?

## How can you access {{ PNAME }}?

You can use {{ PRODUCTNAME }} via three different interfaces:

- **Web UI** - a nice graphical user interface which you can use directly from your browser. [Try it out!][WebUI]
- **[CLI](cli/index)** - a easy-to-use command line application which simplifies calling the REST API by providing simple shell commands
- **[REST API](reference/rest-api/index)** - best suited for developers who want to include {{ PNAME }} into their own workflows or products

For the API, there's a web interface for using all the endpoints. So if you're familiar with REST API's and don't want to make yourself familiar with a new program, having to install anything or like to use the bare endpoints, then this is the option for you.

As the name suggests, the CLI is a command line interface that is being operated in your terminal. It's built on top of the API and uses various commands, which make dealing with the API easier. So if you want to save yourself some time in your long term workflow and want to take advantage of all the log statements, this could be the right fit for you.

Lastly, there's also the UI. It's a web application and best suited for new users. It makes using the service as easy as possible with a modern, intuitive web interface. However, as of now you might be missing some logging information and some more advanced features like changing environment variables during runtime. If that doesn't tell you anything as of now, don't worry. This is probably the right solution for you then.

### How do you configure it?

In order to enable {{ PRODUCTNAME }} to answer your SW release question catalogue, you need to provide a central config file and depending on the used fetchers and evaluators further config files. In summary, these files are required:

- {file}`qg-config.yaml`
- other config files, specific to the fetchers/evaluators

The {file}`qg-config.yaml` is the heart of the service. Here, you can define the questions you want to be answered. Additionally, you will configure the autopilots for answering them here.

The autopilot apps (see {doc}`autopilots/index` for more information), like SharePoint fetcher or JSON evaluator, require their distinct configuration files. They all have different configuration options and variables that you can set to adapt them to your needs.

We recommend to continue with the quickstart tutorial if you want to see a
quick demo of the service and perform a use case in the web UI.

Continue now to the next page about the {doc}`quickstart`.

[WebUI]: https://portal.bswf.tech/
