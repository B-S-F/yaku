/**
 * Copyright (c) 2022, 2023 by grow platform GmbH
 */
import { getEnvVariable } from './util.js'

export const ADO_API_VERSION = '6.0'

export type ApiDetails = ApiBaseDetails & ApiRequestDetails

export interface ApiBaseDetails {
  url: string
  wiql: string
}

export interface ApiRequestDetails {
  org: string
  project: string
  personalAccessToken: string
}

export function getApiDetails(): ApiDetails {
  const org = getEnvVariable('ADO_API_ORG')
  const project = getEnvVariable('ADO_API_PROJECT')
  const personalAccessToken = getEnvVariable('ADO_API_PERSONAL_ACCESS_TOKEN')

  return {
    wiql: process.env.ADO_API_WIQL ?? '_apis/wit/wiql',
    url: process.env.ADO_URL ?? 'https://dev.azure.com',
    org,
    project,
    personalAccessToken,
  }
}

export function createApiUrl(apiDetails: ApiDetails) {
  if (!apiDetails.url.match(/^https:\/\//)) {
    throw new Error('ADO fetcher can only establish https-secured connections')
  }
  const urlStr = `${apiDetails.url}/${apiDetails.org}/${apiDetails.project}/${apiDetails.wiql}`
  const url: URL = new URL(urlStr)
  url.searchParams.append('api-version', ADO_API_VERSION)
  return url
}
