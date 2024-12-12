// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Config, AutopilotPath, CheckPath } from '~/types'
import type { App } from '~/types/AppCatalog'
import type { SingleCheck } from '~/api'
import { AppFilled } from '~/types/AppEdition'
import {
  OnyxConfiguration,
  AutopilotEnv,
  Autopilot,
  CheckConfiguration,
  Env,
} from '~/types/OnyxConfiguration'
import { incrementNameUntilAvailable } from './incrementBasenameUntilAvailable'
import { formatParameter } from './cli'

export const getFileUrls = (config: Config) =>
  [
    config.files.qgConfig,
    config.files.qgAnswersSchema,
    ...(config.files.additionalConfigs ?? []),
  ].filter((x): x is string => !!x)

/** retrieve the configuration id from a GET config endpoint **/
export const getConfigIdFromEndpoint = (configUrl: string): number =>
  Number(configUrl.split('/').at(-1))

// ---------
//  Parsing
// ---------
/**
 * If more is required to parse the autopilot scripts,
 * https://unjs.io/packages/citty could be the way to go (through experimental)
 * see src/_parser.ts on https://github.com/unjs/citty/blob/main/src/_parser.ts for an implementation
 */

/**
 * find an (app) executable in the autopilot run script line
 * TODO: parse multi-word executable such as "sharepoint upload-files"
 */
export const isExecutableOnLine = (
  executable: App['executableName'],
  line: Autopilot['run'],
): boolean => line.split(' ').findIndex((x) => x === executable) !== -1

/**
 * Retrieve all apps used in the autopilot script
 * @param run the check run commands
 * @param appExecutable the available app identified by their executable in an autopilot script (run)
 */
export const parseAppExecutableFromAutopilotRun = (
  run: Autopilot['run'],
  apps: App[],
): App[] => {
  const lines = run.split('\n')
  return lines.reduce((acc, line) => {
    // find the first word of the line and assuming it is the executable (i.e. there are no env variable in the script)
    const executable = line.split(' ').at(0)
    if (!executable) return acc
    // check if an executable name matches
    const appCandidate = apps.find((app) => app.executableName === executable)
    if (appCandidate) acc.push(appCandidate)
    return acc
  }, [] as App[])
}

export const parseAppValuesOfAutopilot = (
  autopilot: OnyxConfiguration['autopilots'][string],
  app: App,
): Record<string, string> | undefined => {
  const envParameters = (app.parameters ?? []).filter((p) => p?.type === 'env')
  const envs = Object.entries(autopilot.env ?? {})
    .filter(([name, _]) => envParameters.find((p) => p.name === name))
    .map(([name, value]) => {
      return value.startsWith('${{ secrets.')
        ? [name, value.substring(12, value.length - 3)]
        : [name, value]
    })

  const hasMatchingExecutable = (line: string) =>
    isExecutableOnLine(app.executableName, line)
  const executableLine = autopilot.run.split('\n').find(hasMatchingExecutable)
  if (!executableLine) return

  const argParameters = app.parameters.filter((p) => p.type === 'arg')
  const args: [string, string][] = argParameters
    .map((parameter) => ({
      parameter,
      display: formatParameter(parameter.name),
      startAt: executableLine.indexOf(formatParameter(parameter.name)),
    }))
    .filter(({ startAt }) => startAt !== -1)
    .map(({ parameter, display, startAt }) => {
      const { name } = parameter
      if (parameter.content === 'boolean') {
        return [name, 'true']
      } else if (
        parameter.content === 'enum' ||
        parameter.content === 'string'
      ) {
        const valueStartAt = startAt + display.length + 1
        const isMultiword = executableLine.at(valueStartAt) === '"'
        // search for the ending " for multi-word value, or a space for a single word value
        const searchFor = isMultiword ? '"' : ' '
        let valueEndAt = executableLine.indexOf(searchFor, valueStartAt)
        if (valueEndAt === -1) valueEndAt = executableLine.length
        const value = executableLine.substring(valueStartAt, valueEndAt)
        return [name, value]
      } else {
        const _unsupported_param = parameter satisfies never
        throw new Error(
          `unsupported parsing of the parameter "${_unsupported_param}"`,
        )
      }
    })

  return {
    ...envs.reduce(
      (acc, [k, v]) => {
        acc[k] = v
        return acc
      },
      {} as Record<string, string>,
    ),
    ...args.reduce(
      (acc, [k, v]) => {
        acc[k] = v
        return acc
      },
      {} as Record<string, string>,
    ),
  }
}

// ------------
//  Navigation
// ------------
export const singleCheckToCheckPath = (path: SingleCheck): CheckPath => ({
  chapterId: path.chapter,
  requirementId: path.requirement,
  checkId: path.check,
})
export const getCheckFrom = (
  configuration: OnyxConfiguration,
  { chapterId, requirementId, checkId }: CheckPath,
) => {
  const chapter = configuration.chapters[chapterId]
  const requirement = chapter.requirements[requirementId]
  return requirement.checks[checkId]
}

/** a simple utility to get the autopilot reference of a check. It can be used to modify the autopilot ref in place.  */
export const getAutomationFrom = (
  configuration: OnyxConfiguration,
  path: AutopilotPath,
) => getCheckFrom(configuration, path).automation

// ---------
//  Edition
// ---------
/**
 * Reuse an autopilot in a check to automate it
 */
export const addAutomationToCheck = (
  check: CheckConfiguration,
  autopilot: string,
) => {
  check.manual = undefined
  check.automation = {
    autopilot,
  }
}

