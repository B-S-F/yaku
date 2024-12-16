// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const sonarqubeFetcher: App = {
  name: 'Sonarqube fetcher',
  envs: [
    {
      name: 'SONARQUBE_HOSTNAME',
      description: 'The hostname of the Sonarqube server api.',
      optional: false,
      example: '',
    },
    {
      name: 'SONARQUBE_ENDPOINT',
      description: 'The path on the host leading to the Sonarqube endpoint.',
      optional: false,
      example: '/sonarqube',
    },
    {
      name: 'SONARQUBE_PORT',
      description: 'The port number used to to connect with the Sonarqube api.',
      optional: false,
      example: '',
    },
    {
      name: 'SONARQUBE_PROTOCOL',
      description:
        'The protocol used to to connect with the Sonarqube api. Default to https.',
      optional: true,
      example: 'https',
    },
    {
      name: 'SONARQUBE_PROJECT_KEY',
      description:
        'The project key from the Sonarqube portal. Not the project name, but often very similar.',
      optional: false,
      example: '',
    },
    {
      name: 'SONARQUBE_PROJECT_TOKEN',
      description: 'The API token generated from the Sonarqube portal.',
      optional: false,
      example: '',
    },
  ],
}
