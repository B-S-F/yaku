<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Getting Started with GitHub CLI

## Introduction

The [GitHub CLI](https://cli.github.com/) is a command-line tool provided by GitHub that allows you to perform various actions on GitHub projects. This tutorial gives an introduction to the GitHub CLI and demonstrates how to use it. To understand this guide, it is essential to have completed the following steps:

- Familiarize yourself with [GitHub](https://docs.github.com)
- Familiarize yourself with [GitHub CLI](https://cli.github.com/)
- Complete {doc}`../../../onboarding`

### Use-case

For this example, we will walk through the following use case:

- We download a list of issues from GitHub.
- We only consider issues with label `bug`.
- We do not perform any check on the fetched issues.

## Preparation

### Download resources

Please download the following files first:

- {download}`qg-config.yaml <resources/gh-cli-qg-config.yaml>`

Upload the file as {file}`qg-config.yaml` to the {{ PNAME }} service. If you are unsure
how to perform those steps, take a look at the {doc}`../../../quickstart`.

The following steps for editing the configuration files are done directly in the
web interface and the integrated editor.

## Adjust the config files

You should have uploaded the files already to the {{ PNAME }} web interface.

Now open the editor of the config, which you have created for this tutorial.

### Use GitHub CLI in qg-config.yaml

1. Open the {file}`qg-config.yaml` file and take a look at the sections.
   The interesting lines are the definition of the `github-cli` autopilot:

   ```{literalinclude} resources/gh-cli-qg-config.yaml
   ---
   language: yaml
   lines: 7-15
   lineno-match:
   ---
   ```

2. Now you need to adapt the environment variables defined for this autopilot script:
   - Line 14: The variable {envvar}`GH_TOKEN` must contain an
     authentication token (If you don't have a token yet, you can get one from
     <https://github.com/settings/tokens>).
     As secrets should _never_ be stored in a config file, [create a secret](../../../core/secrets/how-to-add-secrets.md) with the name `GH_TOKEN` first.
     Then, this secret can be referenced, e.g., as shown in line 13 as `${{ secrets.GH_TOKEN }}`
   - Line 15: Configures your GitHub organization. Replace `your-github-org` with the name of your GitHub organization.
   - Line 16: Configures your GitHub repository. Replace `your-repository` with the name of your GitHub repository.

Alternatively, you can also use our `gh-app auth` command to authenticate as a GitHub App instead of a personal access token. To use this, you need to add the following environment variables:

- `GH_APP_ID`: The ID of the GitHub App.
- `GH_APP_PRIVATE_KEY`: The private key of the GitHub App.
- `GH_APP_ORG`: The organization of the GitHub App.
- `GH_APP_REPO`: The repository of the GitHub App (optional).

   ```{literalinclude} resources/gh-cli-qg-config.yaml
   ---
   language: yaml
   lines: 16-31
   lineno-match:
   ---
   ```

```{note}
If you are behind a proxy, the `gh-app` will use the proxy settings from the environment variables `HTTP_PROXY` or `HTTPS_PROXY`.
```

## Run the example

You can now save the files and start a new run of this configuration.
As the `github-cli` autopilot doesn't perform any checks, the workflow
result should always be `GREEN`.

You will find a file containing the list of fetched issues in the
evidence zip file, which you can download from the service, once the run is finished.

### Additional Notes

- Line 9: `gh repo clone ${{ env.GH_ORG }}/${{ env.GH_REPO }}` clones the repository from GitHub. You can find more information about the `gh repo clone` command in the [GitHub CLI documentation](https://cli.github.com/manual/gh_repo_clone).
- Line 11: `gh issue list --label type:bug --json state,title,body > issues.json` lists all issues with the label `bug` and stores the json output with the fields `state`, `title`, and `body` in the file `issues.json`. You can find more information about the `gh issue list` command in the [GitHub CLI documentation](https://cli.github.com/manual/gh_issue_list).
