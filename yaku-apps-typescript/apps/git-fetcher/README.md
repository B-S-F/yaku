# git-fetcher

A fetcher that fetches git resources data from a git server.

- Supported servers
  - github
  - bitbucket

## Resources

### Pull Requests

To fetch pull requests, add the following line to the gitfetcher's configuration file

```yaml
resource: prs
```

It is not possible to fetch multiple resources at the same time. To do so, run the gitfetcher multiple times with different configurations.

Fetching pull requests is supported on the following server types:

:white_check_mark: bitbucket

:white_check_mark: github

### Branches

To fetch branches, add the following line to the gitfetcher's configuration file

```yaml
resource: branches
```

Fetching branches is supported on the following server types:

:white_check_mark: bitbucket

:x: github

### Tags

To fetch tags, add the following line to the gitfetcher's configuration file

```yaml
resource: tags
```

Fetching tags is supported on the following server types:

:white_check_mark: bitbucket

:x: github

### Commits Metadata and Diff for a specific file.

We can use this functionality to see which commits have modified a specific file over a period of time, and to also see the actual content that changed inside the target file. The input config has the same structure for both Bitbucket and Github. An example config would be:

```yaml
org: aquatest
repo: fetcher-test-repo
resource: metadata-and-diff
filter:
  startHash: afeaebf412c6d0b865a36cfdec37fdb46c0fab63
  endHash: 8036cf75f4b7365efea76cbd716ef12d352d7d29
filePath: apps/git-fetcher/src/fetchers/git-fetcher.ts
```

'filter.startHash' and 'filePath' are mandatory parameters. 'filter.endHash' is optional. If 'filter.endHash' is not provided, the default 'endHash' will be 'master'.
Both Bitbucket API and Github API, which are used by the fetcher, require 'startHash' to be exclusive, and 'endHash' to be inclusive. This means that if we have the chain of commits below:

```
c1 -> c2 -> c3 -> c4
```

and we want to see if a file changed in c4, then startHash should be c3. If we want to see if a file changed in c4 or c3, then startHash should be c2.
To obtain the statHash and endHash of a commit, we can simply click on that commit and take its value from the url (for both Bitbucket and Github).
The structure of the output file for Bitbucket is:

```
{
  commitsMetadata: [{},{},...{}],
  diff: [{},{},...,{}]
}
```

The structure of the output file for Github is:

```
{
  commitsMetadata: [{},{},...{}],
  diff: {
    linesAdded: [],
    linesRemoved: []
  }
}
```

Fetching Commits Metadata and Diff for a specific file is supported on the following server types:

:white_check_mark: bitbucket

:white_check_mark: github

## Filtering

It is possible to filter pull requests by certain criteria. Add a `filter` key to the git fetcher config.

### By State (only Bitbucket) - optional

To filter pull requests by state add parameter `filter.state` to the git fetcher configuration file. Possible values are `DECLINED, MERGED, OPEN, ALL`. Omitting this parameter will lead to no filtering which is the same as the `ALL` state filter.

### By Date (only Bitbucket) - optional

To filter pull requests by date add the parameter `filter.startDate` to get pull requests which were updated starting from this date (inclusive).
Add the parameter `filter.endDate` to get pull requests which were updated not later than this date (inclusive). `filter.endDate` can only be used together with `filter.startDate`.

If `filter.startDate` is used without `filter.endDate` then all pull requests between the start date and the current date are fetched.

Both filter values have the format `dd-MM-yyyy`.

The date filter can be combined with the state filter only.

### By Commit Hash (only Bitbucket) - optional

To filter pull requests by commit hashes add the parameter `filter.startHash` to get pull requests which were updated after or at the same time as this commit hash.
Add the parameter `filter.endHash` to get pull requests which where updated no later than this commit hash was created. `filter.endHash` can only be used together with `filter.startHash`.

If `filter.startHash` is used without `filter.endHash` then all pull requests between the start hash and the current date are fetched.

The hash filter can be combined with the state filter only.

### By Tag (only Bitbucket - optional)

It is possible to filter pull requests by providing a start tag and an end tag name. Before the actual filtering takes
place, each tag name is transformed into a date, so that the date can be compared to the pull request date. Tags are
transformed into dates by fetching the commit metadata of the tagged commit. In the subsequent process, the commit's
timestamp will be used for the filtering.

To filter pull requests by tags, add the parameter `filter.startTag` to get pull requests which were updated
after or at the same time as this tag. Add the parameter `filter.endTag` to get pull requests which were
updated no later than this tag.

`filter.endTag` can only be used together with `filter.startTag`. If `filter.startTag` is used without `filter.endTag`
then all pull requests between the start tag and the current date are fetched.

The tag filter can be combined with the state filter only.
