/**
 * Copyright (c) 2023 by grow platform GmbH
 */

import { describe, expect, it } from 'vitest'
import { Library } from '../../../src/model/library'
import { LibraryDTO } from '../../../src/dto/library.dto'
import { LibraryMap } from '../../../src/mapper/library.mapper'
import { librariesDTO } from '../fixtures/dto'
import { librariesModel } from '../fixtures/model'

describe('library.mapper', () => {
  it('should return a Library object when data has no locations', () => {
    const expected = librariesModel[0]

    const result: Library = LibraryMap.toModel(librariesDTO[0])

    expect(result).toStrictEqual(expected)
  })

  it('should return a Library object when data includes locations', () => {
    const expected = librariesModel[1]
    const result: Library = LibraryMap.toModel(librariesDTO[1])

    expect(result).toStrictEqual(expected)
  })

  it('should return a Library DTO when data has no CopyrightReference', () => {
    const expected = librariesDTO[0]

    const result: LibraryDTO = LibraryMap.toDTO(librariesModel[0])

    expect(result).toStrictEqual(expected)
  })

  it('should return a Library DTO when data includes CopyrightReference', () => {
    const expected = librariesDTO[1]

    const result: LibraryDTO = LibraryMap.toDTO(librariesModel[1])

    expect(result).toStrictEqual(expected)
  })
})
