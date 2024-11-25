import { afterEach, describe, expect, it, vi } from 'vitest'
import { authCmd, ghAppAuth } from '../../src/auth.js'
import { GetLogger } from '@B-S-F/autopilot-utils'

const logger = GetLogger()

const mocks = vi.hoisted(() => ({
  getAppInstallationMock: vi.fn(),
  getAppAccessMock: vi.fn(),
}))

vi.mock('octokit', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
  })),
}))

vi.mock('universal-github-app-jwt', () => ({
  default: vi.fn().mockReturnValue({ token: 'token' }),
}))

vi.mock('../../src/octokit/get-app-installation.js', () => ({
  getAppInstallation: mocks.getAppInstallationMock,
}))

vi.mock('../../src/octokit/get-app-access', () => ({
  getAppAccess: mocks.getAppAccessMock,
}))

describe('authCmd', async () => {
  afterEach(() => {
    vi.clearAllMocks()
    mocks.getAppInstallationMock.mockReset()
    mocks.getAppAccessMock.mockReset()
  })
  it('should print a gh app installation token as an output', async () => {
    // Arrange
    mocks.getAppInstallationMock.mockResolvedValueOnce({
      data: { id: 1, app_slug: 'app_slug' },
    })
    mocks.getAppAccessMock.mockResolvedValueOnce({ data: { token: 'token' } })
    vi.spyOn(console, 'log')
    vi.stubEnv('GH_APP_ID', '123')
    vi.stubEnv('GH_APP_PRIVATE_KEY', 'private-key')
    vi.stubEnv('GH_APP_ORG', 'org')

    // Act
    await authCmd({})

    // Assert
    expect(console.log).toHaveBeenCalledWith(
      '{"output":{"GITHUB_TOKEN":"token"}}',
    )
  })
  it('should only print a gh app installation token', async () => {
    // Arrange
    mocks.getAppInstallationMock.mockResolvedValueOnce({
      data: { id: 1, app_slug: 'app_slug' },
    })
    mocks.getAppAccessMock.mockResolvedValueOnce({ data: { token: 'token' } })
    vi.spyOn(console, 'log')
    vi.stubEnv('GH_APP_ID', '123')
    vi.stubEnv('GH_APP_PRIVATE_KEY', 'private-key')
    vi.stubEnv('GH_APP_ORG', 'org')

    // Act
    await authCmd({ tokenOnly: true })

    // Assert
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith('token')
  })
})

describe('ghAppAuth', async () => {
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process exit')
  })
  vi.spyOn(logger, 'error')
  vi.spyOn(logger, 'info')

  afterEach(() => {
    vi.clearAllMocks()
    mocks.getAppInstallationMock.mockReset()
    mocks.getAppAccessMock.mockReset()
  })
  it('should exit process if no installation found', async () => {
    // Arrange
    mocks.getAppInstallationMock.mockResolvedValueOnce({ data: {} })

    // Act
    await expect(() => ghAppAuth()).rejects.toThrow('process exit')

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('No app installation found'),
    )
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('should exit process if no access token received', async () => {
    // Arrange
    mocks.getAppInstallationMock.mockResolvedValueOnce({
      data: { id: 1, app_slug: 'app_slug' },
    })

    // Act
    await expect(() => ghAppAuth()).rejects.toThrow('process exit')

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('No access token received'),
    )
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('should return access token if installation and access token received', async () => {
    // Arrange
    mocks.getAppInstallationMock.mockResolvedValueOnce({
      data: { id: 1, app_slug: 'app_slug' },
    })
    mocks.getAppAccessMock.mockResolvedValueOnce({ data: { token: 'token' } })

    // Act
    const result = await ghAppAuth()

    // Assert
    expect(result).toEqual('token')
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Logged in as'),
    )
  })
})
