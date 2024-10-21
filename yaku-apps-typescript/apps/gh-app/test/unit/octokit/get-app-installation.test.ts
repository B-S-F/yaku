import { afterEach, describe, expect, it, vi } from 'vitest'
import { Octokit } from 'octokit'
import { getAppInstallation } from '../../../src/octokit/get-app-installation'
import { GetLogger } from '@B-S-F/autopilot-utils'

const logger = GetLogger()

describe('getAppInstallation', () => {
  vi.mock('octokit', () => ({
    Octokit: vi.fn().mockImplementation(() => ({
      request: vi.fn(),
    })),
  }))
  const octokitMock = vi.mocked(new Octokit())
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process exit')
  })
  vi.spyOn(logger, 'error')

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should call octokit.request with the correct arguments when repo (and org) is set', async () => {
    // Arrange
    const org = 'mockOrg'
    const repo = 'mockRepo'
    vi.mocked

    // Act
    await getAppInstallation(octokitMock, org, repo)

    // Assert
    expect(octokitMock.request).toHaveBeenCalledWith(
      `GET /repos/${org}/${repo}/installation`
    )
    expect(logger.info)
  })

  it('should call octokit.request with the correct arguments when only org is set', async () => {
    // Arrange
    const org = 'mockOrg'

    // Act
    await getAppInstallation(octokitMock, org, undefined)

    // Assert
    expect(octokitMock.request).toHaveBeenCalledWith(
      `GET /orgs/${org}/installation`
    )
  })

  it('should exit and log an error if octokit.request throws an error', async () => {
    // Arrange
    const org = 'mockOrg'
    const repo = 'mockRepo'
    const error = new Error('mock error')
    vi.mocked(octokitMock.request).mockRejectedValue(error)

    // Act
    await expect(() =>
      getAppInstallation(octokitMock, org, repo)
    ).rejects.toThrow('process exit')

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      `Error looking for app installation in ${org}/${repo}: ${error.message}`
    )
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
