// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { GetLogger } from '@B-S-F/autopilot-utils'
import { Authenticator } from '../auth/auth.js'
import { Login } from '../model/login.js'
import { PolicyAlertDTO } from '../dto/policyAlert.dto.js'
import { SecurityAlertDTO } from '../dto/securityAlert.dto.js'
import { handleAxiosError, UnexpectedDataError } from './errors.fetcher.js'
import { MultipleLicensesAlertDTO } from '../dto/multipleLicensesAlert.dto.js'
import { NewVersionsAlertDTO } from '../dto/newVersionsAlert.dto.js'
import { RejectedInUseAlertDTO } from '../dto/rejectedInUseAlert.dto.js'
import { axiosInstance } from './common.fetcher.js'

export const getPolicyAlertDTOs = async (
  apiUrl: string,
  config: { projectToken: string; status: string; pageSize?: number },
  auth: Authenticator
): Promise<PolicyAlertDTO[]> => {
  const url = `/api/v2.0/projects/${config.projectToken}/alerts/legal`
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
    params: {
      page: 0,
      pageSize: config.pageSize ?? 100,
      search:
        config.status && config.status !== 'all'
          ? `status:equals:${config.status};type:equals:POLICY_VIOLATIONS`
          : `type:equals:POLICY_VIOLATIONS`,
    },
  }
  const logger = GetLogger()

  let policyAlertDTOs: PolicyAlertDTO[] = []
  let retrievedItems: any[] = []

  do {
    try {
      const response: AxiosResponse = await axiosInstance.request(requestConfig)

      if (!response.data.retVal || !response.data.additionalData) {
        throw new UnexpectedDataError('No expected values returned')
      }
      retrievedItems = response.data.retVal
      policyAlertDTOs = policyAlertDTOs.concat(
        retrievedItems.map(
          (item: any) =>
            new PolicyAlertDTO(
              item.uuid,
              item.name,
              item.type,
              item.component,
              item.alertInfo,
              item.project,
              item.policyName
            )
        )
      )
      requestConfig.params.page++
    } catch (error: any) {
      logger.error(
        `Getting Project Policy Alerts from ${requestConfig.baseURL}${url} has failed`
      )
      if (axios.isAxiosError(error)) {
        handleAxiosError(error)
      }
      throw new Error(`Error ${error.message}`)
    }
  } while (retrievedItems.length > 0)

  return policyAlertDTOs
}

export const getSecurityAlertDTOs = async (
  apiUrl: string,
  config: { projectToken: string; status: string; pageSize?: number },
  auth: Authenticator
): Promise<SecurityAlertDTO[]> => {
  const url = `/api/v2.0/projects/${config.projectToken}/alerts/security`
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
    params: {
      page: 0,
      pageSize: config.pageSize ?? 100,
      search:
        config.status && config.status !== 'all'
          ? `status:equals:${config.status}`
          : undefined,
    },
  }
  const logger = GetLogger()

  let securityAlertDTOs: SecurityAlertDTO[] = []
  let retrievedItems: any[] = []

  do {
    try {
      const response: AxiosResponse = await axiosInstance.request(requestConfig)

      if (!response.data.retVal || !response.data.additionalData) {
        throw new UnexpectedDataError('No expected values returned')
      }
      retrievedItems = response.data.retVal
      securityAlertDTOs = securityAlertDTOs.concat(
        retrievedItems.map(
          (item: any) =>
            new SecurityAlertDTO(
              item.uuid,
              item.name,
              item.type,
              item.component,
              item.alertInfo,
              item.project,
              item.product,
              item.vulnerability,
              item.topFix,
              item.effective
            )
        )
      )
      requestConfig.params.page++
    } catch (error: any) {
      logger.error(
        `Getting Project Security Alerts from ${requestConfig.baseURL}${url} has failed`
      )
      if (axios.isAxiosError(error)) {
        handleAxiosError(error)
      }
      throw new Error(`Error ${error.message}`)
    }
  } while (retrievedItems.length > 0)

  return securityAlertDTOs
}

