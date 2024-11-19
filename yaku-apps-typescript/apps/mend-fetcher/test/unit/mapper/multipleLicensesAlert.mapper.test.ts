/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { describe, expect, it } from 'vitest'
import { MultipleLicensesAlert } from '../../../src/model/multipleLicensesAlert'
import { MultipleLicensesAlertDTO } from '../../../src/dto/multipleLicensesAlert.dto'
import { MultipleLicensesAlertMap } from '../../../src/mapper/multipleLicensesAlert.mapper'
import { multipleLicensesAlertsDTO } from '../fixtures/dto'
import { multipleLicensesAlertsModel } from '../fixtures/model'

describe('multipleLicensesAlert.mapper', () => {
  it('should return a MultipleLicensesAlert object', () => {
    const expected = multipleLicensesAlertsModel[0]

    const result: MultipleLicensesAlert = MultipleLicensesAlertMap.toModel(
      multipleLicensesAlertsDTO[0],
    )

    expect(result).toStrictEqual(expected)
  })

  it('should return a MultipleLicensesAlert DTO', () => {
    const expected = multipleLicensesAlertsDTO[1]

    const result: MultipleLicensesAlertDTO = MultipleLicensesAlertMap.toDTO(
      multipleLicensesAlertsModel[1],
    )

    expect(result).toStrictEqual(expected)
  })
})
