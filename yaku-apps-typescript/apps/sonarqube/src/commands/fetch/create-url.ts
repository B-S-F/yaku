import { ConfigurationError } from './errors.js'

export function createDashboardUrl(
  hostname: string,
  port: number,
  protocol: 'http' | 'https',
  projectKey: string
) {
  try {
    const url = new URL(
      `${protocol}://${hostname}:${port.toString()}/dashboard`
    )
    url.searchParams.append('id', projectKey)
    return url
  } catch (error: any) {
    throw new ConfigurationError(
      `Configuration could not be parsed as URL, ${error.message}`
    )
  }
}

export function createApiUrl(
  hostname: string,
  port: number,
  protocol: 'http' | 'https',
  apiPath: string,
  searchParams: { [key: string]: string }
) {
  try {
    const url = new URL(
      `${protocol}://${hostname}:${port.toString()}/${apiPath}`
    )
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    return url
  } catch (error: any) {
    throw new ConfigurationError(
      `Configuration could not be parsed as URL, ${error.message}`
    )
  }
}

export function createAuthHeader(
  accessToken?: string,
  username?: string,
  password?: string
) {
  if (!accessToken && !(username && password)) {
    throw new Error(
      'Failed to create Auth Header, either access token or username and password have to be provided'
    )
  }
  let encoded = ''
  if (accessToken) {
    encoded = Buffer.from(`${accessToken}:`, 'binary').toString('base64')
  } else {
    encoded = Buffer.from(`${username}:${password}`, 'binary').toString(
      'base64'
    )
  }
  return `Basic ${encoded}`
}
