import { describe, expect, it } from 'vitest'
import {
  createApiUrl,
  createAuthHeader,
  createDashboardUrl,
} from '../../../../src/commands/fetch/create-url'

describe('createApiUrl', async () => {
  it('should create a valid sonarqube api url', () => {
    const hostname = 'hostname'
    const port = 8080
    const protocol = 'https'
    const path = 'path'
    const token = 'token'
    const url = createApiUrl(hostname, port, protocol, path, {
      projectKey: token,
    })
    expect(url.href).toEqual(
      `${protocol}://${hostname}:8080/${path}?projectKey=${token}`
    )
    expect(url.hostname).toEqual(hostname)
    expect(url.port).toEqual(port.toString())
    expect(url.protocol).toEqual(`${protocol}:`)
    expect(url.pathname).toEqual(`/${path}`)
    expect(url.searchParams.get('projectKey')).toEqual(token)
  })
})

describe('createDashboardUrl', async () => {
  it('should create a valid sonarqube dashboard url', () => {
    const hostname = 'hostname'
    const port = 8080
    const protocol = 'https'
    const projectKey = 'projectKey'
    const url = createDashboardUrl(hostname, port, protocol, projectKey)
    expect(url.href).toEqual(
      `${protocol}://${hostname}:8080/dashboard?id=${projectKey}`
    )
    expect(url.hostname).toEqual(hostname)
    expect(url.port).toEqual(port.toString())
    expect(url.protocol).toEqual(`${protocol}:`)
    expect(url.pathname).toEqual('/dashboard')
    expect(url.searchParams.get('id')).toEqual(projectKey)
  })
})

describe('createAuthHeader', async () => {
  it('should create a valid basic auth header with access token', () => {
    expect(createAuthHeader('token')).toEqual('Basic dG9rZW46')
  })
  it('should create a valid basic auth header with username and password', () => {
    expect(createAuthHeader(undefined, 'test', 'test')).toEqual(
      'Basic dGVzdDp0ZXN0'
    )
  })
  it('should throw an error if neither access token nor username and password are provided', () => {
    expect(() => createAuthHeader()).toThrowError(
      'Failed to create Auth Header, either access token or username and password have to be provided'
    )
  })
  it('should throw an error if the necessary values are empty', () => {
    expect(() => createAuthHeader('')).toThrowError(
      'Failed to create Auth Header, either access token or username and password have to be provided'
    )
    expect(() => createAuthHeader(undefined, '', '')).toThrowError(
      'Failed to create Auth Header, either access token or username and password have to be provided'
    )
  })
})
