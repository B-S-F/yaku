<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Mend Fetcher

## Setup the environment variables

After doing the [Installation and Build step](../../README.md#installation) make a copy of the `.env.sample` template

```sh
cp .env.sample .env
```

Set the required environment variables in `.env`

```sh
MEND_API_URL=
MEND_SERVER_URL=
MEND_ORG_TOKEN=
MEND_PROJECT_TOKEN=
MEND_USER_EMAIL=
MEND_USER_KEY=
```

Export them to the current shell with

```sh
export $(grep -v '^#' .env | xargs -0)
```

| Environment Variable            | Description                                                                                                                                                      |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MEND_API_URL                    | Mend API URL. Can be obtained in the Mend's Web Portal -> Integrate Tab -> Organization Window ->API Base URL (v2.0)                                             |
| MEND_SERVER_URL                 | MEND Server URL. Integrate Tab -> Organization Window -> Server URL                                                                                              |
| MEND_ORG_TOKEN                  | API Key or Org UUID. Integrate Tab -> Organization Window -> API Key                                                                                             |
| MEND_PROJECT_ID                 | Mend's Portal Project ID(s) separated by commas (,). Projects Tab -> Search/Select Project -> URL Address _id_=ID                                                |
| MEND_PROJECT_TOKEN              | Project Tokens or Project UUIDs separated by commas (,). Integrate Tab -> Project Tokens Window -> Token                                                         |
| MEND_USER_EMAIL                 | Mend Identity user email. User Account Name -> Profile -> Identity Window -> Email                                                                               |
| MEND_USER_KEY                   | Mend API Access Key. User Account Name -> Profile -> User Keys Window -> Generate User Key/Existing User Key                                                     |
| MEND_REPORT_TYPE                | Vulnerabilities or Alerts report. Possible values are `vulnerabilities` or `alerts`                                                                              |
| MEND_ALERTS_STATUS              | Alert status. By default `active` alerts are retrieved                                                                                                           |
| MEND_MIN_CONNECTION_TIME        | Minimum time(ms) between doing requests for quering project's libraries vulnerabilities. Default value is `50` for `50ms` between requests                       |
| MEND_MAX_CONCURRENT_CONNECTIONS | Maximum concurrent requests when quering project's libraries vulnerabilities. Default is `50` concurrent requests. Total(MIN_TIME+MAX_CONCURRENT) is `1000req/s` |
| MEND_RESULTS_PATH               | The path where the `results.json` will be stored. Default is `./`.                                                                                               |

## Run the fetcher

After setting up the environment variables, run the fetcher to retrieve the _vulnerabilities_ with

```
npm start
```

For retrieving the _alerts_ set `MEND_REPORT_TYPE` value to `alerts` by redoing the [Setup the environment variables step](#setup-the-environment-variables) or by simply prepending the values before running the fetcher with

```sh
env MEND_REPORT_TYPE=alerts npm start
```

By default `active` alerts will be retrieved.

Other alert options are

- `all`,
- `ignored`,
- `library_removed`,
- `library_in_house`,
- `library_whitelist`,

and are retrieved by setting the `MEND_ALERTS_STATUS` environment variable
