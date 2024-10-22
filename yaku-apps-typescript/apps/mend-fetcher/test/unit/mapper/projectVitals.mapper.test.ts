/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { describe, expect, it } from 'vitest'
import { ProjectVitals } from '../../../src/model/projectVitals'
import { ProjectVitalsDTO } from '../../../src/dto/projectVitals.dto'
import { ProjectVitalsMap } from '../../../src/mapper/projectVitals.mapper'
import { projectVitalsDTO } from '../fixtures/dto'
import { projectVitalsModel } from '../fixtures/model'

describe('projectVitals.mapper', () => {
  it('should return a ProjectVitals object', () => {
    const expected = projectVitalsModel

    const result: ProjectVitals = ProjectVitalsMap.toModel(projectVitalsDTO)

    expect(result).toStrictEqual(expected)
  })

  it('should return a ProjectVitals DTO', () => {
    const expected = projectVitalsDTO

    const result: ProjectVitalsDTO = ProjectVitalsMap.toDTO(projectVitalsModel)

    expect(result).toStrictEqual(expected)
  })
})
