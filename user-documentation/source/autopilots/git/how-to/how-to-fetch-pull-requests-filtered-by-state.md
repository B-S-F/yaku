<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# How to fetch pull requests filtered by state

## Introduction

To fetch pull requests filtered by state you need to add the filter option to the config file for the Git fetcher. Currently, this works only with Bitbucket. Possible filter values for the state are one of `DECLINED, MERGED, OPEN, ALL`. The state filter is optional. Using `ALL` leads to the same result as leaving the state filter out.

## Adjust the config file

Now, you need to adapt the configuration file for state filtering.

1. Add the key `state` to the filter section.
2. As value, choose one of `DECLINED, MERGED, OPEN, ALL`.

This is a sample file:

```yaml
org: your-bitbucket-org
repo: your-repository
resource: prs
filter:
  state: ALL # Optional. One of: DECLINED, MERGED, OPEN, ALL. Only works with Bitbucket.
```

The state and [date](./how-to-fetch-pull-requests-filtered-by-date.md) filter can be combined.

## Adjust the environment variables

Make sure to also update your environment variables as done in {doc}`./how-to-fetch-pull-requests`. An example for a full {file}`qg-config.yaml` can be found in the reference section here [here](../reference/git-fetcher-reference.md).
