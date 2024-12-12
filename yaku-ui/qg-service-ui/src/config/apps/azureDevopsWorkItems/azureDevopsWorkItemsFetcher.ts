// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { App } from '~/types/App'

export const azureDevopsWorkItemsFetcher: App = {
  name: 'Azure Devops WorkItem fetcher',
  envs: [
    {
      name: 'ADO_API_ORG',
      description:
        'It defines the Azure Devops organization name to fetch data from.',
      example: '${component.adoApiOrg}',
    },
    {
      name: 'ADO_API_PROJECT',
      description:
        'It defines the Azure Devops Project name within the given organization to fetch data from.',
      example: '${component.adoApiProject}',
    },
    {
      name: 'ADO_API_PERSONAL_ACCESS_TOKEN',
      description:
        'To be able to fetch work items from the DevOps organization, you require a personal access token with sufficient permissions. To generate a new personal access token, click on the “User settings” icon in the top right corner of Azure Devops, select “Personal access tokens”, then select “New Token”. Give the token "Read, write & manage" access to work items of the project.',
      example: '${env.ADO_API_PERSONAL_ACCESS_TOKEN}',
    },
    {
      name: 'ADO_APPLY_PROXY_SETTINGS',
      optional: true,
      description:
        'Should be set to true if you are the fetcher behind a proxy.',
      example: '${component.adoApplyProxySettings}',
    },
    {
      name: 'ADO_WORK_ITEMS_JSON_NAME',
      optional: true,
      description:
        'It defines the name of the file where the fetcher response will be stored in. The location of this file is set according to the evidence_path environment variable. If you don’t provide this variable, the file will be called workItems.json by default. This variable is also being used by the ado work items evaluator.',
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
