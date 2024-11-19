// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'

import { checkEnvVariables } from '../../src/config'
import { GetLogger } from '@B-S-F/autopilot-utils'

const logger = GetLogger()

describe('checkEnvVariables', () => {
  let exitSpy
  let logSpy

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process exit')
    })
    logSpy = vi.spyOn(logger, 'error')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()
  })

  it('should run without throwing an error if all env variables are set', () => {
    // Arrange
    vi.stubEnv('GH_APP_ID', '123')
    vi.stubEnv('GH_APP_PRIVATE_KEY', 'private_key')
    vi.stubEnv('GH_APP_ORG', 'org')
    vi.stubEnv('GH_APP_REPO', 'repo')

    // Act & Assert
    expect(() => checkEnvVariables()).not.toThrow()
  })

  it.each(['GH_APP_ID', 'GH_APP_PRIVATE_KEY'])(
    'should call process.exit(1) if %s is not set',
    (envVar) => {
      // Arrange
      vi.stubEnv(envVar, '')

      // Act & Assert
      expect(() => checkEnvVariables()).toThrow('process exit')
      expect(logSpy).toHaveBeenCalledWith(`${envVar} is not set`)
      expect(exitSpy).toHaveBeenCalledWith(1)
    }
  )

  it('should call process.exit(1) if GH_APP_ORG is not set and GH_APP_REPO is set', () => {
    // Arrange
    vi.stubEnv('GH_APP_ORG', '')
    vi.stubEnv('GH_APP_REPO', 'repo')

    // Act & Assert
    expect(() => checkEnvVariables()).toThrow('process exit')
    expect(logSpy).toHaveBeenCalledWith(
      'Either GH_APP_ORG or both GH_APP_ORG and GH_APP_REPO must be set'
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('should call process.exit(1) if GH_APP_ORG and GH_APP_REPO are not set', () => {
    // Arrange
    vi.stubEnv('GH_APP_ORG', '')
    vi.stubEnv('GH_APP_REPO', '')

    // Act & Assert
    expect(() => checkEnvVariables()).toThrow('process exit')
    expect(logSpy).toHaveBeenCalledWith(
      'Either GH_APP_ORG or both GH_APP_ORG and GH_APP_REPO must be set'
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
