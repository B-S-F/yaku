// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { IBaseComponentDTO } from './baseComponent.dto.js'
import { ILibraryComponentDTO } from './libraryComponent.dto.js'

export interface IAlertDTO {
  uuid: string
  name: string
  type: string
  component: IBaseComponentDTO | ILibraryComponentDTO
  alertInfo: {
    status: string
    comment:
      | {
          comment: string
          date: string
        }
      | Record<string, never>
    detectedAt: string
    modifiedAt: string
  }
  project: {
    uuid: string
    name: string
    path: string
    productUuid: string
  }
}
