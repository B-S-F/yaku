import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { GetLogger } from '@B-S-F/autopilot-utils'
import { Login } from '../model/login.js'
import { axiosInstance } from './common.fetcher.js'
import { handleAxiosError, UnexpectedDataError } from './errors.fetcher.js'

export const auth = async (
  apiUrl: string,
  email: string,
  org: string,
  token: string
): Promise<Login> => {
  const url = '/api/v2.0/login'
  const headers = {
    Accept: 'application/json',
    'Content-type': 'application/json',
  }
  const requestConfig: AxiosRequestConfig = {
    url: url,
    method: 'post',
    baseURL: apiUrl,
    headers: headers,
    data: {
      email: email,
      orgToken: org,
      userKey: token,
    },
  }
  const logger = GetLogger()

  try {
    const response: AxiosResponse = await axiosInstance.request(requestConfig)

    if (!response.data.retVal) {
      throw new UnexpectedDataError('No expected values returned')
    }
    const login = new Login(
      response.data.retVal.userUuid,
      response.data.retVal.userName,
      response.data.retVal.email,
      response.data.retVal.jwtToken,
      response.data.retVal.refreshToken,
      response.data.retVal.jwtTTL,
      response.data.retVal.orgName,
      response.data.retVal.orgUuid,
      response.data.retVal.sessionStartTime
    )

    return login
  } catch (error: any) {
    logger.error(`Error when trying to access ${requestConfig.baseURL}${url}`)
    if (axios.isAxiosError(error)) {
      handleAxiosError(error)
    }
    throw new Error(`Error ${error.message}`)
  }
}
