import { writeFile } from 'fs/promises'
import fetch, { Response } from 'node-fetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createApiUrl,
  createAuthHeader,
  createDashboardUrl,
} from '../../../../src/commands/fetch/create-url'
import {
  getProjectStatus,
  projectStatus,
} from '../../../../src/commands/fetch/project-status'
import { configureProxyTunnel } from '../../../../src/utils/configure-proxy-tunnel'

describe('getProjectStatus', async () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mock('node-fetch')
    vi.mock('../../../../src/commands/fetch/create-url')
  })
  const options = {
    hostname: 'test-host',
    port: 8080,
    protocol: 'https',
    projectKey: 'test-key',
    enableProxy: false,
    outputPath: 'test-path',
    accessToken: 'test-token',
  } as any
  it('should fetch project status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => {
        return '{"projectStatus": {"status": "OK"}}'
      },
      status: 200,
      statusText: 'OK',
    } as Response)
    vi.mocked(createApiUrl).mockReturnValue(new URL('https://test-url'))

    const result = await getProjectStatus(
      options.hostname,
      options.port,
      options.protocol,
      options.projectKey,
      options.accessToken,
      undefined
    )
    expect(result).toEqual({
      projectStatus: {
        status: 'OK',
      },
    })
  })

  it('should throw an error if the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      text: async () => {
        return 'some error message'
      },
      status: 404,
      statusText: 'OK',
    } as Response)
    vi.mocked(createApiUrl).mockReturnValue(new URL('https://test-url'))

    await expect(
      getProjectStatus(
        options.hostname,
        options.port,
        options.protocol,
        options.projectKey,
        options.accessToken,
        undefined
      )
    ).rejects.toThrowError(
      'Failed to fetch project status with status 404, some error message'
    )
  })

  it('should throw an error if the resoponse data is not valid json', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => {
        return 'some invalid json'
      },
      status: 404,
      statusText: 'OK',
    } as Response)
    vi.mocked(createApiUrl).mockReturnValue(new URL('https://test-url'))

    await expect(
      getProjectStatus(
        options.hostname,
        options.port,
        options.protocol,
        options.projectKey,
        options.accessToken,
        undefined
      )
    ).rejects.toThrowError(
      'Could not parse sonarqube response as JSON, Unexpected token s in JSON at position 0'
    )
  })
})

describe('projectStatus', async () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mock('node-fetch')
    vi.mock('../../../../src/commands/fetch/create-url')
    vi.mock('../../../../src/utils/configure-proxy-tunnel')
    vi.mock('fs/promises')
  })

  it('should fetch project status', async () => {
    const sonarqubeResult = {
      projectStatus: {
        status: 'OK',
      },
    }
    const mockedFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => {
        return JSON.stringify(sonarqubeResult)
      },
      status: 200,
      statusText: 'OK',
    } as Response)
    const mockedCreateApiUrl = vi
      .mocked(createApiUrl)
      .mockReturnValue(new URL('https://test-url'))
    const mockedCreateDashboardUrl = vi
      .mocked(createDashboardUrl)
      .mockReturnValue(new URL('https://test-url'))
    const mockedCreateAuthHeader = vi
      .mocked(createAuthHeader)
      .mockReturnValue('Basic dG9rZW46')
    const mockedWriteFile = vi.mocked(writeFile).mockResolvedValue(undefined)
    const mockedConfigureProxyTunnel = vi
      .mocked(configureProxyTunnel)
      .mockReturnValue(undefined)

    const options = {
      hostname: 'test-host',
      port: 8080,
      protocol: 'https',
      projectKey: 'test-key',
      enableProxy: false,
      outputPath: 'test-path',
      accessToken: 'test-token',
    } as any
    await expect(projectStatus(options)).resolves.toBeUndefined()
    expect(mockedCreateAuthHeader).toHaveBeenCalledWith(options.accessToken)
    expect(mockedCreateApiUrl).toHaveBeenCalledWith(
      options.hostname,
      options.port,
      options.protocol,
      'api/qualitygates/project_status',
      { projectKey: options.projectKey }
    )
    expect(mockedFetch).toHaveBeenCalled()
    expect(mockedCreateDashboardUrl).toHaveBeenCalledWith(
      options.hostname,
      options.port,
      options.protocol,
      options.projectKey
    )
    expect(mockedConfigureProxyTunnel).not.toHaveBeenCalled()
    expect(mockedWriteFile).toHaveBeenCalledWith(
      options.outputPath,
      JSON.stringify(sonarqubeResult, null, 2)
    )
  })
})
