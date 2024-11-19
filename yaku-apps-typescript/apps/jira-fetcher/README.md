<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# jira-fetcher

**_NOTE:_** The jira-fetcher cannot run on an internet client, it needs a BCN environment to execute properly!

The jira-fetcher honors the environment variables for http proxy configuration (`http_proxy`, `https_proxy`, `HTTP_PROXY` etc.).

For more information about precedence and interpretation please see the [documentation of the underlying module](https://github.com/Rob--W/proxy-from-env#environment-variables).
