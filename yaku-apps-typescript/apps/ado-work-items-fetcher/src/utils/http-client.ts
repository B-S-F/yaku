// SPDX-FileCopyrightText: 2022 2023 by grow platform GmbH
// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import axios, { AxiosInstance } from 'axios'
import { Agent } from 'http'
import isValidHostname from 'is-valid-hostname'
import { httpsOverHttp } from 'tunnel'

interface AdoHttpClientArgs {
  azureDevOpsUrl: string
  enableProxy?: boolean
}

export function createHttpClient(
  adoHttpClientArgs: AdoHttpClientArgs,
): AxiosInstance {
  let proxyTunnel: Agent
  let httpClient: AxiosInstance
  if (adoHttpClientArgs.enableProxy) {
    proxyTunnel = httpsOverHttp({
      proxy: {
        host: getProxyHost(),
        port: getProxyPort(),
      },
    })
    httpClient = axios.create({
      baseURL: adoHttpClientArgs.azureDevOpsUrl,
      httpsAgent: proxyTunnel,
      proxy: false,
    })
  } else {
    httpClient = axios.create({ baseURL: adoHttpClientArgs.azureDevOpsUrl })
  }
  return httpClient
}

function getProxyHost(): string {
  let proxyHost: string | undefined = process.env.PROXY_HOST
  if (proxyHost === undefined || proxyHost.trim() === '') {
    throw new ReferenceError(
      'The environment variable "PROXY_HOST" is not set!',
    )
  }
  proxyHost = proxyHost.trim()
  if (!isValidHostname(proxyHost)) {
    throw new Error(`invalid PROXY_HOST: ${proxyHost}`)
  }
  return proxyHost
}

function getProxyPort(): number {
  let proxyPortAsString: string | undefined = process.env.PROXY_PORT
  if (proxyPortAsString === undefined || proxyPortAsString.trim() === '') {
    throw new ReferenceError('The environment variable PROXY_PORT" is not set!')
  }
  proxyPortAsString = proxyPortAsString.trim()
  if (!proxyPortAsString.match(/^[0-9]{1,5}$/)) {
    throw new Error('environment variable PROXY_PORT must contain digits only')
  }
  const proxyPort: number = Number.parseInt(proxyPortAsString, 10)
  if (isNaN(proxyPort) || proxyPort <= 0 || proxyPort > 65535) {
    throw new Error(
      'environment variable PROXY_PORT does not represent an integer value in the range 0 < PROXY_PORT < 65535',
    )
  }
  return proxyPort
}
