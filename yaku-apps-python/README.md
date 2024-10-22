# yaku-apps-python

## What works

* Running apps: e.g., `bazel run //yaku-apps-python/apps/$APPNAME`
* Running tests: e.g., `bazel test //yaku-apps-python/apps/$APPNAME:test`
* Running tests for the binaries: e.g., `bazel test //yaku-apps-python/apps/$APPNAME:test-bin`
* Building binaries: e.g., `bazel build //yaku-apps-python/apps/$APPNAME`
* Building wheel for `autopilot-utils`, see below
* Running tests with coverage, see below.

## What doesn't work

* We don't have PEX binaries, e.g. for `papsr`, yet. However it is possible to call pex inside a gen_rule.
* The "binary" build for `papsr` contains too many libraries, not just the given dependencies.
  Likely, bazel just links the whole Python dependency set.
* Splunk, SharePoint, and SharePoint-Fetcher integration tests are not configured yet.
* Formatting/linting the code: There are three options:
  1. Just run `uvx ruff format yaku-apps-python` (uses `uv` to install the tool)
  2. or use <https://philuvarov.io/bazel-can-be-ruff/>
  3. or use Aspect rules: <https://github.com/aspect-build/rules_lint>
* How can we debug with VS Code or other remote debugging tools?

## Development instructions

### Requirements files

To update the Python requirements files:

```bash
bazel run //yaku-apps-python:requirements.update
```

### Tests and coverage reports

To run tests:

```bash
bazel test //yaku-apps-python/...
```

To run tests with coverage:

```bash
bazel coverage //yaku-apps-python/... --combined_report=lcov
```

And then you can convert the collected lcov files to html:

```bash
genhtml --ignore-errors mismatch --output htmlcov "$(bazel info output_path)/_coverage/_coverage_report.dat"
```

You will find the coverage report in <../htmlcov/index.html>.

### Autopilot Utils Wheel

```bash
bazel build //yaku-apps-python/packages/autopilot-utils:wheel
```

## IDE Integration (VS Code)

You need to tell the IDE where all the different Python packages are. This can be done in the `pyproject.toml` in
the root workspace folder.

Just add the paths received from `find yaku-apps-python -type d -name src` to the `extraPaths` list in the `pyproject.toml`.

## Extra virtual environment for VS Code auto-completion and linting

As VS Code doesn't know about the Python dependencies declared in Bazel for the different packages,
we can instead create a virtual environment with all the dependencies installed.

Then, we can point VS Code to this virtual environment for auto-completion and linting.

```bash
cd yaku-apps-python/3rdparty/
python3 -m venv .venv
.venv/bin/pip install -r requirements_lock.txt
```

Then, in VS Code, you can select this virtual environment as the Python interpreter.

If you have `uv` installed, you can do this of course with `uv`:

```bash
cd yaku-apps-python/3rdparty/
uv venv create
uv pip install -r requirements_lock.txt
```

Note: I got a build error in the pip install step, due to some build issue with pyyaml 6.0.
Perhaps other (older) versions of pyyaml work better.
