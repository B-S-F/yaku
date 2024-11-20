// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { IBaseComponent } from './baseComponent.js'

export interface ILibraryComponent extends IBaseComponent {
  uuid: string
  name: string
  description: string
  componentType: string
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
