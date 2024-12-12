// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const azureDevopsWorkItemsEvaluator: App = {
  name: 'Azure Devops WorkItem evaluator',
  envs: [
    {
      name: 'ADO_WORK_ITEMS_JSON_NAME',
      description: 'references the output file name of the Ado fetcher.',
      example: 'workItems.json',
    },
    {
      name: 'ADO_CONFIG_FILE_PATH',
      description:
        'It is the path to the fetcher’s and evaluator’s config file. More details about the config file can be found in the documentation.',
      example: '${component.adoConfigFilePath}',
    },
  ],
}
