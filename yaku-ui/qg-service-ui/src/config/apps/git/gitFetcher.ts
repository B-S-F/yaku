// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const gitFetcher: App = {
  name: 'Git fetcher',
  envs: [
    {
      name: 'GIT_FETCHER_SERVER_TYPE',
      description:
        'Type of the git server. Supported types are: [github, bitbucket]',
      example: 'github',
    },
    {
      name: 'GIT_FETCHER_SERVER_API_URL',
      description: 'Git server api url.',
      example: 'https://github.companycloud.com/api/v3',
    },
    {
      name: 'GIT_FETCHER_SERVER_AUTH_METHOD',
      description: 'Authentication method to use. Supported: [basic, token]',
      example: 'basic',
    },
    {
      name: 'GIT_FETCHER_API_TOKEN',
      description: 'Bearer token if token authentication method is defined.',
      example: '',
    },
    {
      name: 'GIT_FETCHER_USERNAME',
      description: 'Username if basic authentication method is defined.',
    },
    {
      name: 'GIT_FETCHER_PASSWORD',
      description: 'Password if basic authentication method is defined.',
    },
    {
      name: 'GIT_FETCHER_OUTPUT_FILE_PATH',
      description:
        'Filename to which the fetched data will be stored in the evidence path. If not specified, default value is git-fetcher-data.json.',
    },
    {
      name: 'GIT_FETCHER_CONFIG_FILE_PATH',
      description:
        'The path to the fetcher’s config file. If not specified, default value is git-fetcher-config.yml. More details about the config file can be found right below.',
    },
  ],
}
