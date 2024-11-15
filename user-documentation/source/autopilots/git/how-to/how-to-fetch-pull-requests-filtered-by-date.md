# How to fetch pull requests filtered by date

## Introduction

To fetch pull requests filtered by the last update date you need to add the filter option(s) to the config file for the Git fetcher. Currently, this works only with Bitbucket. The date filter is optional.

## Adjust the config file

Now, you need to adapt the configuration file for date filtering.

To filter pull requests by date add the optional parameter `startDate` to get pull requests which were updated starting from this date (inclusive).
Add the optional parameter `endDate` to get pull requests which were updated not later than this date (inclusive). `endDate` can only be used together with `startDate`.

If `startDate` is used without `endDate` then all pull requests between the start date and the current date are fetched.

Both filter values have the format `dd-MM-yyyy`.

This is a sample file:

```yaml
org: your-bitbucket-org
repo: your-repository
resource: prs
filter:
  startDate: 15-02-2023 # Optional. Format dd-MM-yyyy. Only works with Bitbucket.
  endDate: 31-07-2023 # Optional. Format dd-MM-yyyy. Works only if startDate is provided. Only works with Bitbucket.
```

The date filter can be combined with the [state](./how-to-fetch-pull-requests-filtered-by-state.md) filter only.

## Adjust the environment variables

Make sure to also update your environment variables as done in {doc}`./how-to-fetch-pull-requests`. An example for a full {file}`qg-config.yaml` can be found in the reference section here [here](../reference/git-fetcher-reference.md).
