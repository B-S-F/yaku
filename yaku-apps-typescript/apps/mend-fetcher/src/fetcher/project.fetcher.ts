// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { GetLogger } from '@B-S-F/autopilot-utils'
import { Authenticator } from '../auth/auth.js'
import { Login } from '../model/login.js'
import { ProjectDTO } from '../dto/project.dto.js'
import { ProjectVitalsDTO } from '../dto/projectVitals.dto.js'
import { axiosInstance } from './common.fetcher.js'
import { handleAxiosError, UnexpectedDataError } from './errors.fetcher.js'

export const getProjectDTO = async (
  apiUrl: string,
  config: { projectToken: string },
  auth: Authenticator,
): Promise<ProjectDTO> => {
  const url = `/api/v2.0/projects/${config.projectToken}`
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
    const projectDTO = new ProjectDTO(
      response.data.retVal.uuid,
      response.data.retVal.name,
      response.data.retVal.path,
      response.data.retVal.productName,
      response.data.retVal.productUuid,
    )

    return projectDTO
  } catch (error: any) {
    logger.error(
      `Getting Project information from ${requestConfig.baseURL}${url} has failed`,
    )
    if (axios.isAxiosError(error)) {
      handleAxiosError(error)
    }
    throw new Error(`Error ${error.message}`)
  }
}

export const getProjectVitalsDTO = async (
  apiUrl: string,
  config: { projectToken: string },
  auth: Authenticator,
): Promise<ProjectVitalsDTO> => {
  const url = `/api/v2.0/projects/${config.projectToken}/vitals`
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
    const projectVitalsDTO = new ProjectVitalsDTO(
      response.data.retVal.lastScan,
      response.data.retVal.lastUserScanned,
      response.data.retVal.requestToken,
      response.data.retVal.lastSourceFileMatch,
      response.data.retVal.lastScanComment,
      response.data.retVal.projectCreationDate,
      response.data.retVal.pluginName,
      response.data.retVal.pluginVersion,
      response.data.retVal.libraryCount,
    )

    return projectVitalsDTO
  } catch (error: any) {
    logger.error(
      `Getting Project Vitals information from ${requestConfig.baseURL}${url} has failed`,
    )
    if (axios.isAxiosError(error)) {
      handleAxiosError(error)
    }
    throw new Error(`Error ${error.message}`)
  }
}
