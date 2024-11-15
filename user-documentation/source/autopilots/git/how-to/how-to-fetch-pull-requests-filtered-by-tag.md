# How to fetch pull requests filtered by tag

## Introduction

To fetch pull requests filtered by tags, you need to add the filter option(s) to the config file for the Git fetcher. Currently, this works only with Bitbucket. The tag filter is optional.

## Adjust the config file

Now, you need to adapt the configuration file for tag filtering.

To filter pull requests by tags, add the optional parameter `filter.startTag` to get pull requests which were updated
after or at the same time as this tag. Add the optional parameter `filter.endTag` to get pull requests which were
updated no later than this tag.

`filter.endTag` can only be used together with `filter.startTag`. If `filter.startTag` is used without `filter.endTag`
then all pull requests between the start tag and the current date are fetched.

The tag filter can't be combined with other, mutually-exclusive filters.

This is a sample file:

```yaml
org: your-bitbucket-org
repo: your-repository
resource: prs
filter:
  startTag: release/0.1.0 # Optional. Only works with Bitbucket.
  endTag: release/0.2.0 # Optional. Works only if startTag was provided. Only works with Bitbucket.
```

The hash filter can be combined with the [state](./how-to-fetch-pull-requests-filtered-by-state.md) filter only.

## Adjust the environment variables

Make sure to also update your environment variables as done in {doc}`./how-to-fetch-pull-requests`. An example for a full {file}`qg-config.yaml` can be found in the reference section here [here](../reference/git-fetcher-reference.md).

## Background Information on filtering by tag

Before the actual filtering takes
place, each tag name is transformed into a date, so that the date can be compared to the pull request date. Tags are
transformed into dates by fetching the commit meta data of the tagged commit. In the subsequent process, the commit's
timestamp will be used for the filtering.

Given the above example configuration for a tag filter, if the tags would map to the following commit hashes:

- Tag `release/0.1.0` references hash `c1b611a`
- Tag `release/0.2.0` references hash `d916ec2`

Then, the following configuration file with a hash filter will fetch the exact same pull requests:

```yaml
org: your-bitbucket-org
repo: your-repository
resource: prs
filter:
  startHash: c1b611a
  endHash: d916ec2
```

So the tag filter is a convenience shortcut for the hash filter. It saves you the time and effort to find the
respective commit and its hash.
