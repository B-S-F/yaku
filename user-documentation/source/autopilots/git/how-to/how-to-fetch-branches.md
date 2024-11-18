# How to fetch branches

In order to fetch branches, you need to provide a configuration file to the
git fetcher. Make sure to also update your environment variables as done in {doc}`./how-to-fetch-pull-requests`. An example for a full {file}`qg-config.yaml` can be found in the reference section here [here](../reference/git-fetcher-reference.md).

This is a minimum working example:

```yaml
org: your-bitbucket-org
repo: your-repository
resource: branches
```

```{warning}
Fetching branches is currently only supported for Bitbucket repositories.
```

```{note}
The git fetcher will always fetch **all** branches, as there is no filtering
implemented. Providing `labels` or a `filter` in the configuration file will
have no effect.
```
