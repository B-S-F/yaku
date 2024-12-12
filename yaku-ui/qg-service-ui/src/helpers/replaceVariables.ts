// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Var, Env } from '~/types/OnyxConfiguration'

export type ReplaceableVars = {
  vars: Env
  env: Env
}

export const replaceVariables = (
  text: string,
  vars: Record<string, string>,
  type: Var,
) => {
  let newText = text
  Object.entries(vars).forEach(([env, value]) => {
    const regex = new RegExp(`\\$\\{{2}\\s*${type}\\.${env}\\s*\\}{2}`, 'g')
    newText = newText.replace(regex, value)
  })
  return newText
}

export const replaceAllVariables = (text: string, vars: ReplaceableVars) => {
  let newText = text
  Object.entries(vars).forEach(([type, values]) => {
    newText = replaceVariables(newText, values, type as keyof ReplaceableVars)
  })

  return newText
}
