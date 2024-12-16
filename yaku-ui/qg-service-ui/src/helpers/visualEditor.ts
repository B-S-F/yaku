// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { App, Parameter } from '~/types/AppCatalog'
import type { Autopilot } from '~/types/OnyxConfiguration'
import type { Badge } from '~/types'
import { formatParameter } from './cli'

export const MANDATORY_VAR_BADGE: Badge = {
  label: 'Mandatory variables',
  color: 'MajorWarning',
}

export const formatAppBadge = (
  parametersMissing: number,
): Badge | undefined => {
  if (parametersMissing >= 1) {
    return {
      ...MANDATORY_VAR_BADGE,
      label:
        parametersMissing === 1
          ? '1 variable'
          : `${parametersMissing} variables`,
    }
  }
}

export const getUnsetRequiredParameters = (
  autopilot: Autopilot,
  app: App,
): Parameter[] => {
  const requiredValues =
    app?.parameters && app?.parameters?.length
      ? app.parameters.filter((p) => !p.optional)
      : []

  const requiredEnvs = requiredValues.filter((e) => e.type === 'env')
  const envs = autopilot?.env
  const missingEnvs =
    envs !== undefined
      ? requiredEnvs.filter((envName) => !envs[envName.name])
      : []

  const requiredArg = requiredValues.filter((e) => e.type === 'arg')
  const scriptLine = autopilot.run
    .split('\n')
    .find((scriptLine) => scriptLine.trim().startsWith(app.executableName))
  if (!scriptLine) return missingEnvs
  const missingParameters = requiredArg.filter(
    (arg) => !scriptLine.includes(formatParameter(arg.name)),
  )
  return missingEnvs.concat(missingParameters)
}
