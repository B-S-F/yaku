// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { GetLogger } from '@B-S-F/autopilot-utils'
import { Authenticator } from '../auth/auth.js'
import { LibraryDTO } from '../dto/library.dto.js'
import { Login } from '../model/login.js'
import { axiosInstance } from './common.fetcher.js'
import { handleAxiosError, UnexpectedDataError } from './errors.fetcher.js'

export const getLibraryDTOs = async (
  apiUrl: string,
  config: { projectToken: string; pageSize?: number },
  auth: Authenticator,
): Promise<LibraryDTO[]> => {
  const url = `/api/v2.0/projects/${config.projectToken}/libraries`
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
      page: '0',
      pageSize: config.pageSize ?? 100,
    },
  }
  const logger = GetLogger()

  let libraryDTOs: LibraryDTO[] = []
  let retrievedItems: any[]

  do {
    try {
      const response: AxiosResponse = await axiosInstance.request(requestConfig)

      if (!response.data.retVal || !response.data.additionalData) {
        throw new UnexpectedDataError('No expected values are returned')
      }
      retrievedItems = response.data.retVal
      libraryDTOs = libraryDTOs.concat(
        retrievedItems.map(
          (item: any) =>
            new LibraryDTO(
              item.uuid,
              item.name,
              item.artifactId,
              item.version,
              item.architecture,
              item.languageVersion,
              item.classifier,
              item.extension,
              item.sha1,
              item.description,
              item.type,
              item.directDependency,
              item.licenses,
              item.copyrightReferences,
              item.locations,
            ),
        ),
      )

      requestConfig.params.page++
    } catch (error: any) {
      logger.error(
        `Getting the list of libraries from ${requestConfig.baseURL}${url} has failed`,
      )
      if (axios.isAxiosError(error)) {
        handleAxiosError(error)
      }
      throw new Error(`Error ${error.message}`)
    }
  } while (retrievedItems.length > 0)

  return libraryDTOs
}
