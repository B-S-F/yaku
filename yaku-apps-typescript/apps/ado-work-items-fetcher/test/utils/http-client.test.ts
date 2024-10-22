/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '../../src/utils/http-client'

describe('createHttpClient', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('returns a http client', () => {
    const adoHttpClientArgs = {
      azureDevOpsUrl: 'https://dev.azure.com',
    }
    const httpClient = createHttpClient(adoHttpClientArgs)
    expect(httpClient).toBeDefined()
  })

  it('returns a http client with a baseUrl', () => {
    const adoHttpClientArgs = {
      azureDevOpsUrl: 'https://dev.azure.com',
    }
    const httpClient = createHttpClient(adoHttpClientArgs)
    expect(httpClient.defaults.baseURL).toEqual('https://dev.azure.com')
  })
})
