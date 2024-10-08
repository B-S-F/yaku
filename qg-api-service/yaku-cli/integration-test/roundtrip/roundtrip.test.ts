import {
  Config,
  Namespace,
  Run,
  RunPaginated,
  SecretMetadata,
  Token,
  TokenMetadata,
  User,
} from '@B-S-F/yaku-client-lib'
import { randomUUID } from 'crypto'
import { stat, unlink } from 'fs/promises'
import path from 'path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import {
  createEnvironmentAndSwitch,
  deleteEnvironmentAndSwitchToDefault,
  switchToEnvironment,
} from '../cli/environment-utils'
import { run } from '../cli/process'

describe('Roundtrip test applying many functions of the cli on a local backend system', async () => {
  const yakuCliExecutable = `${__dirname}/../../dist/index.js`

  const serverUrl = 'http://localhost:3000/api/v1'
  let adminEnv = process.env['LOCAL_ADMIN_ENV'] ?? ''

  let userEnvironment: string

  const username = randomUUID()
  const namespacename = randomUUID()

  let user: User
  let token: Token
  let namespace: Namespace
  let secret: SecretMetadata
  let config: Config
  let resultFile: string
  let evidenceFile: string

  beforeAll(async () => {
    expect(adminEnv).not.toBeFalsy()
    expect(
      await stat(yakuCliExecutable)
        .then(() => true)
        .catch(() => false)
    ).to.be.true
    await switchToEnvironment(yakuCliExecutable, adminEnv)
  })

  afterAll(async () => {
    if (config) {
      await deleteConfig(config.id)
    }
    if (secret) {
      await deleteSecret(secret.name)
    }

    await switchToEnvironment(yakuCliExecutable, adminEnv)

    if (token) {
      await deleteToken(token.id)
    }

    if (userEnvironment) {
      await deleteEnvironmentAndSwitchToDefault(
        yakuCliExecutable,
        userEnvironment
      )
    }

    if (resultFile) {
      unlink(resultFile)
    }
    if (evidenceFile) {
      unlink(evidenceFile)
    }
  })

  test('A whole roundtrip through the cli', async () => {
    user = await checkUser(username)
    token = await checkToken(user.username)

    namespace = await checkNamespace(namespacename, user.username)

    await createEnvironmentAndSwitch(
      yakuCliExecutable,
      `${username}-env`,
      serverUrl,
      token.token,
      namespace.id
    )

    secret = await checkSecret(
      'TEST_SECRET',
      'A secret for the roundtrip test',
      'SET'
    )
    config = await checkConfigs()
    await checkRun(namespace.id, config.id)
  }, 300000)

  async function checkUser(username: string): Promise<User> {
    const createParams = ['users', 'create', username]
    expect(await executeCall(createParams, true)).toEqual({ username })

    const getParams = ['users', 'list']
    const createdUser = (await executeCall(getParams, true)).filter(
      (user: User) => user.username === username
    )

    return createdUser[0]
  }

  async function checkToken(username: string): Promise<Token> {
    const createParams = ['tokens', 'create', username]
    const createdToken: Token = await executeCall(createParams, true)

    const getParams = ['tokens', 'list']
    expect(
      (await executeCall(getParams, true)).filter(
        (token: TokenMetadata) => token.id === createdToken.id
      ).length
    ).toBe(1)

    return createdToken
  }

  async function deleteToken(id: number): Promise<void> {
    const deleteParams = ['tokens', 'delete', String(id)]

    return executeCall(deleteParams)
  }

  async function checkNamespace(
    name: string,
    username: string
  ): Promise<Namespace> {
    const createParams = [
      'namespaces',
      'create',
      '-i',
      path.join('integration-test', 'testdata', 'qg-config.yaml'),
      name,
      username,
    ]
    const createdNamespace: Namespace = await executeCall(createParams, true)
    expect(createdNamespace).toEqual({
      id: createdNamespace.id,
      name,
      users: [{ username }],
    })

    const update1Params = [
      'namespaces',
      'update',
      String(createdNamespace.id),
      '-u',
      'admin',
    ]
    const updatedNamespace1: Namespace = await executeCall(update1Params, true)
    expect(updatedNamespace1).toEqual({
      id: createdNamespace.id,
      name,
      users: expect.anything(),
    })
    expect(updatedNamespace1.users).toContainEqual({ username })
    expect(updatedNamespace1.users).toContainEqual({ username: 'admin' })

    const update2Params = [
      'namespaces',
      'update',
      String(createdNamespace.id),
      '-u',
      username,
      '-m',
      'replace',
    ]
    const updatedNamespace2: Namespace = await executeCall(update2Params, true)
    expect(updatedNamespace2).toEqual(createdNamespace)

    const listParams = ['namespaces', 'list']
    expect(
      (await executeCall(listParams, true)).filter(
        (namespace: Namespace) => namespace.id === createdNamespace.id
      ).length
    ).toBe(1)

    const showParams = ['namespaces', 'show', String(createdNamespace.id)]
    expect(await executeCall(showParams, true)).toEqual(createdNamespace)

    return createdNamespace
  }

  async function checkSecret(
    name: string,
    description: string,
    value: string
  ): Promise<SecretMetadata> {
    const createParams = ['secrets', 'create', name, value]
    const createdSecret: SecretMetadata = await executeCall(createParams, true)
    expect(createdSecret).toEqual({ name })

    const updateParams = ['secrets', 'update', name, value, description]
    const updatedSecret: SecretMetadata = await executeCall(updateParams, true)
    expect(updatedSecret).toEqual({ name, description })

    const listParams = ['secrets', 'list']
    expect(
      (await executeCall(listParams, true)).filter(
        (data: SecretMetadata) => data.name === name
      ).length
    ).toBe(1)

    return updatedSecret
  }

  async function deleteSecret(name: string): Promise<void> {
    const deleteParams = ['secrets', 'delete', name]

    return executeCall(deleteParams)
  }

  async function checkConfigs(): Promise<Config> {
    const listParams = ['configs', 'list', '--all']
    const listedConfig: Config[] = await executeCall(listParams, true)
    expect(listedConfig.length).toBe(1)

    const config = listedConfig[0]

    const updateParams = [
      'configs',
      'update',
      String(config.id),
      config.name,
      'Test config for roundtrip test',
    ]
    const updatedConfig: Config = await executeCall(updateParams, true)
    expect(updatedConfig).toEqual({
      id: config.id,
      name: config.name,
      description: 'Test config for roundtrip test',
      creationTime: config.creationTime,
      lastModificationTime: expect.anything(),
      files: expect.anything(),
    })

    const showParams = ['configs', 'show', String(config.id)]
    const shownConfig: Config = await executeCall(showParams, true)
    expect(shownConfig).toEqual({
      id: config.id,
      name: config.name,
      description: 'Test config for roundtrip test',
      creationTime: config.creationTime,
      lastModificationTime: expect.anything(),
      files: expect.anything(),
    })

    return updatedConfig
  }

  async function deleteConfig(id: number): Promise<void> {
    const deleteParams = ['configs', 'delete', '--force', String(id)]

    return executeCall(deleteParams)
  }

  async function checkRun(
    namespaceId: number,
    configId: number
  ): Promise<void> {
    const createParams = [
      'runs',
      'create',
      String(configId),
      '--wait',
      '--details',
      '--environment',
      'TEST_ENV_VAR',
      'TEST',
    ]
    const run: Run = await executeCall(createParams, true)
    const expectedRun = {
      id: expect.anything(),
      status: 'completed',
      config: `${serverUrl.replace(
        'http',
        'https'
      )}/namespaces/${namespaceId}/configs/${configId}`,
      overallResult: 'GREEN',
      creationTime: expect.anything(),
      completionTime: expect.anything(),
    }
    const expectedDetailedRun = {
      ...expectedRun,
      argoName: expect.anything(),
      argoNamespace: expect.anything(),
      log: expect.anything(),
    }
    expect(run).toEqual(expectedDetailedRun)

    const resultParams = ['runs', 'result', String(run.id)]
    await executeCall(resultParams)
    expect(
      await stat('qg-result.yaml')
        .then(() => true)
        .catch(() => false)
    ).to.be.true
    resultFile = 'qg-result.yaml'

    const evidenceParams = ['runs', 'evidences', String(run.id)]
    await executeCall(evidenceParams)
    expect(
      await stat('evidences.zip')
        .then(() => true)
        .catch(() => false)
    ).to.be.true
    evidenceFile = 'evidences.zip'

    const listParams = ['runs', 'list', '1']
    const listedRuns: RunPaginated = await executeCall(listParams, true)

    expect(listedRuns.pagination.pageNumber).toBe(1)
    expect(listedRuns.pagination.totalCount).toBe(1)
    expect(listedRuns.data[0]).toEqual(expectedRun)
  }

  async function executeCall(params: string[], parseIt = false): Promise<any> {
    const result = await run(yakuCliExecutable, params, {
      env: { ...process.env },
    })
    if (result.stderr) {
      console.error(result.stderr)
    }
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBeFalsy()

    if (parseIt) {
      return JSON.parse(result.stdout)
    }
  }
})
