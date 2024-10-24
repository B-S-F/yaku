# Yaku
[![Build all](https://github.com/B-S-F/yaku/actions/workflows/build-all.yml/badge.svg)](https://github.com/B-S-F/yaku/actions/workflows/build-all.yml)
<a href="https://yaku.buildbuddy.io"><img src="./misc/buildbuddy.png" width="100 "></a>

!! THIS PROJECT IS UNDER CONSTRUCTION !!

<img src="./misc/under-construction.jpg" alt="Under Construction" width="300"/>  
<figcaption>
Foto from Mabel Amber from <a href="https://www.pexels.com/de-de/foto/nahaufnahme-fotografie-der-roten-und-weissen-strassenbeschilderung-117602/" target="_blank" style="color: #555;">Pexels</a>
</figcaption>

## Locally build

#### Prerequisites
In order to locally build, make user you have bazelisk installed:  

On macOS: 
```bash
brew install bazelisk
````

On Windows: 
```bash
choco install bazelisk.
```
#### Build

```bash
bazel build //...
```

#### Test

```bash
bazel test //...
```


## CI/CD
For the CI/CD pipeline, GitHub Actions is used. The workflow is defined in `.github/workflows/build-all.yml`.

### Bazel Remote caching and remote execution
Remote caching and remote execution in Bazel are powerful features that enhance build efficiency and speed. Remote caching allows Bazel to store build outputs on a server, enabling reuse of these outputs across different builds and machines, which reduces redundant computations and speeds up the build process. Remote execution, on the other hand, offloads the execution of build actions to remote servers, distributing the workload and further accelerating the build process.

### BuildBuddy
Incorporating BuildBuddy into your GitHub workflow leverages these capabilities by integrating a remote cache and execution service directly into your CI/CD pipeline. This setup ensures that builds are consistently fast and reliable, as BuildBuddy manages the caching and execution of build actions, optimizing resource usage and minimizing build times

It is not require for contributers to have a BuildBuddy account. The BuildBuddy instance is hosted by the project owner.
However, if you want to follow the remote execution and caching, you can sign up for a free BuildBuddy account at [buildbuddy.io](https://buildbuddy.io/).
Afterwards you are able to [join our organization](https://yaku.buildbuddy.io/join/) and see the build results, stats and so on in [our BuildBuddy dashboard](https://yaku.buildbuddy.io). 

## Components

| Component   | Build | Test | Artifact Upload | Comments                                                                         |
|-------------|-----|------|-----------------|----------------------------------------------------------------------------------|
| Onyx        | ✔️  | ✔️   |                 |                                                                                  |
| API         |     |      |                 |                                                                                  |
| Chart       | ✔️  | ✔️   | ✔️              |                                                                                  |
| Core-image  |(✔️) |      | ✔️️             | build works but not complete                                                     |
| Python apps | ✔️  | ✔️   | ️               |                                                                                  |
| TS apps     |(✔️) |      | ️               | see [private test repo](https://github.com/bosch-grow-pat/bazel-typescript-test) |
| Frontend    |     |      | ️               |                                                                                  |

✔️ works    
(✔) partially works   
❌ does not work

### Onyx
- `BUILD` files created with  `gazelle -go_prefix github.com/B-S-F/yaku` (from root)
- derived from this tutorial: https://earthly.dev/blog/build-golang-bazel-gazelle/

### Chart
- see https://github.com/abrisco/rules_helm
- chart is pushed to this OCI repo here: [ghcr.io/b-s-f/charts/yaku](https://github.com/B-S-F/yaku/pkgs/container/charts%2Fyaku)

### Python Apps
- see https://github.com/B-S-F/yaku/tree/main/yaku-apps-python

...

## Misc
### Dependency graph
Overview of the dependencies between the components (click to open in GraphvizOnline)
[![](./misc/depgraph.svg)](https://dreampuf.github.io/GraphvizOnline/?compressed=CYSw5gTghgDgFgAgLYE9K0QbwFAIQOwHtgBTBAbQGc5YSBeAI0IA8BdAblwQCIB6XgMY0IAFwBcKKAGsArgH04JADZJuFBAMJLCEOt0gkS%2BbgBoElESiX1uAMxBLrwbhy59Bw8ZNkLlqhAC0AHw8-EJQomIiJEgwSlDRlLy%2BSjAkEJQAdCJxADr4YZ5iAG5QSjIkWZJISvmFEeIAwp6Z1bUFHg1iAhDASRFghAEA7jpSttrDlAE9fa1QNdxu9ZHe8ooqasE8AAIbSHKkMHIDhHKjEOOTSbxi%2B4ckx6fnYxOEU0t47uGr0ut%2BWxC3x0JACICQUDAJDEMBk1DBEKhn1CnV%2BPn2gN29yOciQIHwIEI-DufgexzxBMIyOBEFB4Mh0Nh8PpSLw5E02l0%2BlpRlM5ks1j09kcJGcri%2BYRBCIZMLhcGlrO2NLpiOhImg%2BEoIBEhPworkLJI1MltIVjLlZsxyrNYgsCzSzmWgilhttIntouNztNrrtsU9gSBJpVMrkfod2ViSi9mh9qqiGq1OsIeuABtVanZWh0egMvLMFisNmFThcnAl3pDUITUE12t1%2BsNVp2cQSth0SBuAlhYgiSAAbAAWGMu%2BPq2tJhtppuBlGxqvQptO%2Bc28d15Op9MM5utkTtiCdsI95gADn7ciHI7jMrXk5TjYzs%2B4Lfie47XZ7UAiQkvy9HN8Tet72nR8lRfNt334QhKDEJR8RkZgrwXGt1ynLdFSBHYIBkaxKDkQZ%2BAIkRCC0cJ8W6QY5EIWxbGpLCcMqfCiV4IiSKUMj8Aos5qNotx6NwpjCKJYjSJociBEonjm2wgSCJY4S2I4ri5E0TVx3xEQ6Jkxi5NY0SoHEyjVIsaANLo7FHlxfFCWJCzyWsqk%2BLsqzKVs0kcQpQlm2czzmLEXyYyKaIowSSpkg2NIMmyPIOh%2BcRSnKSp5hqOpUSaFo2lSuLul6foIEGEZXmuGZcuS6M%2BN3fdD14aDYPgxCKtfKqblquD8AQncmsgmqYOgujKu62q%2Bqc9zLOeC4rneG4SRUMkTnys4JreD4RtmnFxqKqa3LWsaFpeS5lsobzRqePaluuYlTkKg7rnMk75so86ttuK6npWr49nujabue3sFuuyaPifT6dtOx7NqmS7-re6YAAZMkHABGBHsjAAAvO7QYexaIem17cYCeGkZRkR0cxg4PIc4kAtWinLN86mHOOrGGduXyAgAVkyAAmTJ4dJjHabm1n-Iczmeb51HBYrFdXTDd1-WASM4iQm15Y9JWRCjZsGCgNHlDkESlBuSgIAEZ18FADcYLgaCRHOfFgCm1XXRnCgORzbgRBkCAAEcZEIEBKCNAsBWLBxS3FOd-2rGclWDG1YGOeIUHSNQ-2vWPQKDSs1cNc4IG1Eg5CMdUUBgQP8E0jPkLjzDQBMrRKjw3Xg%2BJBv1SbygW6gYO6I7iAu57tvbgHoe5Fbo0%2BLH3Dh5Idug872eJ97o1gYGg8PxkMRT3PX8Ppn5uV5HsRD%2B74%2B17A-jGMIAQQAAP3v2%2BH7Pue5DahD5oHQcF8b5fJ-fvVL%2BQ58g7GvnhZ%2Bj9IGvwvoA9qzAThIGAEOX%2BS8j4AI-gghYyDhxcHIPEBgyg9BgI3tVbs28%2BxDhIV1TeR5t67wvMOKOz4YGT1QYPf%2Bq9OoQVoYIT8B5967FIVvP639%2Bo0LIfwsR68JEiK-GbOAgjnzCLob2b8ijcEfRUXwih6jLwyJ4ZI7e5C6LgKonfKBFjWGrzgZ-ShP9R6Lw4egmxmDgGDlAWYyBT8rFOPHhgoB2CUGOL-i44OtisFIKUeBN8vDyE7zPIw8RhiREMP0WBbR8STGNRSao7JMsY7QnQsXYYhdoglyrhAculdq4FMzkU-OpSi4VLLhXMywNdb6yUIbNiJszYWytrqG2dsHaW2dnxTpBsjZ9PNqpQZKZhkWFGU7d6uxJndOmfwU2syUzzM1HcEZwxHbOw6XrKZvStn9LmUBfZtsllHLGVMdxKkFnqSrqA9ZPStAzIGTcxZ9sHkrLwswIcLy1KmSrsifBUBCFKGITsT5mzeDbN%2BdbA59zjlPPsWCkyBkq6Sktn80%2BJBbBQBwppZhCKzkbIuciq5uyiV3IBZivC2LjJvJEB86lXzjaXJ2YStFTLllTTkCCwcOKOUu3jEnd%2BUBU4QDUO7bMXJvZ%2BwDkHEO-IixCgjp6ZhCdXQypTmnYG2k8IwCkGAfgFqrUwELqUaIMJ7WhXVrEB40QBCco6CmFAzBBBIMEHBMQPqGofTNXIG11rLW8DtSAB1jJnXlPDO6kgnrUohv9cAQNIBg34F9YqrMnI9Cp0cO8PkhZBR2F1WKTgABfbAQA)

Produce the graph with:  
```bash
bazel query --notool_deps --noimplicit_deps \
    "deps(//chart:yaku_helm, 5) \
    except @rules_go//go/toolchain:linux_arm64 \
    except @rules_go//go/toolchain:linux_amd64" \
    --output graph > graph.dot
```
