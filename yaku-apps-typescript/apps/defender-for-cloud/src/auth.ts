// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios from 'axios'
import qs from 'qs'

export const generateAzureAccessToken = async (
  tenantId: string,
  clientId: string,
  grantType: string,
  clientSecret: string,
) => {
  const baseUrl =
    process.env.IS_INTEGRATION_TEST === 'true'
      ? 'http://localhost:8080'
      : 'https://login.microsoftonline.com'
  const URL = baseUrl + `/${tenantId}/oauth2/token`
  const postData = {
    client_id: clientId,
    client_secret: clientSecret,
    resource: 'https://management.core.windows.net/',
    grant_type: grantType,
  }

  try {
    const response = await axios.post(URL, qs.stringify(postData), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!response.data?.access_token) {
      throw new Error(
        `Field "access_token" does not exist on response returned by Azure authenticator`,
      )
    }
    return response.data.access_token
  } catch (error: any) {
    if (error instanceof Error) {
      throw error
    } else {
      console.log('Error response: ')
      console.log(error.response.data)
      throw new Error(
        `Request for Azure access token does not have status code 200. Status code: ${error.response.status}`,
      )
    }
  }
}
