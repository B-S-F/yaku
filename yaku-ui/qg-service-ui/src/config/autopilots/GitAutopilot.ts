// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Autopilot } from '~/types/Autopilot'
import { gitFetcher, jsonEvaluator } from '~/config//apps'

export const GitAutopilot: Autopilot = {
  name: 'Git autopilot',
  description:
    'Use the Git autopilot to get a list of pull-requests of a specific project or ensure that all PRs have the conditions you define.',
  apps: [gitFetcher, jsonEvaluator],
}
