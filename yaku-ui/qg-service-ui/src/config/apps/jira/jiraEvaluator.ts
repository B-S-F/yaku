// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const jiraEvaluator: App = {
  name: 'Jira evaluator',
  envs: [
    {
      name: 'JIRA_CONFIG_FILE_PATH',
      description:
        'The path to the fetcher’s and evaluator’s config file. More details about the config file can be found right below.',
      optional: false,
      example: '',
    },
  ],
}
