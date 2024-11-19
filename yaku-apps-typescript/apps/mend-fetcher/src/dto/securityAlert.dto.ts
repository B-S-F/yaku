// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { IAlertDTO } from './alert.dto.js'
import { ILibraryComponentDTO } from './libraryComponent.dto.js'

export class SecurityAlertDTO implements IAlertDTO {
  constructor(
    public uuid: string,
    public name: string,
    public type: string,
    public component: ILibraryComponentDTO,
    public alertInfo: {
      status: string
      comment:
        | {
            comment: string
            date: string
          }
        | Record<string, never>
      detectedAt: string
      modifiedAt: string
    },
    public project: {
      uuid: string
      name: string
      path: string
      productUuid: string
    },
    public product: {
      uuid: string
      name: string
    },
    public vulnerability: {
      name: string
      type: string
      description: string
      score: number
      severity: string
      publishDate: string
      modifiedDate: string
      vulnerabilityScoring: {
        score: number
        severity: string
        type: string
      }[]
      references?: {
        value: string
        source: string
        url: string
        signature: boolean
        advisory: boolean
        patch: boolean
      }[]
    },
    public topFix: {
      id: number
      vulnerability: string
      type: string
      origin: string
      url: string
      fixResolution: string
      date: string
      message: string
      extraData: Record<string, never>
    },
    public effective: string
  ) {}
}
