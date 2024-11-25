<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Getting Started with Git Fetcher Autopilot

## Introduction

Git Fetcher Autopilot is a tool that allows you to fetch pull requests from a specified project and resource of your organization on GitHub or Bitbucket platforms. This tutorial provides an introduction to Git Fetcher and demonstrates how to configure it. To understand this guide, it is essential to have completed the following steps:

* Familiarize yourself with [GitHub](https://docs.github.com) or [Bitbucket](https://www.atlassian.com/software/bitbucket/guides/basics/bitbucket-interface#your-work) platforms
* Complete {doc}`../../../onboarding`

### Use-case

For this example, we will walk through the following use case:

* We download a list of pull requests from GitHub.
* We only consider pull requests with labels `bugfix` or `fix`.
* We do not perform any check on the fetched pull requests.

## Preparation

### Download resources

Please download the following files first:

* {download}`qg-config.yaml <resources/qg-config.yaml>`
* {download}`git-fetcher-config.yaml <resources/git-fetcher-config.yaml>`

Upload the files to the {{ PNAME }} service. If you are unsure
how to perform those steps, take a look at the {doc}`../../../quickstart`.

The following steps for editing the configuration files are done directly in the
web interface and the integrated editor.

## Adjust the config files

You should have uploaded the files already to the {{ PNAME }} web interface.

Now open the editor of the config, which you have created for this tutorial.

### Use Git Fetcher in qg-config.yaml

1. Open the {file}`qg-config.yaml` file and take a look at the sections.
    The interesting lines are the definition of the `git-fetcher` autopilot:

    ```{literalinclude} resources/qg-config.yaml
    ---
    language: yaml
    lines: 7-15
    lineno-match:
    ---
    ```

2. Now you need to adapt the environment variables defined for this autopilot script:
    * Line 12: The variable {envvar}`GIT_FETCHER_API_TOKEN` must contain an
      authentication token (If you don't have a token yet, you can get one from
      <https://github.com/settings/tokens>). If your organization is configured with Single Sign-On (SSO), ensure that you [configure the token](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on) such that it is authorized for the required organization.
      As secrets should _never_ be stored in a config file, [create a secret](../../../core/secrets/how-to-add-secrets.md) with the name `GITHUB_PERSONAL_ACCESS_TOKEN` first.
      Then, this secret can be referenced, e.g., as shown in line 15 as `${{ secrets.GITHUB_PERSONAL_ACCESS_TOKEN }}`
    * Line 13: Configures the path to the extra [configuration file](#adjust-git-fetcher-configuration-file)
        specified by setting the {envvar}`GIT_FETCHER_CONFIG_FILE_PATH` environment variable.
        This file contains the detailed settings for fetching pull requests.
        We will take a look at this file in the next section.
    * Line 14: When using GitHub.com, the {envvar}`GIT_FETCHER_SERVER_API_URL` must be set to `https://api.github.com`.
    * Line 15: as we want to connect to GitHub, the variable {envvar}`GIT_FETCHER_SERVER_TYPE` must be set to `github`.

```{note}
Please refer to the [reference documentation](../reference/git-fetcher-reference.md#environment-variables) for
more detailed information and a comprehensive list of all available environment variables for the git fetcher.
```

### Adjust git-fetcher configuration file

For the git fetcher to work correctly, it needs some more information:

* From which GitHub organization and which repository do you want to fetch data?
* What kind of resource do you want to fetch?
* Should all available resources be fetched or only a filtered subset?

In our example, we will fetch pull requests from a repository under
<https://github.com/your-github-org/your-repository/>. And we want to fetch only
pull requests which have a `bugfix` or `fix` label.

This information is given in a separate configuration file:

1. Open the {file}`git-fetcher-config.yaml` file in the editor.

    ```{literalinclude} resources/git-fetcher-config.yaml
    ---
    language: yaml
    ---
    ```

2. Adjust the configuration options in the file and make sure
    that they are set to the correct values:

    * `org`: specifies the GitHub organization you want to fetch from. If your
      GitHub URL is like `https://github.com/my-org`, then use `my-org` for this option.

    * `repo`: is the repository within the organization you want to fetch from. If your
      repo URL is like `https://github.com/my-org/my-repo`, then use `my-repo` for this option.

    * `resource` is the resource you want to fetch. In our example, we want to
      fetch pull requests, so the value must be `prs`.
      (The following synonyms are allowed as well: 'pull-request', 'pull-requests', 'pr', 'prs',
      'pullrequest', 'pullrequests', 'pull', 'pulls')

    * The `labels` field is optional and is used to select only pull requests
      that have at least one of the given labels. PRs can have multiple labels,
      and this will select all PRs that contain at least one of these labels.
      In our example here, all PRs will be fetched which have a `bugfix` label or
      a `fix` label.

      ```{note}
      Filtering based on labels is only available on GitHub and not on Bitbucket.
      See the [official GitHub documentation](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)
      if you want to find out more about managing labels.
      ```

## Run the example

You can now save the files and start a new run of this configuration.
As the `git-fetcher` autopilot doesn't perform any checks, the workflow
result should always be `GREEN`.

You will find a file containing the list of fetched pull requests in the
evidence zip file, which you can download from the service, once the run is finished.

The filename of the downloaded file can be set by setting the environment
variable {envvar}`GIT_FETCHER_OUTPUT_FILE_PATH` to a filename. See the documentation
of {envvar}`GIT_FETCHER_OUTPUT_FILE_PATH` for the default filename.

### Additional Notes

* There is a limit on how many pull requests can be fetched:
  * On GitHub, per each request, a maximum of 100 PRs are fetched.
    (Source: [GitHub](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28))
  * On Bitbucket, a maximum of 25 PRs per fetch are fetched.
    (Source: [Bitbucket](https://developer.atlassian.com/server/bitbucket/rest/v805/api-group-pull-requests/#api-api-latest-projects-projectkey-repos-repositoryslug-pull-requests-get))
