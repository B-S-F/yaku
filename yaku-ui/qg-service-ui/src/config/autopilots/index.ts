// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Autopilot } from '~/types/Autopilot'
import { AzureDevOps } from './AzureDevOps'
import { GitAutopilot } from './GitAutopilot'
import { ManualAnswerAutopilot } from './ManualAnswer'
import { PdfSignature } from './PdfSignature'
import { ArtifactoryJsonAutopilot } from './ArtifactoryJsonAutopilot'
import { JiraAutopilot } from './JiraAutopilot'
import { SharepointAutopilot } from './SharepointAutopilot'
import { SonarqubeAutopilot } from './SonarqubeAutopilot'

export {
  AzureDevOps,
  GitAutopilot,
  ManualAnswerAutopilot,
  PdfSignature,
  SharepointAutopilot,
  SonarqubeAutopilot,
}

export const autopilots: Autopilot[] = [
  ArtifactoryJsonAutopilot,
  AzureDevOps,
  GitAutopilot,
  JiraAutopilot,
  ManualAnswerAutopilot,
  PdfSignature,
  SharepointAutopilot,
  SonarqubeAutopilot,
]
