# yaku
!! THIS PROJECT IS UNDER CONSTRUCTION !!

<img src="./misc/under-construction.jpg" alt="Under Construction" width="300"/>  
<figcaption style="font-size: 0.7em; color: #555;">
Foto from Mabel Amber from <a href="https://www.pexels.com/de-de/foto/nahaufnahme-fotografie-der-roten-und-weissen-strassenbeschilderung-117602/" target="_blank" style="color: #555;">Pexels</a>
</figcaption>

## Bazel

### Overview

| Component  | Build | Test | Artifact Upload | Workflow |
|------------|-------|------|-----------------|---------|
| Onyx       | ✔️    | ✔️   |                 |[![Build Onyx](https://github.com/B-S-F/yaku/actions/workflows/build-oynx.yml/badge.svg)](https://github.com/B-S-F/yaku/actions/workflows/build-oynx.yml)|
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

#### Chart
- see https://github.com/abrisco/rules_helm
- chart is pushed to this OCI repo here: [ghcr.io/b-s-f/charts/yaku](https://github.com/B-S-F/yaku/pkgs/container/charts%2Fyaku)