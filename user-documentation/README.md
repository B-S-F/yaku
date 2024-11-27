<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Yaku User Documentation

The Yaku user documentation is created with [Sphinx](https://www.sphinx-doc.org)
and with the help of the [myst-parser](https://github.com/executablebooks/MyST-Parser) extension.

This allows us to write Sphinx documentation in (a superset of) **Markdown**, and still
have all the flexibility and features from Sphinx.

The **latest main version** is always pushed directly to <https://b-s-f.github.io/yaku/>.

[![.github/workflows/build-user-documentation.yml](https://github.com/B-S-F/yaku/actions/workflows/build-user-documentation.yml/badge.svg)](https://github.com/B-S-F/yaku/actions/workflows/build-user-documentation.yml)

## Quickstart

If you want to add a new page somewhere:

1. look for `toctree` directives, e.g. in [source/autopilots/index.md](./source/autopilots/index.md).
2. add a new line there pointing to the file name of the new page (without file extension)
3. create the new file (with either `.md` or `.rst` suffix) in the given location (e.g. subfolder)
4. fill the file with content — you can use Markdown!

<details><summary>Example</summary>

Modify `source/autopilots/index.md` and add your new autopilot to the toctree list of pages:

````markdown
```{toctree}
:maxdepth: 1

bitbucket/index
your-cool-new-autopilot/index
```
````

Create `source/autopilots/your-cool-new-autopilot/index.md` and write Markdown:

```markdown
# My cool autopilot

This is my first page! **Great!!**
```

</details>

## Building locally

Make sure to have `python3` and `make` installed. Then, just run `make prepare`
to set up the Python environment and then `make html` to build the HTML pages.

Additionally, use `make lint` to run the integrated linter on the markdown
files. This will automatically run before. To adjust the rule set used for
linting, change the lint command in the `Makefile`, for example to exclude
other default rules from checking. See [Linting](#linting).

There is also a `make watch` command to automatically rebuild the HTML pages
when you edit the source files and reload them in your browser.
Sometimes, HTML files won't rebuild correctly, especially when editing not only
page content, but modifying the site's structure, e.g., when adding new files.
In this case, press `Ctrl-C` and `make clean` and try again.

To test the docker image, run `make docker-image`. This command will build the
docker image and then start the container. If executed successfully, your
browser will open at <http://localhost:8888>.

## Guidelines & Tips

<details><summary>Keep how-tos short and concise</summary>
When writing how-tos:

* Focus on describing a few short steps.
* Write them down as steps, e.g. with an ordered list.
* Leave out phrasings like "First, ...", "Finally, ...".
* Write in short imperative form: "Click on 'Ok'" instead of "On the left side you can find the OK button on which you have to click."
* Have a clear goal in mind: what is the outcome of the how-to? Leave out all information that isn't required.

</details>

<details><summary>Use backticks instead of colons for writing MyST directives</summary>

````markdown
```{note}
This is how a note should be defined (using backticks)
```
:::{note}
Do NOT use colons for delimiting a directive!
:::
````

</details>

<details><summary>You can nest code samples inside directives by using more than three backticks</summary>

`````markdown
````{note}   ← the outer block/directive is delimited by 4+ backticks!
This note contains a code sample:
```js
console.log('Hooray!')
```
````
`````

</details>

<details><summary>Use todos if you want to indicate missing content</summary>

There is a todo directive which will then appear on the start page of our
documentation (only in the internal developer preview version, not in the public
version!)

````markdown
```{todo}
The paragraph above needs some rephrasing and a reference to the Sphinx documentation!
```
````

</details>

<details><summary>Use roles for internal links and other markup</summary>

reStructuredText has the concept of
[_roles_](https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html).
Roles for links describe how the link should be evaluated:

### `doc` role

```markdown
You'll find more information in {doc}`../tutorial` ... (uses the page title of `tutorial.md` as link text)
Read our {doc}`super nice tutorial <../tutorial>` (uses the given text as link text)

```

### `ref` role

```markdown
See {ref}`section-quickstart-step-1` for the start of our quickstart tutorial...

(section-quickstart-step-1)=
#### Quickstart Tutorial
```

### `download` role

```markdown
First step: download {download}`../attachments/qg-config.yaml` and put it into your folder.
(this makes sure that the file is offered as download in the web browser)
```

### `envvar` role

```markdown
The autopilot reads {envvar}`evidence_path` to find out where the documents are...
```

### `term` role

```markdown
See our glossary entry on {term}`autopilot`...
```

### `abbr` role

```markdown
We use {abbr}`YAML (yet another markup language)` for config files...
(will put the description text into a HTML title attribute)
```

### `guilabel` role

```markdown
In the web UI, first click on {guilabel}`Upload file...` and then on
{guilabel}`OK`.
```

</details>

<details><summary>Make images clickable for full size</summary>

When displaying images or figures, they are usually scaled to fit.
But when you explicitly want to have a link to the full size version,
you need to add a `:width: 100%` attribute to generate the link
from the scaled-down version to the full size version:

````markdown
```{figure} resources/large-pic.png
:width: 100%
:alt: Some large screenshot

Screenshot description
```
````

</details>

<details><summary>Link to the REST API documentation</summary>

The [sphinxcontrib-httpdomain](https://sphinxcontrib-httpdomain.readthedocs.io/) provides
some extra roles for HTTP REST API descriptions.

As we have all our OpenAPI specification in Sphinx, you can refer to endpoints
in your documentation. Additionally, there are automatic links to external reference
sources for HTTP verbs or status codes.

```markdown
For using the {http:get}`/api/v1/namespaces` endpoint, you need to send a {http:method}`GET` request.
In case of errors, you'll get a {http:statuscode}`400` response.
```

</details>

## Reference

### Documentation System

We are following the [Diátaxis Documentation System](https://diataxis.fr/)

It focuses on four different functions of documentation:

* [tutorials](https://diataxis.fr/tutorials/),
* [how-to guides](https://diataxis.fr/how-to-guides/),
* [technical reference](https://diataxis.fr/reference/) and
* [explanation](https://diataxis.fr/explanation/).

See [this link](https://diataxis.fr/needs/#characteristics-of-documentation) for a good tabular overview over the different functions.

### Other sources of inspiration

* [David Amos: who is reading your docs?](https://davidamos.dev/who-is-reading-your-docs/)

### Syntax

* Our documentation is created with [Sphinx](https://www.sphinx-doc.org)
* Sphinx provides special [roles & directives](https://www.sphinx-doc.org/en/master/usage/restructuredtext/index.html)
  for special content elements (images, TOC, code examples, ...)
* As we are using [MyST](https://myst-parser.readthedocs.io/en/latest/syntax/syntax.html)
  to allow us to use **Markdown instead of reStructuredText**, we have to write the
  roles and directives in a [special Markdown syntax by MyST](https://myst-parser.readthedocs.io/en/latest/syntax/roles-and-directives.html).
* For the REST API documentation, we are using [sphinxcontrib-openapi](https://sphinxcontrib-openapi.readthedocs.io/)
  which uses [sphinxcontrib-httpdomain](https://sphinxcontrib-httpdomain.readthedocs.io/) internally.
  The REST API documentation is generated automatically from the OpenAPI description of our service.
  Run `make openapi` to download the latest API description.

### Theming

* We are using the [Sphinx Book Theme](https://sphinx-book-theme.readthedocs.io/en/stable/index.html)
* extended by [sphinx_design](https://sphinx-design.readthedocs.io/en/rtd-theme/index.html) package

### Linting

* We are using the [Markdownlint Library](https://www.npmjs.com/package/markdownlint) to check the markdown.
* Currently, we run the default rule-set with the following exceptions:
  * MD013: We don't check for lines longer than 80 characters, as this is not relevant with wider screen resolutions
  * MD029: We don't check for ordered list item prefix as this collides with the sphinx syntax in certain cases
  * MD033: We allow inline HTML as to be more expressive in regards to rendering our documentation.
