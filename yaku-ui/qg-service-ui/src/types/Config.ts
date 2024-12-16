// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export type Config = {
  id: number
  name: string
  description?: string
  creationTime: string
  lastModificationTime: string
  files: {
    qgConfig?: string
    qgAnswersSchema?: string
    additionalConfigs?: string[]
  }
}
