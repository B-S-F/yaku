// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { createApiUrl, getApiDetails } from '../../src/utils/api-details'

describe('ApiDetails', () => {
  it('getApiDetails() should return needed details for a request', () => {
    process.env.ADO_URL = 'URL'
    process.env.ADO_API_ORG = 'ORG'
    process.env.ADO_API_PROJECT = 'PROJECT'
    process.env.ADO_API_PERSONAL_ACCESS_TOKEN = 'TOKEN'

    const expectedResult = {
      wiql: '_apis/wit/wiql',
      url: 'URL',
      org: 'ORG',
      project: 'PROJECT',
      personalAccessToken: 'TOKEN',
    }
    const result = getApiDetails()
    expect(result).toEqual(expectedResult)

    delete process.env.AZURE_DEVOPS_URL,
      process.env.ADO_API_ORG,
      process.env.ADO_API_PROJECT,
      process.env.ADO_API_PERSONAL_ACCESS_TOKEN
  })

  it('createApiUrl() should return corresponding URL', () => {
    const apiDetails = {
      version: '6.0',
      wiql: '_apis/wit/wiql',
      url: 'https://dev.azure.com',
      org: 'ORG',
      project: 'PROJECT',
      personalAccessToken: 'TOKEN',
    }
    const result = createApiUrl(apiDetails)
    expect(result.href).toEqual(
      'https://dev.azure.com/ORG/PROJECT/_apis/wit/wiql?api-version=6.0',
    )
  })
})
