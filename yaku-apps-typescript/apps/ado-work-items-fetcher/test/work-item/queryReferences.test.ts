// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios from 'axios'
import { isAxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiDetails } from '../../src/utils/api-details'
import { createHeaders, WorkItem } from '../../src/work-item/work-item'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn(),
  },
  isAxiosError: vi.fn(),
}))

const headers = createHeaders('Test')
const configData = {
  getQuery: () => 'Test',
  getRequestedFields: () => ['Title'],
}

describe('WorkItem', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('queryReferences() should return workItemReferences', async () => {
    const mockedAxiosPost = vi.mocked(axios.post)
    mockedAxiosPost.mockResolvedValue({
      data: {
        workItems: [
          {
            id: 1,
            url: 'https://dev.azure.com/ORG/PROJECT/_apis/wit/workitems/1',
          },
        ],
      },
      headers: {
        'content-type': 'application/json',
      },
    })

    const apiDetails: ApiDetails = {
      version: '6.0',
      wiql: '_apis/wit/wiql',
      url: 'https://dev.azure.com',
      org: 'ORG',
      project: 'PROJECT',
      personalAccessToken: 'TOKEN',
    }
    const workItemObject: WorkItem = new WorkItem(
      headers,
      axios,
      configData,
      apiDetails,
    )
    const result = await workItemObject.queryReferences()
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'https://dev.azure.com/ORG/PROJECT/_apis/wit/wiql?api-version=6.0',
      {
        query: 'Test',
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Basic OlRlc3Q=',
        },
      },
    )
    expect(result).toEqual([
      { id: 1, url: 'https://dev.azure.com/ORG/PROJECT/_apis/wit/workitems/1' },
    ])
  })

  it('queryReferences() should return empty array if no workitems are found', async () => {
    const mockedAxiosPost = vi.mocked(axios.post)
    mockedAxiosPost.mockResolvedValue({
      data: {}, // no .workItems here!
      headers: {
        'content-type': 'application/json',
      },
    })

    const apiDetails: ApiDetails = {
      version: '6.0',
      wiql: '_apis/wit/wiql',
      url: 'https://dev.azure.com',
      org: 'ORG',
      project: 'PROJECT',
      personalAccessToken: 'TOKEN',
    }
    const workItemObject: WorkItem = new WorkItem(
      headers,
      axios,
      configData,
      apiDetails,
    )
    const result = await workItemObject.queryReferences()
    expect(result).toEqual([])
  })

  it('queryReferences() should return report about received 203 HTML response', async () => {
    const mockedAxiosPost = vi.mocked(axios.post)
    mockedAxiosPost.mockResolvedValue({
      headers: {
        'content-type': 'text/html; some=parameter',
      },
      status: 203,
    })

    const apiDetails: ApiDetails = {
      version: '6.0',
      wiql: '_apis/wit/wiql',
      url: 'https://dev.azure.com',
      org: 'ORG',
      project: 'PROJECT',
      personalAccessToken: 'TOKEN',
    }
    const workItemObject: WorkItem = new WorkItem(
      headers,
      axios,
      configData,
      apiDetails,
    )

    await expect(workItemObject.queryReferences()).rejects.toThrowError(
      'Server returned status 203 and some HTML code instead of JSON. It could be that your API token is wrong!',
    )
  })

  it('queryReferences() should return proper error in case of bad request', async () => {
    vi.mocked(axios.post).mockRejectedValue({
      response: { status: 400, statusText: 'Bad request' },
    })
    vi.mocked(isAxiosError).mockReturnValue(true)

    const apiDetails: ApiDetails = {
      version: '6.0',
      wiql: '_apis/wit/wiql',
      url: 'https://dev.azure.com',
      org: 'ORG',
      project: 'PROJECT',
      personalAccessToken: 'TOKEN',
    }

    const workItemObject: WorkItem = new WorkItem(
      headers,
      axios,
      configData,
      apiDetails,
    )

    await expect(workItemObject.queryReferences()).rejects.toThrowError(
      'Request failed with status code 400 Bad request. Please check your WIQL query for errors.',
    )
  })

  it('queryReferences() should return proper error in case of 404 response', async () => {
    vi.mocked(axios.post).mockRejectedValue({
      response: { status: 404, statusText: 'Not found' },
    })
    vi.mocked(isAxiosError).mockReturnValue(true)

    const apiDetails: ApiDetails = {
      version: '6.0',
      wiql: '_apis/wit/wiql',
      url: 'https://dev.azure.com',
      org: 'ORG',
      project: 'PROJECT',
      personalAccessToken: 'TOKEN',
    }

    const workItemObject: WorkItem = new WorkItem(
      headers,
      axios,
      configData,
      apiDetails,
    )

    await expect(workItemObject.queryReferences()).rejects.toThrowError(
      'Request failed with status code 404 Not found',
    )
  })

  it('queryReferences() should throw unknown errors as they are', async () => {
    const customError = new Error('Some custom error')

    vi.mocked(axios.post).mockRejectedValue(customError)
    vi.mocked(isAxiosError).mockReturnValue(false)

    const apiDetails: ApiDetails = {
      version: '6.0',
      wiql: '_apis/wit/wiql',
      url: 'https://dev.azure.com',
      org: 'ORG',
      project: 'PROJECT',
      personalAccessToken: 'TOKEN',
    }

    const workItemObject: WorkItem = new WorkItem(
      headers,
      axios,
      configData,
      apiDetails,
    )

    await expect(workItemObject.queryReferences()).rejects.toThrowError(
      customError,
    )
  })
})
