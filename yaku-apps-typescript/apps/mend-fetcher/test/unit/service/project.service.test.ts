/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { Project } from '../../../src/model/project'
import { ProjectService } from '../../../src/service/project.service'
import * as ProjectFetcher from '../../../src/fetcher/project.fetcher'
import { envFixture } from '../fixtures/env'
import { FakeAuthenticator } from '../fixtures/fakeauth'
import { projectDTO, projectVitalsDTO } from '../fixtures/dto'
import { projectModel, projectVitalsModel } from '../fixtures/model'
import { ProjectVitals } from '../../../src/model/projectVitals'

describe('project.service', () => {
  const env: MendEnvironment = envFixture

  vi.mock('Authenticator', () => {
    const mock = {
      getInstance: vi.fn(() => new FakeAuthenticator(env)),
    }
    return mock
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('should return a Project object', async () => {
    const spy = vi.spyOn(ProjectFetcher, 'getProjectDTO')
    spy.mockReturnValue(Promise.resolve(projectDTO))
    const expected = projectModel

    const projectService = new ProjectService(env)
    const result: Project = await projectService.getProjectByToken(
      env.projectToken
    )

    expect(result).toStrictEqual(expected)
  })

  it('should return a ProjectVitals object', async () => {
    const spy = vi.spyOn(ProjectFetcher, 'getProjectVitalsDTO')
    spy.mockReturnValue(Promise.resolve(projectVitalsDTO))
    const expected = projectVitalsModel

    const projectService = new ProjectService(env)
    const result: ProjectVitals = await projectService.getProjectVitals(
      env.projectToken
    )

    expect(result).toStrictEqual(expected)
  })
})
