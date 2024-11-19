// SPDX-FileCopyrightText: 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { SecurityAlert } from '../../../src/model/securityAlert'
import { SecurityAlertDTO } from '../../../src/dto/securityAlert.dto'
import { SecurityAlertMap } from '../../../src/mapper/securityAlert.mapper'
import { securityAlertsDTO } from '../fixtures/dto'
import { securityAlertsModel } from '../fixtures/model'

describe('securityAlert.mapper', () => {
  it('should return a SecurityAlert object', () => {
    const expected = securityAlertsModel[0]

    const result: SecurityAlert = SecurityAlertMap.toModel(securityAlertsDTO[0])

    expect(result).toStrictEqual(expected)
  })

  it('should return a SecurityAlert DTO', () => {
    const expected = securityAlertsDTO[1]

    const result: SecurityAlertDTO = SecurityAlertMap.toDTO(
      securityAlertsModel[1],
    )

    expect(result).toStrictEqual(expected)
  })
})
