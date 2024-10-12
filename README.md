# yaku

## Bazel
[![Build all](https://github.com/B-S-F/yaku/actions/workflows/build-all.yml/badge.svg)](https://github.com/B-S-F/yaku/actions/workflows/build-all.yml)

### Overview

| Component  | Build | Test | Artifact Upload |
|------------|-------|------|-----------------|
| Onyx       | ✔️    | ✔️   |                 |
| API        |       |      |                 ||
| Chart      | ✔️    | ✔️   |  ✔️             |
| Component4 |       |      |                 |

✔️ works  
❌ does not work

### Components

#### Onyx
- bazel version: 6.0.0 (see `.bazelversion`)
- `BUILD` files created with  `gazelle -go_prefix github.com/B-S-F/yaku/onyx` (from the component root)
- `deps.bzl` created with `gazelle update-repos -from_file=go.mod -to_macro=deps.bzl%go_dependencies -prune` (from the component root)
- derived from this tutorial: https://earthly.dev/blog/build-golang-bazel-gazelle/

#### Chart
- see https://github.com/abrisco/rules_helm
- chart is pushed to this OCI repo here: [ghcr.io/b-s-f/charts/yaku](https://github.com/B-S-F/yaku/pkgs/container/charts%2Fyaku)