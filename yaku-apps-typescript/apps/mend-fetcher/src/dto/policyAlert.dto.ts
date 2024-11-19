// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { IAlertDTO } from './alert.dto.js'
import { IBaseComponentDTO } from './baseComponent.dto.js'

export class PolicyAlertDTO implements IAlertDTO {
  constructor(
    public uuid: string,
    public name: string,
    public type: string,
    public component: IBaseComponentDTO,
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
    public policyName: string,
  ) {}
}
