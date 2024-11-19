// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Octokit } from 'octokit'
import { getAppAccess } from '../../../src/octokit/get-app-access'
import { GetLogger } from '@B-S-F/autopilot-utils'

const logger = GetLogger()

describe('getAppAccess', () => {
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

  it('should POST to /app/installations/:installationId/access_tokens', async () => {
    // Arrange
    const installationId = 1234

    // Act
    await getAppAccess(octokitMock, installationId)

    // Assert
    expect(octokitMock.request).toHaveBeenCalledWith(
      `POST /app/installations/${installationId}/access_tokens`,
    )
  })

  it('should exit and log an error if octokit.request throws an error', async () => {
    // Arrange
    const installationId = 1234
    const error = new Error('mock error')
    vi.mocked(octokitMock.request).mockRejectedValue(error)

    // Act
    await expect(() =>
      getAppAccess(octokitMock, installationId),
    ).rejects.toThrow('process exit')

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      `Error requesting access token for app installation ${installationId}: ${error.message}`,
    )
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
