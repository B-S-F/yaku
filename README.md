# yaku

## Bazel
[![Build all](https://github.com/B-S-F/yaku/actions/workflows/build-all.yml/badge.svg)](https://github.com/B-S-F/yaku/actions/workflows/build-all.yml)

### Overview

| Component  | Build | Test | Artifact Upload |
|------------|-------|------|-----------------|
| Onyx       | ✔️    | ✔️   |                 |
| API        |       |      |                 |
| Chart      | ✔️    | ✔️   |  ✔️             |
| Core-image | (✔️)  |      |  ✔️️             |
✔️ works  
(✔) partially works 
❌ does not work

### Components

#### Onyx
- `BUILD` files created with  `gazelle -go_prefix github.com/B-S-F/yaku` (from root)
- derived from this tutorial: https://earthly.dev/blog/build-golang-bazel-gazelle/

#### Chart
- see https://github.com/abrisco/rules_helm
- chart is pushed to this OCI repo here: [ghcr.io/b-s-f/charts/yaku](https://github.com/B-S-F/yaku/pkgs/container/charts%2Fyaku)