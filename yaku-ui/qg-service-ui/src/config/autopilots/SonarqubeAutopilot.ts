// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Autopilot } from '~/types/Autopilot'
import { sonarqubeFetcher, sonarqubeEvaluator } from '~/config/apps'

export const SonarqubeAutopilot: Autopilot = {
  name: 'Sonarqube autopilot',
  description:
    'Collect and check the scan report results of your new software version before performing a release.',
  apps: [sonarqubeFetcher, sonarqubeEvaluator],
}
