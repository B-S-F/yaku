// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { run } from '../../../../integration-tests/src/util'
import { version } from '../../package.json'

const executable = `${__dirname}/../../dist/index.js`

describe('sonarqube', async () => {
  it('should be available', async () => {
    const { stderr, exitCode } = await run(`${executable}`, ['--help'])
    expect(exitCode).toEqual(0)
    expect(stderr).toHaveLength(0)
  })
  it('should show current version', async () => {
    const { stdout, stderr, exitCode } = await run(`${executable}`, [
      '--version',
    ])
    expect(exitCode).toEqual(0)
    expect(stderr).toHaveLength(0)
    expect(stdout).toContain(version)
  })
  it('should show help', async () => {
    const { stdout, stderr, exitCode } = await run(`${executable}`, ['--help'])
    expect(exitCode).toEqual(0)
    expect(stderr).toHaveLength(0)
    expect(stdout).toContain('Usage: sonarqube [options] [command]')
    expect(stdout).toContain('  fetch           Fetch data from Sonarqube.')
  })
  it('should show help for fetch', async () => {
    const { stdout, stderr, exitCode } = await run(`${executable}`, [
      'fetch',
      '--help',
    ])
    expect(exitCode).toEqual(0)
    expect(stderr).toHaveLength(0)
    expect(stdout).toContain('Usage: sonarqube fetch [options] [command]')
    expect(stdout).toContain(
      '  project-status [options]  Fetch project status from Sonarqube.',
    )
  })
  it('should show help for fetch project-status', async () => {
    const { stdout, stderr, exitCode } = await run(`${executable}`, [
      'fetch',
      'project-status',
      '--help',
    ])
    expect(exitCode).toEqual(0)
    expect(stderr).toHaveLength(0)
    expect(stdout).toContain('Usage: sonarqube fetch project-status [options]')
    expect(stdout).toContain('Fetch project status from Sonarqube.')
  })
  it('should support environment variables', async () => {
    const { stdout, exitCode } = await run(`${executable}`, [
      'fetch',
      'project-status',
    ])
    expect(exitCode).toEqual(0)
    expect(stdout).toContain(
      '{"status":"FAILED","reason":"hostname is not set\\naccess token is not set"}',
    )
    const { stdout: stdout2, exitCode: exitCode2 } = await run(
      `${executable}`,
      ['fetch', 'project-status'],
      {
        env: {
          SONARQUBE_HOSTNAME: 'hostname',
          SONARQUBE_PORT: '8080',
          SONARQUBE_PROTOCOL: 'https',
          SONARQUBE_PROJECT_KEY: 'projectKey',
          SONARQUBE_OUTPUT_PATH: 'outputPath',
        },
      },
    )
    expect(exitCode2).toEqual(0)
    expect(stdout2).toContain(
      '{"status":"FAILED","reason":"access token is not set"}',
    )
  })
})
