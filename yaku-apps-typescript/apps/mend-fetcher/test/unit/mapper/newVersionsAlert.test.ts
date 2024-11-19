/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { describe, expect, it } from 'vitest'
import { NewVersionsAlert } from '../../../src/model/newVersionsAlert'
import { NewVersionsAlertDTO } from '../../../src/dto/newVersionsAlert.dto'
import { NewVersionsAlertMap } from '../../../src/mapper/newVersionsAlert.mapper'
import { newVersionsAlertsDTO } from '../fixtures/dto'
import { newVersionsAlertsModel } from '../fixtures/model'

describe('newVersionsAlert.mapper', () => {
  it('should return a NewVersionsAlert object', () => {
    const expected = newVersionsAlertsModel[0]

    const result: NewVersionsAlert = NewVersionsAlertMap.toModel(
      newVersionsAlertsDTO[0],
    )

    expect(result).toStrictEqual(expected)
  })

  it('should return a NewVersionsAlert DTO', () => {
    const expected = newVersionsAlertsDTO[1]

    const result: NewVersionsAlertDTO = NewVersionsAlertMap.toDTO(
      newVersionsAlertsModel[1],
    )

    expect(result).toStrictEqual(expected)
  })
})
