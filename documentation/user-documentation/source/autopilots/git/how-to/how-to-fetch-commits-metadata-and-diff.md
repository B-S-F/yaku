<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# How to get metadata of commits

We can use this functionality to see:

- which commits have modified a specific file over a period of time
- the metadata about the commits mentioned above (such as the author of the commit)
- the content which was added/removed

## 1. Choose a starting commit (and optionally an ending commit)

Both Bitbucket API and Github API, which are used by the fetcher, require the starting commit to be exclusive, and the ending commit to be inclusive. This means that if we have the chain of commits below:

```text
c1 -> c2 -> c3 -> c4
```

and we want to see if a file changed in c4, then the starting commit should be c3. If we want to see if a file changed in c4 or c3, then starting commit should be c2.

## 2. Find the ID of the starting commit (and optionally the ID of the ending commit)

To find the IDs, the procedure is the same for both Bitbucket and Github:

1. Click on your repo.

```{image} ../../../_static/git-images/commits-metadata-and-diff-1.png
:width: 100%
:class: git-commits-and-diff
```

2. Click on the commit history button. You can find it in the left bar in Bitbucket.

```{image} ../../../_static/git-images/commits-metadata-and-diff-2.png
:width: 100%
:class: git-commits-and-diff
```

3. Click on the commit you have selected as starting point (or ending point). The commit is usually indicated by the commit hash, which is this sequence of numbers and letters that appears in each row for each of the commits.

```{image} ../../../_static/git-images/commits-metadata-and-diff-3.png
:width: 100%
:class: git-commits-and-diff
```

4. You can copy the ID of the commit from the URL.

```{image} ../../../_static/git-images/commits-metadata-and-diff-4.png
:width: 100%
```

## 3. Adjust the config file

- If there is a line already starting with `resource:` change it to `resource: metadata-and-diff`. If there is no such line yet, just create one.
- Same as above for `filter.startHash`. `filter.startHash` should contain the starting commit ID.
- Same as above for `filter.endHash`. `filter.endHash` can contain the optional ending commit ID.
- Same as above for `filePath`. `filePath` should contain the path of the file you are interested in.

The config should look like the example below:

```yaml
org: <your-org-name>
repo: fetcher-test-repo
resource: metadata-and-diff
filter:
  startHash: afeaebf412c6d0b865a36cfdec37fdb46c0fab63
  endHash: 8036cf75f4b7365efea76cbd716ef12d352d7d29
filePath: apps/git-fetcher/src/fetchers/git-fetcher.ts
```

`filter.startHash` and `filePath` are mandatory parameters. `filter.endHash` is optional.
**IMPORTANT**: If `filter.endHash` is not provided, the default value for `endHash` will be 'master'.

## 4. Check the results in the output file

The output file will have the following structure:

- For Bitbucket:

```text
{
  commitsMetadata: [{},{},...{}],
  diff: [{},{},...,{}]
}
```

- For Github:

```text
{
  commitsMetadata: [{},{},...{}],
  diff: {
    linesAdded: [],
    linesRemoved: []
  }
}
```
