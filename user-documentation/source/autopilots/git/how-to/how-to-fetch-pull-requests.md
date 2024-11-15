# How to fetch all pull requests with a certain label from GitHub

## Introduction

For retrieving all pull requests from GitHub that have a certain label we need to do two steps:

1. Adjust the qg-config.yaml file to include the git fetcher in the autopilot script, together with the necessary configuration for the access to GitHub.
2. Provide the separate config file for the Git fetcher with the label filter condition.

### Adjust environment variables

By taking these steps, you can successfully configure the desired settings for the Git Fetcher.

1. Set authentication to the `basic` authentication method.
2. Provide the username and corresponding app's client secret as the password (e.g., `john` and `secret`) to access the resources.
3. Set the Git Fetcher server type to `github` if you intend to fetch requests from GitHub and provide the corresponding GitHub server API URL `https://api.github.com`.

4. Specify the config path to access your config file.
5. Specify the output path for storing the results.
   Our environment look as follows:

```text
 GIT_FETCHER_SERVER_API_URL=https://api.github.com
 GIT_FETCHER_SERVER_AUTH_METHOD=basic
 GIT_FETCHER_SERVER_TYPE=github
 GIT_FETCHER_USERNAME=john
 GIT_FETCHER_PASSWORD=secret
 GIT_FETCHER_CONFIG_FILE_PATH=/configs/git-fetcher-config-github.yml
 GIT_FETCHER_OUTPUT_FILE_PATH=git-fetcher-data.json
```

An example for a full {file}`qg-config.yaml` can be found [here](../reference/git-fetcher-reference.md).

### Adjust the config file

Now, you need to adapt the configuration file to identify the repository of the organization you want to fetch your pull requests from and its resource.

1. Replace org value with the name of your GitHub "your-github-organization".
2. Set the repository to "your-repository" your PRs are located.
3. Set the resource to "prs" to request pull-requests.
4. Provide the labels field with the filter condition: e.g. `duplicate` thereby indicating that only pull requests with the label "duplicate" will be fetched.

This is a sample file:

```yaml
org: your-github-org
repo: your-repository
resource: prs
labels:
- duplicate
```
