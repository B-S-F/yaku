// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Autopilot } from '~/types/Autopilot'
import { manualAnswerEvaluator } from '../apps/manualAnswer/manualAnswerEvaluator'

export const ManualAnswerAutopilot: Autopilot = {
  name: 'Manual Answer autopilot',
  description:
    'An evaluator that checks if a given manual answer has passed it’s expiration time.',
  apps: [manualAnswerEvaluator],
}
