// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const jiraFetcher: App = {
  name: 'Jira fetcher',
  envs: [
    {
      name: 'JIRA_URL',
      description: 'The Jira tracker server url.',
      optional: false,
      example: '',
    },
    {
      name: 'JIRA_USERNAME',
      description: 'A valid user NT-ID.',
      optional: false,
      example: '',
    },
    {
      name: 'JIRA_USER_PORTAL_PASSWORD',
      description:
        'The user WAM/Portal password. For technical users it might be different from ldap password.',
      optional: false,
      example: '',
    },
    {
      name: 'JIRA_CONFIG_FILE_PATH',
      description:
        'The path to the fetcher’s config file. More details about the config file can be found right below.',
      optional: false,
      example: '',
    },
  ],
}
