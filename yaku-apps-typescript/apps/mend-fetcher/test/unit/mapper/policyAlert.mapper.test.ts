// SPDX-FileCopyrightText: 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { PolicyAlert } from '../../../src/model/policyAlert'
import { PolicyAlertDTO } from '../../../src/dto/policyAlert.dto'
import { PolicyAlertMap } from '../../../src/mapper/policyAlert.mapper'
import { policyAlertsDTO } from '../fixtures/dto'
import { policyAlertsModel } from '../fixtures/model'

describe('policyAlert.mapper', () => {
  it('should return a PolicyAlert object', () => {
    const expected = policyAlertsModel[0]

    const result: PolicyAlert = PolicyAlertMap.toModel(policyAlertsDTO[0])

    expect(result).toStrictEqual(expected)
  })

  it('should return a PolicyAlert DTO', () => {
    const expected = policyAlertsDTO[1]

    const result: PolicyAlertDTO = PolicyAlertMap.toDTO(policyAlertsModel[1])

    expect(result).toStrictEqual(expected)
  })
})
