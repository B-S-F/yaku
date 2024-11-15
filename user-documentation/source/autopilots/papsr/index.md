# Custom Python Scripts

```{glossary}
PAPSR
  PAPSR is the Python Autopilot Scripting Runtime and can be used to
  develop custom autopilot apps in Python.

  With PAPSR, you can simply upload a short Python script into your
  {term}`configuration` and run it as if it was another builtin app.

autopilot-utils
  The PAPSR runtime includes the `autopilot-utils` Python package.

  This package can also be installed stand-alone, if you want to
  develop a completely independent custom Python autopilot.
```

PAPSR Features:

- Comes with a list of builtin libraries, like `requests`, `pandas`, or `pypdf`.
- Takes care of setting up the [click](https://click.palletsprojects.com/) app.
- Handles errors in a way that {{ PNAME }} understands them.
- Provides flags like `--help`, `--verbose` or `--no-color` automatically.
- Can be used to write fetchers or evaluators.

Usage example:

```{code-block} python
---
caption: Simple example of a custom Python app to fetch data from a URL
---
import click
import requests
from loguru import logger

class CLI:
    click_help_text = "Fetch data from a URL"
    version = "0.1"
    click_name = "url-fetcher"
    click_setup = [click.argument("url", required=True)]

    def click_command(url):
        logger.debug(f"Fetching {url}")
        print(requests.get(url).text)
```

## Tutorials

```{toctree}
:maxdepth: 1

tutorials/write-a-simple-fetcher
tutorials/write-a-simple-evaluator
```

## Reference

```{toctree}
:maxdepth: 1

reference/builtin-libraries
```
