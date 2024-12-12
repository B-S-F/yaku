// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const artifactoryFetcher: App = {
  name: 'Artifactory fetcher',
  envs: [
    {
      name: 'ARTIFACTORY_URL',
      description:
        'The URL of the Artifactory server where the evidence artifact is located.',
      example: '${env.ARTIFACTORY_URL}',
    },
    {
      name: 'REPOSITORY_NAME',
      description: 'The name of the repository where the artifact is stored.',
      example: '${env.REPOSITORY_NAME}',
    },
    {
      name: 'ARTIFACT_PATH',
      description:
        'The path to the artifact in the repository, without the repository name.',
      example: '${env.ARTIFACT_PATH}',
    },
    {
      name: 'ARTIFACTORY_USERNAME',
      description: 'A valid user NT-ID.',
      example: '${env.ARTIFACTORY_USERNAME}',
    },
    {
      name: 'ARTIFACTORY_API_KEY',
      description:
        'A valid Artifactory API key of the defined ARTIFACTORY_USERNAME. To get your API key from Artifactory: go to Artifactory UI, click on your username on the top-right corner and choose Edit Profile. From there you can copy the API Key.',
      example: '${env.ARTIFACTORY_API_KEY}',
    },
  ],
}
