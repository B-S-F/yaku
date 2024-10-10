# yaku

## Bazel

### Overview

| Component  | Build | Test | Artifact Upload | Workflow |
|------------|-------|------|-----------------|---------|
| Onyx       | ✔️    | ✔️   |                 |         |
| API        |       |      |                 ||
| Chart      | ✔️    | ✔️   |  ✔️             |[![Build chart](https://github.com/B-S-F/yaku/actions/workflows/build-chart.yml/badge.svg)](https://github.com/B-S-F/yaku/actions/workflows/build-chart.yml)|
| Component4 |       |      |                 |           |

✔️ works  
❌ does not work

### Components

#### Onyx
- bazel version: 6.0.0 (see `.bazelversion`)
- `BUILD` files created with  `gazelle -go_prefix github.com/B-S-F/yaku/onyx` (from the component root)
- `deps.bzl` created with `gazelle update-repos -from_file=go.mod -to_macro=deps.bzl%go_dependencies -prune` (from the component root)
- derived from this tutorial: https://earthly.dev/blog/build-golang-bazel-gazelle/