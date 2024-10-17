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
* Can we somehow ignore the `BUILD` files from pants?

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
