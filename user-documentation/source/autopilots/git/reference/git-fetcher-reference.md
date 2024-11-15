# Fetcher Background Information

A fetcher that fetches git resources data from a git server and stores it in the evidence path.
The evidence path is set during the execution of a run and read as an environment variable by any evaluator used to evaluate the data fetched by git fetcher.

At the moment, the fetcher supports fetching pull-requests from GitHub and Bitbucket servers.
Additionally, fetching branch and tag meta data from Bitbucket servers is also supported.

```{note}
You can also use the [GitHub CLI](https://cli.github.com/) to fetch data from GitHub servers. For more details, see {doc}`../tutorials/github-cli-tutorial`.
```

## Prerequisites

The user id that is set for the fetcher in {envvar}`GIT_FETCHER_USERNAME` or the username whose API token is used in {envvar}`GIT_FETCHER_API_TOKEN` must have access to the git project in order for the fetcher to work.

## Environment variables

```{envvar} GIT_FETCHER_SERVER_TYPE
Type of the git server. Supported types are: [github, bitbucket]
```

```{envvar} GIT_FETCHER_SERVER_API_URL
Git server api url.

**Examples:**

- GitHub enterprise server: https://github.companycloud.com/api/v3
- Bitbucket server: https://bitbucket.server.com/rest/api/1.0

```

```{envvar} GIT_FETCHER_SERVER_AUTH_METHOD
Authentication method to use.

**Supported methods:**

- basic: username & password
- token: bearer token
```

```{envvar} GIT_FETCHER_API_TOKEN
Bearer token if **token** authentication method is defined.
```

```{envvar} GIT_FETCHER_USERNAME
Username if **basic** authentication method is defined.
```

```{envvar} GIT_FETCHER_PASSWORD
Password if **basic** authentication method is defined.
```

```{envvar} GIT_FETCHER_OUTPUT_FILE_PATH
Filename to which the fetched data will be stored in the evidence path. If not specified, default value is {file}`git-fetcher-data.json`.
```

```{envvar} GIT_FETCHER_CONFIG_FILE_PATH
The path to the fetcher's config file. If not specified, default value is {file}`git-fetcher-config.yml`. More details about the config file can be found right below.
```

## The fetcher's config file

The definition of which resources to query from the git server is given by a yaml file.
The location of this file is then referenced by the {envvar}`GIT_FETCHER_CONFIG_FILE_PATH` environment variable.

This config file should have the following structure:

```{literalinclude} resources/git-fetcher-config.yaml
---
language: yaml
---
```

## Example config

Below is an example configuration file that runs git fetcher and json evaluator. The autopilot (git fetcher + json evaluator) is configured in lines: 7-19. Required variables and secrets are read from provided run variables or secrets. It will run the git fetcher to get data from GitHub server and then use json-evaluator to evaluate the fetched data.
Then the autopilot is used by the check 1 in line 34 which is part of requirement 1.15

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-19, 34
---
```
