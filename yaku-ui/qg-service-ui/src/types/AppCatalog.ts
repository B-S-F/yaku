// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type App = {
  id: string
  name: string
  executableName: string
  description?: string
  handbookLink: string
  version: string
  parameters: Parameter[]
  configFile?: ConfigFile
  creationTime: string
  lastModificationTime: string
}

export type BaseParameter<T extends string> = {
  name: string
  type: 'env' | 'arg'
  optional: boolean
  isSecret: boolean
  content: T
}

export type EnumParameter = BaseParameter<'enum'> & { contentEnum: string[] }
export type StringParameter = BaseParameter<'string'>
export type BooleanParameter = BaseParameter<'boolean'>

export type Parameter = EnumParameter | StringParameter | BooleanParameter

export type ConfigFile = {
  name: string
  example: string
  schema: string
  format: 'yaml'
}
