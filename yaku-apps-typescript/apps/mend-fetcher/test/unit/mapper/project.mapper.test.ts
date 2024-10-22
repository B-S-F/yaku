/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { describe, expect, it } from 'vitest'
import { Project } from '../../../src/model/project'
import { ProjectDTO } from '../../../src/dto/project.dto'
import { ProjectMap } from '../../../src/mapper/project.mapper'
import { projectDTO } from '../fixtures/dto'
import { projectModel } from '../fixtures/model'

describe('project.mapper', () => {
  it('should return a Project object', () => {
    const expected = projectModel

    const result: Project = ProjectMap.toModel(projectDTO)

    expect(result).toStrictEqual(expected)
  })

  it('should return a Project DTO', () => {
    const expected = projectDTO

    const result: ProjectDTO = ProjectMap.toDTO(projectModel)

    expect(result).toStrictEqual(expected)
  })
})
