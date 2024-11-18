# Creating a Python App

This tutorial will explain how to set up a new Python app.

The following sections describe how you can use `autopilot-utils` to create
your own custom Python app, with the help of [Poetry][poetry-website].

## Setting up Poetry

[Poetry][poetry-website] is a popular tool for dependency management and
packaging in Python.
We will use it to simplify the Python project setup.

### Install Poetry and set up a project

For installing Poetry and for setting up your project, you'll find the latest
information in the [Poetry documentation][poetry-docs].

Below, you can find _one_ way of installing Poetry and setting up a project,
but feel encouraged to check out the Poetry website, as there are other (and
possible newer or more recommended) ways to start with Poetry.

1. Install `pipx` using this [documentation](https://pipx.pypa.io/stable/installation/).
2. Install `poetry` by running the following command from a shell (check out the
  [docs](https://python-poetry.org/docs/#installation) for more details):

   ```console
   pipx install poetry
   ```

3. Set up a new project:

   ```console
   poetry new my-app
   ```

4. Switch to the new directory:

   ```console
   cd my-app
   ```

### Add autopilot-utils to Poetry

Add the `autopilot-utils` package to your Poetry project:

```console
poetry add autopilot-utils
```

### Add pex to Poetry

You should also install the `pex` utility if you want to bundle your app
later into a single-file [pex][pex-website] bundle:

```console
poetry add --group=dev pex@2.2.1
```

```{note}
Currently, the tested and supported version of `pex` is `2.2.1`.
```

```{note}
If poetry complains about incompatible Python versions for pex and the
autopilot-utils package, read the error message closely and adapt the `python`
version property inside the {file}`pyproject.toml` file accordingly.
```

## Writing the Python app

Now that we have set up the Poetry project and added the autopilot-utils
package, we can continue with creating our Python app.

### Create a version file

Poetry has already created a package folder {file}`my_app/` for us, and put a
file {file}`__init__.py` into the folder.

Now, create a version file `my_app/_version.txt` with the content `0.1.0`:

```console
echo "0.1.0" > my_app/_version.txt
```

This version number will later be used to display the version of your app with
the `--version` command line argument.

### Create the main Python file

Then, create a file `my_app/cli.py` with the following content:

```{code-block} python
---
caption: my_app/cli.py
---
import click
from loguru import logger

from grow.autopilot_utils.cli_base import make_autopilot_app, read_version_from_package
from grow.autopilot_utils.results import DEFAULT_EVALUATOR, RESULTS, Result

class CLI:
    click_name = "my-app"
    click_help_text = "My first app!"
    click_evaluator_callback = DEFAULT_EVALUATOR
    click_setup = [
        click.option("-n", "--name", help="Your name."),
    ]

    def click_command(name):
        logger.debug("We are inside click_command now!")

        if name:
            logger.info(f"Hello {name}!")
        else:
            logger.info("Hello World!")

        RESULTS.append(Result(criterion="App must work.", fulfilled=True, justification="Executes correctly!"))


main = make_autopilot_app(
    provider=CLI,
    version_callback=read_version_from_package(__package__),
)

if __name__ == "__main__":
    main()
```

## Running the app

To run and test your Python app, execute:

```console
poetry run python -m my_app.cli
```

This should result in the following output:

```text
INFO  | Hello World!
{"status": "GREEN", "reason": "Executes correctly!"}
{"result": {"criterion": "App must work.", "fulfilled": true, "justification": "Executes correctly!", "metadata": {}}}
```

### Running the app with arguments

If you run your app with a `--debug` flag and with a `--name` argument, the output on the console will be different:

```console
$ poetry run python -m my_app.cli --debug --name Tom
20:15:42 | DEBUG | We are inside click_command now!
20:15:42 | INFO  | Hello Tom!
{"status": "GREEN", "reason": "Executes correctly!"}
{"result": {"criterion": "App must work.", "fulfilled": true, "justification": "Executes correctly!", "metadata": {}}}
```

## Bundling your app with pex

[Pex][pex-website] is a tool to bundle your Python app into a single file. This
file includes all third-party dependencies along your own code, so that you can
execute it on any computer which has a matching Python version installed.

````{note}
PEX files are self-contained Python virtual environments. While they can support
multiple platforms and Python interpreters, they are still targeted at a certain
target platform.

This means that you usually cannot run the PEX file on a largely different system.
For example, a PEX file created on Mac can usually not be used on Linux.
Windows is currently not supported at all.

See the [explanation of what pex files are](https://docs.pex-tool.org/whatispex.html)
for more details.

As {{ PNAME }} runs on a Linux 64bit platform, you should be fine if you are
using one of the popular Linux distributions to build your app.
````

If you haven't installed `pex` yet into your Poetry environment, see the chapter
on [adding pex to your poetry environment](#add-pex-to-poetry).

To bundle your app into a pex file, run:

```console
poetry run pex . --use-pip-config --output-file my-app.pex --entry-point my_app.cli
```

```{note}
The `--use-pip-config` flag is required here, as pex doesn't know about our
extra package source yet, so without this flag, it will not be able to download
the `autopilot-utils` package.
```

You should now have a single file `my-app.pex` in your working directory.
This file can be called like a normal executable, e.g.:

```sh
./my-app.pex --help
```

or like in the example above:

```sh
./my-app.pex --debug --name Tom
```

You can now upload this app file to your {term}`repository` and
use it in your workflows.

```{note}
For more information on how to write such a command line app for a
{{ PNAME }} fetcher or evaluator, see also {doc}`../papsr/tutorials/write-a-simple-fetcher`
or {doc}`../papsr/tutorials/write-a-simple-evaluator`.
```

## Other ways for bundling an app

Besides [pex][pex-website], there are other ways to create a single-file
application out of a Python package.

However some of them include the Python runtime into the package file,
which means that those files will be much larger than the {file}`.pex` files.

Nevertheless, they can still be used to package a Python app.

Most popular tools are at the moment:

* PyInstaller (<https://pyinstaller.org/>) — can even cross-build packages, but files can become quite large.
* Nuitka (<https://nuitka.net/>) — uses a C compiler to compile a Python program into a binary executable. Runs fast, and seems easy to use. However involves compiling a C program with might lead to other issues.
* PyOxidizer (<https://github.com/indygreg/PyOxidizer>) — Similar to Nuitka, but more complicated to use.
* cx_Freeze (<https://cx-freeze.readthedocs.io/>) — similar to PyInstaller, but more complicated to use.

[poetry-website]: https://python-poetry.org/
[poetry-docs]: https://python-poetry.org/docs/
[pex-website]: https://docs.pex-tool.org/
