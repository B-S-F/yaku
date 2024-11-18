# How to fetch pull requests filtered by hash

## Introduction

To fetch pull requests filtered by commit hashes, you need to add the filter option(s) to the config file for the Git fetcher. Currently, this works only with Bitbucket. The hash filter is optional.

## Adjust the config file

Now, you need to adapt the configuration file for commit hash filtering.

To filter pull requests by commit hashes add the optional parameter `filter.startHash` to get pull requests which where updated after or at the same time as this commit hash.
Add the optional parameter `filter.endHash` to get pull requests which where updated no later than this commit hash was created. `filter.endHash` can only be used together with `filter.startHash`.

If `filter.startHash` is used without `filter.endHash` then all pull requests between the start hash and the current date are fetched.

This is a sample file:

```yaml
org: your-bitbucket-org
repo: your-repository
resource: prs
filter:
  startHash: c1b611a # Optional. Only works with Bitbucket.
  endHash: d916ec2a # Optional. Works only if startHash is provided. Only works with Bitbucket.
```

The hash filter can be combined with the [state](./how-to-fetch-pull-requests-filtered-by-state.md) filter only.

## Adjust the environment variables

Make sure to also update your environment variables as done in {doc}`./how-to-fetch-pull-requests`. An example for a full {file}`qg-config.yaml` can be found in the reference section here [here](../reference/git-fetcher-reference.md).
