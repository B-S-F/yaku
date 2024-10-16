# yaku-apps-python

## What works

* Running apps: e.g., `bazel run //yaku-apps-python/apps/$APPNAME`
* Running tests: e.g., `bazel test //yaku-apps-python/apps/$APPNAME:test`
* Running tests for the binaries: e.g., `bazel test //yaku-apps-python/apps/$APPNAME:test-bin`

Supported apps:

* `artifactory-fetcher`
* `excel-tools`
* `filecheck`
* `papsr`
* `pdf-signature-evaluator`
* `pex-tool`
* `security-scanner`
* `sharepoint`
* `sharepoint-evaluator`
* `sharepoint-fetcher`
* `splunk-fetcher`

## What doesn't work

* We don't have PEX binaries, e.g. for `papsr`.
* The "binary" build for `papsr` contains too many libraries, not just the given dependencies.
  Likely, bazel just links the whole Python dependency set.
* As we don't build pex files, we cannot use the `tests-pex` test files.
  But we might be able to rewrite the text runner so that it uses the bazel "binary" script instead of calling the pex file.
* Splunk, SharePoint, and SharePoint-Fetcher integration tests are not configured yet.

## Development instructions

To update the Python requirements files:

```bash
bazel run //yaku-apps-python:requirements.update
```
