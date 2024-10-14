# yaku
!! THIS PROJECT IS UNDER CONSTRUCTION !!

<img src="./misc/under-construction.jpg" alt="Under Construction" width="300"/>  
<figcaption style="font-size: 0.7em; color: #555;">
Foto from Mabel Amber from <a href="https://www.pexels.com/de-de/foto/nahaufnahme-fotografie-der-roten-und-weissen-strassenbeschilderung-117602/" target="_blank" style="color: #555;">Pexels</a>
</figcaption>

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