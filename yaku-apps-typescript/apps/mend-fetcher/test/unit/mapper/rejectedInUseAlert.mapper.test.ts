/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { describe, expect, it } from 'vitest'
import { RejectedInUseAlert } from '../../../src/model/rejectedInUseAlert'
import { RejectedInUseAlertDTO } from '../../../src/dto/rejectedInUseAlert.dto'
import { RejectedInUseAlertMap } from '../../../src/mapper/rejectedInUseAlert.mapper'
import { rejectedInUseAlertsDTO } from '../fixtures/dto'
import { rejectedInUseAlertsModel } from '../fixtures/model'

describe('rejectedInUseAlert.mapper', () => {
  it('should return a RejectedInUseAlert object', () => {
    const expected = rejectedInUseAlertsModel[0]

    const result: RejectedInUseAlert = RejectedInUseAlertMap.toModel(
      rejectedInUseAlertsDTO[0],
    )

    expect(result).toStrictEqual(expected)
  })

  it('should return a RejectedInUseAlert DTO', () => {
    const expected = rejectedInUseAlertsDTO[1]

    const result: RejectedInUseAlertDTO = RejectedInUseAlertMap.toDTO(
      rejectedInUseAlertsModel[1],
    )

    expect(result).toStrictEqual(expected)
  })
})
