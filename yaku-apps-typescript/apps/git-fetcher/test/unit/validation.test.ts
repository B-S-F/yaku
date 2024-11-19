// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  allowedFilterState,
  AllowedFilterStateType,
  GitFetcherConfig,
} from '../../src/model/config-file-data'
import { validateFetcherConfig } from '../../src/utils/validation'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'

const testPath = 'foo/bar'

vi.mock('fs')

describe('ValidateFetcherConfig', async () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('throws ENOENT error, when file path points to no file', async () => {
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory')
    })

    await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
      'ENOENT: no such file or directory'
    )
  })

  it('throws error, when readFiles returns format that cannot be parsed into yaml', async () => {
    vi.mocked(readFileSync).mockReturnValue('foo: bar, foo: bar')

    await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
      'Nested mappings are not allowed'
    )
  })

  it('throws an error with the corresponding error message, when the config has an invalid structure', async () => {
    vi.mocked(readFileSync).mockReturnValue('foo: bar')
    await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
      'Validation error: Required at "org"; Required at "repo"; Required at "resource"'
    )
  })

  it('returns git fetcher config, when file content is valid', async () => {
    const gitFetcherConfig: GitFetcherConfig = {
      org: 'foo',
      repo: 'bar repo',
      resource: 'pr',
    }

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(gitFetcherConfig))

    const result = await validateFetcherConfig(testPath)
    expect(result).toEqual(gitFetcherConfig)
  })

  describe('Filter by State', async () => {
    describe('Success Cases', async () => {
      it.each(allowedFilterState)(
        'does not throw an error for valid state filter %s',
        async (stateFilter: AllowedFilterStateType) => {
          const gitFetcherConfig: GitFetcherConfig = {
            org: 'foo',
            repo: 'bar repo',
            resource: 'pr',
            filter: { state: stateFilter },
          }
          vi.mocked(readFileSync).mockReturnValue(
            JSON.stringify(gitFetcherConfig)
          )

          const result = await validateFetcherConfig(testPath)
          expect(result).toEqual(gitFetcherConfig)
        }
      )
    })

    describe('Error Cases', async () => {
      it('throws an error, when an invalid state filter is given', async () => {
        const invalidRequestStatus = 'invalid'

        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: { state: invalidRequestStatus as any },
        }
        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          `Validation error: Invalid enum value. Expected 'DECLINED' | 'MERGED' | 'OPEN' | 'ALL', received '${invalidRequestStatus}' at "filter.state"`
        )
      })
    })
  })

  describe('Filter by Date', async () => {
    describe('Success Cases', async () => {
      it('does not throw an error, when filter startDate equals filter endDate', async () => {
        const filterStartDate = '01-02-2023'

        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startDate: filterStartDate as any,
            endDate: filterStartDate as any,
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual({
          ...gitFetcherConfig,
          filter: {
            startDate: new Date(new Date('2023-02-01').setHours(0, 0, 0, 0)),
            endDate: new Date(new Date('2023-02-01').setHours(23, 59, 59, 999)),
          },
        })
      })

      it('does not throw an error, when filter endDate is greater than filter startDate', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startDate: '01-02-2023' as any,
            endDate: '01-03-2023' as any,
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual({
          ...gitFetcherConfig,
          filter: {
            startDate: new Date(new Date('2023-02-01').setHours(0, 0, 0, 0)),
            endDate: new Date(new Date('2023-03-01').setHours(23, 59, 59, 999)),
          },
        })
      })

      it('does not throw an error, when filter startDate is provided but filter endDate is not', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startDate: '01-01-2023' as any,
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual({
          ...gitFetcherConfig,
          filter: {
            startDate: new Date(new Date('2023-01-01').setHours(0, 0, 0, 0)),
          },
        })
      })
    })

    describe('Error Cases', async () => {
      it('throws an error, when filter endDate is provided but filter startDate is not', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: { endDate: '01-01-2023' as any },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: Specify filter.startDate if filter.endDate is provided at "filter"'
        )
      })

      it('throws an error, when filter endDate is before filter startDate', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startDate: '01-02-2023' as any,
            endDate: '01-01-2023' as any,
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: filter.endDate must be after or equal filter.startDate at "filter"'
        )
      })

      it('throws an error, when filter startDate is empty', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: { startDate: '' as any },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: date must match the format dd-mm-yyyy at "filter.startDate"'
        )
      })

      it('throws an error, when filter endDate is empty', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startDate: '01-01-2023' as any,
            endDate: '' as any,
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: date must match the format dd-mm-yyyy at "filter.endDate"'
        )
      })

      it('throws an error, when filter startDate does not match the required format', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startDate: '5-01-2023' as any,
            endDate: '01-01-2023' as any,
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: date must match the format dd-mm-yyyy at "filter.startDate"'
        )
      })

      it('throws an error, when filter endDate does not match the required format', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startDate: '01-01-2023' as any,
            endDate: '01-1-2024' as any,
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: date must match the format dd-mm-yyyy at "filter.endDate"'
        )
      })
    })
  })

  describe('Filter by Hash', async () => {
    describe('Success Cases', async () => {
      it('does not throw an error, when only startHash is given', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startHash: 'ad897ad8b76ad4c7b6',
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual(gitFetcherConfig)
      })

      it('does not throw an error, when startHash and state filter are combined', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            state: 'ALL',
            startHash: 'ad897ad8b76ad4c7b6',
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual(gitFetcherConfig)
      })

      it('does not throw an error, when startHash, endHash and state filter are combined', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            state: 'ALL',
            startHash: 'ad897ad8b76ad4c7b6',
            endHash: 'ad897ad8b76ad4c7b6',
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual(gitFetcherConfig)
      })
    })

    describe('Error Cases', async () => {
      it.each(['startHash', 'endHash'])(
        'throws an error, when %s is empty',
        async (hash) => {
          const gitFetcherConfig: GitFetcherConfig = {
            org: 'foo',
            repo: 'bar repo',
            resource: 'pr',
            filter: {
              startHash: 'ad897ad8b76ad4c7b6',
              [hash]: '',
            },
          }

          vi.mocked(readFileSync).mockReturnValue(
            JSON.stringify(gitFetcherConfig)
          )
          await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
            `Validation error: String must contain at least 1 character(s) at "filter.${hash}"`
          )
        }
      )

      it('throws an error, when endHash is used without startHash', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: { endHash: 'c3d9087cd0a7b' },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: Specify filter.startHash if filter.endHash is provided at "filter"'
        )
      })
    })
  })

  describe('Filter by Tag', async () => {
    describe('Success Cases', async () => {
      it('does not throw an error, when only startTag is given', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startTag: '13dbf0d42971a',
          },
        }
        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual(gitFetcherConfig)
      })

      it('does not throw an error, when startTag and endTag are given', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            startTag: '13dbf0d42971a',
            endTag: '9da28cfda7344',
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual(gitFetcherConfig)
      })

      it('does not throw an error, when startTag and state filter are combined', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            state: 'ALL',
            startTag: '13dbf0d42971a',
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual(gitFetcherConfig)
      })

      it('does not throw an error, when startTag, endTag and state filter are combined', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            state: 'ALL',
            startTag: '13dbf0d42971a',
            endTag: '9da28cfda7344',
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        const result = await validateFetcherConfig(testPath)
        expect(result).toEqual(gitFetcherConfig)
      })
    })

    describe('Error Cases', async () => {
      it.each(['startTag', 'endTag'])(
        'throws an error, when %s is empty',
        async (tag) => {
          const gitFetcherConfig: GitFetcherConfig = {
            org: 'foo',
            repo: 'bar repo',
            resource: 'pr',
            filter: {
              startTag: '13dbf0d42971a',
              [tag]: '',
            },
          }

          vi.mocked(readFileSync).mockReturnValue(
            JSON.stringify(gitFetcherConfig)
          )
          await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
            `Validation error: String must contain at least 1 character(s) at "filter.${tag}`
          )
        }
      )
      it('throws an error, when endTag is used without startTag', async () => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {
            endTag: '9da28cfda7344',
          },
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )

        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: Specify filter.startTag if filter.endTag is provided at "filter"'
        )
      })
    })
  })

  describe('Filter Invalid Combinations', function () {
    it.each([
      // date + hash filter
      ['startDate', 'startHash', undefined],
      ['startDate', 'endHash', undefined],
      ['endDate', 'startHash', undefined],
      ['endDate', 'endHash', undefined],
      // date + tag filter
      ['startDate', undefined, 'startTag'],
      ['startDate', undefined, 'endTag'],
      ['endDate', undefined, 'startTag'],
      ['endDate', undefined, 'endTag'],
      // hash + tag filter
      [undefined, 'startHash', 'startTag'],
      [undefined, 'startHash', 'endTag'],
      [undefined, 'endHash', 'startTag'],
      [undefined, 'endHash', 'endTag'],
      // date + tag + hash filter
      ['startDate', 'startHash', 'startTag'],
      ['startDate', 'startHash', 'endTag'],
      ['startDate', 'endHash', 'startTag'],
      ['startDate', 'endHash', 'endTag'],
      ['endDate', 'startHash', 'startTag'],
      ['endDate', 'startHash', 'endTag'],
      ['endDate', 'endHash', 'startTag'],
      ['endDate', 'endHash', 'endTag'],
    ])(
      'throws an error, when date: %s, hash: %s, tag: %s are used in combination',
      async (date, hash, tag) => {
        const gitFetcherConfig: GitFetcherConfig = {
          org: 'foo',
          repo: 'bar repo',
          resource: 'pr',
          filter: {},
        }

        if (date !== undefined) {
          gitFetcherConfig.filter[date] = '01-01-2023'
        }
        if (hash !== undefined) {
          gitFetcherConfig.filter[hash] = 'c3d9087cd0a7b'
        }
        if (tag !== undefined) {
          gitFetcherConfig.filter[tag] = '13dbf0d42971a'
        }

        vi.mocked(readFileSync).mockReturnValue(
          JSON.stringify(gitFetcherConfig)
        )
        await expect(validateFetcherConfig(testPath)).rejects.toThrowError(
          'Validation error: Combining the date, hash and/or tag filter is not possible at "filter"'
        )
      }
    )
  })
})
