// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios from 'axios'

export const getDefenderForCloudRecommendations = async (
  token: string,
  subscriptionId: string,
) => {
  const baseUrl =
    process.env.IS_INTEGRATION_TEST === 'true'
      ? 'http://localhost:8080'
      : 'https://management.azure.com'
  const urlQueryParameters =
    process.env.IS_INTEGRATION_TEST === 'true' ? '' : '?api-version=2020-01-01'
  let URL =
    baseUrl +
    `/subscriptions/${subscriptionId}/providers/Microsoft.Security/assessments` +
    urlQueryParameters

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  }

  let fetchNextPage = false
  let recommendations: any[] = []
  try {
    do {
      const response = await axios.get(URL, config)
      if (response.status === 200) {
        recommendations = recommendations.concat(response.data.value)
        if (response.data.nextLink) {
          URL = response.data.nextLink
          fetchNextPage = true
        } else {
          fetchNextPage = false
        }
      }
    } while (fetchNextPage)
  } catch (error: any) {
    console.log('Error response: ')
    console.log(error.response.data)
    throw new Error(
      `Request for Azure recommendations does not have status code 200. Status code: ${error.response.status}`,
    )
  }

  return recommendations
}

export const getDefenderForCloudRecommendationsMetadata = async (
  token: string,
) => {
  const baseUrl =
    process.env.IS_INTEGRATION_TEST === 'true'
      ? 'http://localhost:8080'
      : 'https://management.azure.com'
  const urlQueryParameters =
    process.env.IS_INTEGRATION_TEST === 'true' ? '' : '?api-version=2020-01-01'
  let URL =
    baseUrl +
    `/providers/Microsoft.Security/assessmentMetadata` +
    urlQueryParameters

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  }

  let fetchNextPage = false
  let recommendationsMetadata: any[] = []
  try {
    do {
      const response = await axios.get(URL, config)
      if (response.status === 200) {
        recommendationsMetadata = recommendationsMetadata.concat(
          response.data.value,
        )
        if (response.data.nextLink) {
          URL = response.data.nextLink
          fetchNextPage = true
        } else {
          fetchNextPage = false
        }
      }
    } while (fetchNextPage)
  } catch (error: any) {
    console.log('Error response: ')
    console.log(error.response.data)
    throw new Error(
      `Request for Azure recommendations metadata does not have status code 200. Status code: ${error.response.status}`,
    )
  }

  return recommendationsMetadata
}
