// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, it, vi } from 'vitest'
import * as jiraFetcher from '../src/fetch'
import fetch, { Response } from 'node-fetch'
import { AppError } from '@B-S-F/autopilot-utils'

const { getFilters, getHeaders } = jiraFetcher.__t

describe('getFilters()', () => {
  it('should return filters for issues', () => {
    const configData = {
      query: 'query',
      neededFields: ['field1', 'field2'],
    }
    const result = getFilters(configData)
    const expectedResult = {
      maxResults: -1,
      startAt: 0,
      jql: 'query',
      fields: ['field1', 'field2'],
    }

    expect(result).toEqual(expectedResult)
  })
})

describe('getHeaders()', () => {
  it('should return basic auth header for username and passwrod', () => {
    const headers = getHeaders(undefined, 'username', 'password')
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
    })
  })

  it('should return bearer header for pat', () => {
    const headers = getHeaders('abcd', undefined, undefined)
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer abcd',
    })
  })

  it('should throw an error if no auth data is passed', async () => {
    await expect(async () => await getHeaders()).rejects.toThrowError(AppError)
  })
})

describe('fetchData()', () => {
  vi.mock('node-fetch')
  const mockedFetch = vi.mocked(fetch)
  const jiraUrl = 'https://jira.atlassian.com',
    pat = 'test',
    configData = {}

  it('should throw AppError because of Jira server error', async () => {
    const mockedResponse = {
      status: 500,
      text: vi.fn(),
    }
    mockedFetch.mockResolvedValueOnce(mockedResponse as Response)
    await expect(
      async () =>
        await jiraFetcher.fetchData(
          jiraUrl,
          pat,
          undefined,
          undefined,
          configData
        )
    ).rejects.toThrowError(AppError)
  })

  it('should throw AppError because the data is not json object', async () => {
    const mockedResponse = {
      status: 200,
      text: () => Promise.resolve('text'),
    }
    mockedFetch.mockResolvedValueOnce(mockedResponse as Response)
    await expect(
      async () =>
        await jiraFetcher.fetchData(
          jiraUrl,
          pat,
          undefined,
          undefined,
          configData
        )
    ).rejects.toThrowError(AppError)
  })

  it('should throw AppError', async () => {
    const mockedResponse = {
      status: 200,
      text: () =>
        Promise.resolve('Please activate JavaScript in your browser.'),
    }
    mockedFetch.mockResolvedValueOnce(mockedResponse as Response)
    await expect(
      async () =>
        await jiraFetcher.fetchData(
          jiraUrl,
          pat,
          undefined,
          undefined,
          configData
        )
    ).rejects.toThrowError(AppError)
  })

  it('should throw AppError', async () => {
    const mockedResponse = {
      status: 200,
      text: () =>
        Promise.resolve('Please activate JavaScript in your browser.'),
    }
    mockedFetch.mockResolvedValueOnce(mockedResponse as Response)
    await expect(
      async () =>
        await jiraFetcher.fetchData(
          jiraUrl,
          pat,
          undefined,
          undefined,
          configData
        )
    ).rejects.toThrowError(AppError)
  })

  it('should return data', async () => {
    mockedFetch.mockResolvedValueOnce({
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            issues: [{ id: 1 }],
            startAt: 0,
            maxResults: 1,
            total: 2,
          })
        ),
    } as Response)

    mockedFetch.mockResolvedValueOnce({
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            issues: [{ id: 2 }],
            startAt: 1,
            maxResults: 1,
            total: 2,
          })
        ),
    } as Response)

    const result = await jiraFetcher.fetchData(
      jiraUrl,
      pat,
      undefined,
      undefined,
      configData
    )
    const expectedResult = [{ id: 1 }, { id: 2 }]
    expect(result).toEqual(expectedResult)
  })
})

describe('prepareDataToBeExported()', () => {
  it('should insert url through fields', () => {
    const issues = [
      {
        id: 1,
        key: 'issue-1',
        fields: {
          status: 'Closed',
        },
      },
    ]
    const url = 'https://jira.atlassian.com'
    const expectedResult = [
      {
        id: 1,
        status: 'Closed',
        url: 'https://jira.atlassian.com/browse/issue-1',
      },
    ]
    const result = jiraFetcher.prepareDataToBeExported(issues, url)
    expect(result).toEqual(expectedResult)
  })
})
