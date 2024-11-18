# Welcome

```{image} _static/yaku-flow-pipeline.png
:width: 100%
:class: sd-m-auto welcome-graphic
:alt: "Yaku pipeline illustration graphic"
```

<br>
<br>

{{ PRODUCTNAME }} is a service to help you automate your software release process. It’s a tool, that automatically collects various files and attaches them as evidences to the related release questions and lets you know whether the questions’ requirements were met or not and why. Therefore, it allows you to speed up your software release preparation times by a substantial amount.
This is achieved by configuring different autopilots that can:

- fetch and evaluate files, stored on various platforms like SharePoint
- fetch and evaluate tickets, managed in different platforms like Azure DevOps
- verify signatures in pdf documents
- and much more…

You can also provide manual answers for the questions that can not be automated. So you have all of your quality assessment-related content in one place.

## How can you access it?

You can use {{ PRODUCTNAME }} via three different interfaces:

- Web UI - a nice graphical user interface which you can use directly from your browser.
- CLI - a easy-to-use command line application which simplifies calling the REST API by providing simple shell commands
- REST API - best suited for developers who want to include {{ PNAME }} into their own workflows or products

## Next steps

Are you interested in the service? We recommend you to continue your journey by reading some further information about it, however if you want to experience {{ PNAME }} hands on right away, you can also continue with the quickstart tutorial.

````{div} sd-d-flex-row
```{button-ref} about-yaku
:ref-type: doc
:class: primary-button

About {{ PNAME }}
```

```{button-ref} quickstart
:ref-type: doc
:class: secondary-button

Quickstart
```
````

```{toctree}
:maxdepth: 1
:hidden:
:caption: Getting Started

about-yaku
how-to-use-yaku
quickstart
```

```{toctree}
:hidden:
:caption: Guides

core/index
autopilots/index
finalizers/index
cli/index
ui/index
```

```{toctree}
:hidden:
:caption: Reference

reference/changelog/index
reference/rest-api/index
reference/interfaces/index
glossary
genindex
```

```{todolist}
```