/**
 * Create an autopilot (with one app) in a check to automate it
 */
export const addAutomationToCheckWithNewAutopilot = (
  configuration: OnyxConfiguration,
  path: CheckPath,
  app: AppFilled & { formattedArgs: string[] },
) => {
  const autopilot = createAutopilot(configuration, app)

  const check = getCheckFrom(configuration, path)
  addAutomationToCheck(check, autopilot.id)
}

export const deleteAutomationOfCheck = (check: CheckConfiguration) => {
  const autopilotRef = check.automation!.autopilot
  delete check.automation
  check.manual = {
    status: 'UNANSWERED',
    reason: `the previous autopilot ${autopilotRef} is not used anymore.`,
  }
}

export const createAutopilot = (
  configuration: OnyxConfiguration,
  app: AppFilled & { formattedArgs: string[] },
) => {
  const unavailableAutopilotIds = Array.from(
    Object.keys(configuration.autopilots),
  )
  const autopilotId = incrementNameUntilAvailable(
    `${app.app.executableName}-autopilot`,
    unavailableAutopilotIds,
  )

  // add the app envs at the end of the autopilot. Overwrite existing ones if needed.
  const env = app.envs.reduce((acc, v) => {
    acc[v.parameter.name] = v.parameter.isSecret
      ? `\${{ secrets.${v.value} }}`
      : v.value
    return acc
  }, {} as AutopilotEnv)

  // Fill the autopilot with the app
  configuration.autopilots[autopilotId] = {
    run: `${app.app.executableName}${app.formattedArgs.length > 0 ? ` ${app.formattedArgs.join(' ')}` : ''}\n`,
    env: Object.keys(env).length > 0 ? env : undefined,
  }

  return {
    id: autopilotId,
    ...configuration.autopilots[autopilotId],
  }
}

export const updateAutopilotEnv = (
  configuration: OnyxConfiguration,
  autopilotId: string,
  updatedEnv: Env,
) => {
  const autopilotDefinition = configuration.autopilots[autopilotId]
  if (!autopilotDefinition) return
  autopilotDefinition.env = {
    ...autopilotDefinition.env,
    ...updatedEnv,
  }
}

/**
 * Add an app to an existing autopilot
 */
export const addApp = (
  configuration: OnyxConfiguration,
  autopilotId: string,
  app: AppFilled & { formattedArgs: string[] },
) => {
  const autopilotDefinition = configuration.autopilots[autopilotId]
  const script = autopilotDefinition.run.split('\n')

  // add the new app to the script
  const newLineForApp = `${app.app.executableName}${app.formattedArgs.length > 0 ? ` ${app.formattedArgs.join(' ')}` : ''}`
  script.push(newLineForApp)
  autopilotDefinition.run = script.join('\n')

  // add the app envs at the end of the autopilot. Overwrite existing ones if needed.
  const env = app.envs.reduce((acc, v) => {
    acc[v.parameter.name] = v.parameter.isSecret
      ? `\${{ secrets.${v.value} }}`
      : v.value
    return acc
  }, {} as AutopilotEnv)
  const newEnvs = { ...autopilotDefinition.env, ...env }
  autopilotDefinition.env =
    Object.keys(newEnvs).length > 0 ? newEnvs : undefined
}

/**
 * Update the first matching app in the autopilot
 */
export const updateApp = (
  configuration: OnyxConfiguration,
  autopilotId: string,
  app: AppFilled & { formattedArgs: string[] },
) => {
  const autopilotDefinition = configuration.autopilots[autopilotId]
  // update the app command
  const script = autopilotDefinition.run.split('\n')
  const hasMatchingExecutable = (line: string) =>
    isExecutableOnLine(app.app.executableName, line)
  const lineAt = script.findIndex(hasMatchingExecutable)
  script[lineAt] =
    `${app.app.executableName}${app.formattedArgs.length > 0 ? ` ${app.formattedArgs.join(' ')}` : ''}`
  autopilotDefinition.run = script.join('\n')
  // add the app envs at the end of the autopilot. Overwrite existing ones if needed.
  const env = app.envs.reduce((acc, v) => {
    acc[v.parameter.name] = v.parameter.isSecret
      ? `\${{ secrets.${v.value} }}`
      : v.value
    return acc
  }, {} as AutopilotEnv)
  const newEnvs = { ...autopilotDefinition.env, ...env }
  autopilotDefinition.env =
    Object.keys(newEnvs).length > 0 ? newEnvs : undefined
}

export const deleteApp = (
  configuration: OnyxConfiguration,
  autopilotId: string,
  app: App,
) => {
  const autopilotDefinition = configuration.autopilots[autopilotId]
  if (!autopilotDefinition) return

  // remove the app command
  const script = autopilotDefinition.run.split('\n')
  const hasMatchingExecutable = (line: string) =>
    isExecutableOnLine(app.executableName, line)
  const lineAt = script.findIndex(hasMatchingExecutable)
  script.splice(lineAt, 1)
  autopilotDefinition.run = script.join('\n')

  // remove env variables related to the app
  const env = autopilotDefinition.env
  if (env) {
    app.parameters
      .filter((p) => p.type === 'env')
      .map((p) => p.name)
      .forEach((envName) => {
        delete env[envName]
      })
    if (Object.keys(env).length === 0) {
      autopilotDefinition.env = undefined
    }
  }

  // delete a potential empty autopilot
  if (!autopilotDefinition.run) {
    delete configuration.autopilots[autopilotId]
  }
}
