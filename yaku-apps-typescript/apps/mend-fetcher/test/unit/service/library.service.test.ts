// SPDX-FileCopyrightText: 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi } from 'vitest'
import { MendEnvironment } from '../../../src/model/mendEnvironment'
import { Library } from '../../../src/model/library'
import { LibraryService } from '../../../src/service/library.service'
import * as LibraryFetcher from '../../../src/fetcher/library.fetcher'
import { envFixture } from '../fixtures/env'
import { FakeAuthenticator } from '../fixtures/fakeauth'
import { librariesDTO } from '../fixtures/dto'
import { librariesModel } from '../fixtures/model'

describe('library.service', () => {
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

  it("should return list of Project's libraries", async () => {
    const spy = vi.spyOn(LibraryFetcher, 'getLibraryDTOs')
    spy.mockReturnValue(Promise.resolve(librariesDTO))
    const expected: Library[] = librariesModel

    const libraryService: LibraryService = new LibraryService(env)
    const result: Library[] = await libraryService.getAllLibrariesById(
      env.projectToken
    )

    expect(result).toStrictEqual(expected)
  })
})
