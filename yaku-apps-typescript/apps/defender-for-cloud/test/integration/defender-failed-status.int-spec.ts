// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import * as fs from 'fs'
import * as path from 'path'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
  RunProcessResult,
  run,
} from '../../../../integration-tests/src/util'
import { createMockServerOptionsFAILED } from '../fixtures/serverHelper'
import {
  integrationTestResultsFixtureFAILED,
  integrationTestResultsFixtureForClientSecretFAILED,
} from '../fixtures/alerts'

describe('Defender Autopilot FAILED status cases', () => {
  let mockServer: MockServer | undefined

  const communEnvVariables = {
    TENANT_ID: 'mockedTenantId',
    CLIENT_ID: 'mockedClientId',
    CLIENT_SECRET: 'mockedClientSecret',
    SUBSCRIPTION_ID: 'mockedSubscriptionId',
    IS_INTEGRATION_TEST: 'true',
  }

  const defenderAutopilotExecutable: string = path.join(
    __dirname,
    '..',
    '..',
    'dist',
    'index.js',
  )

  beforeAll(() => {
    expect(fs.existsSync(defenderAutopilotExecutable)).to.be.true
  })

  afterEach(async () => {
    await mockServer?.stop()
    mockServer = undefined
  })

  it('should return status FAILED when environment variables are not set', async () => {
    const env = {}
    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...env,
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stderr).to.have.length(0)
    expect(result.stdout).to.not.have.length(0)
    expect(result.stdout).to.include(
      JSON.stringify({
        status: 'FAILED',
        reason:
          'Please provide TENANT_ID in the environmental variables before running the autopilot',
      }),
    )
  })

  it.each([
    { name: 'TENANT_ID', value: undefined },
    { name: 'CLIENT_ID', value: undefined },
    { name: 'CLIENT_SECRET', value: undefined },
    { name: 'SUBSCRIPTION_ID', value: undefined },
  ])('should set status FAILED when $name is not set', async (envVariable) => {
    const env = { ...communEnvVariables }
    env[`${envVariable.name}`] = envVariable.value

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...env,
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stderr).to.have.length(0)
    expect(result.stdout).to.not.have.length(0)
    expect(result.stdout).to.include(
      JSON.stringify({
        status: 'FAILED',
        reason:
          'Please provide ' +
          `${envVariable.name} ` +
          'in the environmental variables before running the autopilot',
      }),
    )
  })

  it.each([
    { name: 'TENANT_ID', value: '' },
    { name: 'CLIENT_ID', value: '' },
    { name: 'CLIENT_SECRET', value: '' },
    { name: 'SUBSCRIPTION_ID', value: '' },
  ])(
    'should set status FAILED when $name is an empty string',
    async (envVariable) => {
      const env = { ...communEnvVariables }
      env[`${envVariable.name}`] = envVariable.value

      const result: RunProcessResult = await run(
        defenderAutopilotExecutable,
        [],
        {
          env: {
            ...env,
          },
        },
      )

      expect(result.exitCode).to.be.equal(0)
      expect(result.stderr).to.have.length(0)
      expect(result.stdout).to.not.have.length(0)
      expect(result.stdout).to.include(
        JSON.stringify({
          status: 'FAILED',
          reason:
            'Please provide ' +
            `${envVariable.name} ` +
            'in the environmental variables before running the autopilot',
        }),
      )
    },
  )

  it.each([
    { name: 'TENANT_ID' },
    { name: 'CLIENT_ID' },
    { name: 'SUBSCRIPTION_ID' },
  ])('should set status FAILED when $name is not correct', async () => {
    const options: MockServerOptions = await createMockServerOptionsFAILED(
      8080,
      400,
    )
    mockServer = new MockServer(options)

    const env = { ...communEnvVariables }

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...env,
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stderr).to.have.length(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsFixtureFAILED.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })

  it('should set status FAILED when CLIENT_SECRET is not correct', async () => {
    const options: MockServerOptions = await createMockServerOptionsFAILED(
      8080,
      401,
    )
    mockServer = new MockServer(options)

    const env = { ...communEnvVariables }

    const result: RunProcessResult = await run(
      defenderAutopilotExecutable,
      [],
      {
        env: {
          ...env,
        },
      },
    )

    expect(result.exitCode).to.be.equal(0)
    expect(result.stderr).to.have.length(0)
    expect(result.stdout).to.not.have.length(0)
    expect(JSON.stringify(result.stdout)).toEqual(
      JSON.stringify(
        integrationTestResultsFixtureForClientSecretFAILED.map((element) => {
          return JSON.stringify(element)
        }),
      ),
    )
  })
})
