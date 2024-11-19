// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { IBaseComponentDTO } from './baseComponent.dto.js'

export interface ILibraryComponentDTO extends IBaseComponentDTO {
  uuid: string
  name: string
  description: string
  componentType: string
  libraryType: string
  directDependency: boolean
  references: {
    url: string
    homePage: string
    genericPackageIndex: string
  }
  groupId: string
  artifactId: string
  version: string
  path: string
}
