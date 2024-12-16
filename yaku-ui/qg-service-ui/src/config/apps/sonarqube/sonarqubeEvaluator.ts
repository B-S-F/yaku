// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { App } from '~/types/App'

export const sonarqubeEvaluator: App = {
  name: 'Sonarqube evaluator',
  envs: [
    {
      name: 'SONARQUBE_ONLY_FAILED_METRICS',
      description:
        'If set to true, only failing metrics will be listed in the run report. Default value: false',
      optional: true,
      example: 'true',
    },
  ],
}