export const getNewVersionsAlertDTOs = async (
  apiUrl: string,
  config: { projectToken: string; status: string; pageSize?: number },
  auth: Authenticator
): Promise<NewVersionsAlertDTO[]> => {
  const url = `/api/v2.0/projects/${config.projectToken}/alerts/legal`
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
    params: {
      page: 0,
      pageSize: config.pageSize ?? 100,
      search:
        config.status && config.status !== 'all'
          ? `status:equals:${config.status};type:equals:NEW_VERSION`
          : `type:equals:NEW_VERSION`,
    },
  }
  const logger = GetLogger()

  let newVersionsAlertDTOs: NewVersionsAlertDTO[] = []
  let retrievedItems: any[] = []

  do {
    try {
      const response: AxiosResponse = await axiosInstance.request(requestConfig)

      if (!response.data.retVal || !response.data.additionalData) {
        throw new UnexpectedDataError('No expected values returned')
      }
      retrievedItems = response.data.retVal
      newVersionsAlertDTOs = newVersionsAlertDTOs.concat(
        retrievedItems.map(
          (item: any) =>
            new NewVersionsAlertDTO(
              item.uuid,
              item.name,
              item.type,
              item.component,
              item.alertInfo,
              item.project,
              item.availableVersion,
              item.availableVersionType
            )
        )
      )
      requestConfig.params.page++
    } catch (error: any) {
      logger.error(
        `Getting Project New Versions Alerts from ${requestConfig.baseURL}${url} has failed`
      )
      if (axios.isAxiosError(error)) {
        handleAxiosError(error)
      }
      throw new Error(`Error ${error.message}`)
    }
  } while (retrievedItems.length > 0)

  return newVersionsAlertDTOs
}

export const getMultipleLicensesAlertDTOs = async (
  apiUrl: string,
  config: { projectToken: string; status: string; pageSize?: number },
  auth: Authenticator
): Promise<MultipleLicensesAlertDTO[]> => {
  const url = `/api/v2.0/projects/${config.projectToken}/alerts/legal`
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
    params: {
      page: 0,
      pageSize: config.pageSize ?? 100,
      search:
        config.status && config.status !== 'all'
          ? `status:equals:${config.status};type:equals:MULTIPLE_LICENSES`
          : `type:equals:MULTIPLE_LICENSES`,
    },
  }
  const logger = GetLogger()

  let multipleLicensesAlertDTOs: MultipleLicensesAlertDTO[] = []
  let retrievedItems: any[] = []

  do {
    try {
      const response: AxiosResponse = await axiosInstance.request(requestConfig)

      if (!response.data.retVal || !response.data.additionalData) {
        throw new UnexpectedDataError('No expected values returned')
      }
      retrievedItems = response.data.retVal
      multipleLicensesAlertDTOs = multipleLicensesAlertDTOs.concat(
        retrievedItems.map(
          (item: any) =>
            new MultipleLicensesAlertDTO(
              item.uuid,
              item.name,
              item.type,
              item.component,
              item.alertInfo,
              item.project,
              item.numberOfLicenses,
              item.licenses
            )
        )
      )
      requestConfig.params.page++
    } catch (error: any) {
      logger.error(
        `Getting Project Multiple Licenses Alerts from ${requestConfig.baseURL}${url} has failed`
      )
      if (axios.isAxiosError(error)) {
        handleAxiosError(error)
      }
      throw new Error(`Error ${error.message}`)
    }
  } while (retrievedItems.length > 0)

  return multipleLicensesAlertDTOs
}

export const getRejectedInUseAlertDTOs = async (
  apiUrl: string,
  config: { projectToken: string; status: string; pageSize?: number },
  auth: Authenticator
): Promise<RejectedInUseAlertDTO[]> => {
  const url = `/api/v2.0/projects/${config.projectToken}/alerts/legal`
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
    params: {
      page: 0,
      pageSize: config.pageSize ?? 100,
      search:
        config.status && config.status !== 'all'
          ? `status:equals:${config.status};type:equals:REJECTED_LIBRARY_IN_USE`
          : `type:equals:REJECTED_LIBRARY_IN_USE`,
    },
  }
  const logger = GetLogger()

  let rejectedInUseAlertDTOs: RejectedInUseAlertDTO[] = []
  let retrievedItems: any[] = []

  do {
    try {
      const response: AxiosResponse = await axiosInstance.request(requestConfig)

      if (!response.data.retVal || !response.data.additionalData) {
        throw new UnexpectedDataError('No expected values returned')
      }
      retrievedItems = response.data.retVal
      rejectedInUseAlertDTOs = rejectedInUseAlertDTOs.concat(
        retrievedItems.map(
          (item: any) =>
            new RejectedInUseAlertDTO(
              item.uuid,
              item.name,
              item.type,
              item.component,
              item.alertInfo,
              item.project,
              item.description
            )
        )
      )
      requestConfig.params.page++
    } catch (error: any) {
      logger.error(
        `Getting Project Rejected in Use Alerts from ${requestConfig.baseURL}${url} has failed`
      )
      if (axios.isAxiosError(error)) {
        handleAxiosError(error)
      }
      throw new Error(`Error ${error.message}`)
    }
  } while (retrievedItems.length > 0)

  return rejectedInUseAlertDTOs
}
