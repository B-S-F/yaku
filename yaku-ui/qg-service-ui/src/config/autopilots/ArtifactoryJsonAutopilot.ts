// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Autopilot } from '~/types/Autopilot'
import { artifactoryFetcher, jsonEvaluator } from '~/config/apps'

export const ArtifactoryJsonAutopilot: Autopilot = {
  name: 'Artifactory JSON Autopilot',
  description:
    'Use it to get the artifact of a specific project and ensure it has all the conditions you define.',
  apps: [artifactoryFetcher, jsonEvaluator],
}
