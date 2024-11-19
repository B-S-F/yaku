// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { GetLogger } from '@B-S-F/autopilot-utils'
import { Authenticator } from '../auth/auth.js'
import { Login } from '../model/login.js'
import { OrganizationDTO } from '../dto/organization.dto.js'
import { axiosInstance } from './common.fetcher.js'
import { handleAxiosError, UnexpectedDataError } from './errors.fetcher.js'

export const getOrganizationDTO = async (
  apiUrl: string,
  config: { orgToken: string },
  auth: Authenticator,
): Promise<OrganizationDTO> => {
  const url = `/api/v2.0/orgs/${config.orgToken}`
  const login: Login = await auth.authenticate()
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${login.jwtToken}`,
  }
  const requestConfig: AxiosRequestConfig = {
    url: url,
    method: 'get',
    baseURL: apiUrl,
    headers: headers,
  }
  const logger = GetLogger()

  try {
    const response: AxiosResponse = await axiosInstance.request(requestConfig)

    if (!response.data.retVal) {
      throw new UnexpectedDataError('No expected values are returned')
    }
    const organizationDTO = new OrganizationDTO(
      response.data.retVal.uuid,
      response.data.retVal.name,
    )

    return organizationDTO
  } catch (error: any) {
    logger.error(
      `Getting Organization information from ${requestConfig.baseURL}${url} has failed`,
    )
    if (axios.isAxiosError(error)) {
      handleAxiosError(error)
    }
    throw new Error(`Error ${error.message}`)
  }
}
