import * as fs from 'fs'
import * as path from 'path'
import { describe } from 'vitest'
import { afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import {
  MockServer,
  RunProcessResult,
  run,
} from '../../../../integration-tests/src/util'
import {
  adoFetcherExecutable,
  defaultAdoEnvironment,
  evidencePath,
  mockServerPort,
} from './common'
import { getAdoFixtures } from './fixtures/ado-fixtures'
import { verifyError } from './test-utils'

describe('I/O Configuration', () => {
  let mockServer: MockServer

  beforeAll(() => {
    expect(fs.existsSync(adoFetcherExecutable)).to.be.true
  })

  beforeEach(() => {
    fs.mkdirSync(evidencePath)
    mockServer = new MockServer(getAdoFixtures(mockServerPort))
  })

  afterEach(async () => {
    await mockServer?.stop()
    fs.rmSync(evidencePath, { recursive: true })
  })

  it('should fail if evidence_path does not exist', async () => {
    const evidencePath: string = path.join(
      defaultAdoEnvironment.evidence_path,
      'other'
    )
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        evidence_path: evidencePath,
      },
    })
    verifyError(
      result,
      `Error: evidence_path points to non-existing path ${evidencePath}`,
      mockServer
    )
  })

  it('should fail if evidence_path is not writable', async () => {
    fs.chmodSync(evidencePath, 0o444) // change access to read-only
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: defaultAdoEnvironment,
    })
    verifyError(
      result,
      `AppError [EnvironmentError]: ${evidencePath} is not writable!`,
      mockServer
    )
    fs.chmodSync(evidencePath, 0o777) // grant all access rights for cleanup
  })

  it('should fail if evidence_path points to a file', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        evidence_path: defaultAdoEnvironment.ADO_CONFIG_FILE_PATH,
      },
    })
    verifyError(
      result,
      'AppError [EnvironmentError]: evidence_path does not point to a directory!',
      mockServer
    )
  })

  it('should fail if config file does not exist', async () => {
    const configPath: string = path.join(
      __dirname,
      'fixtures',
      'non-existent.yaml'
    )
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: configPath,
      },
    })
    verifyError(
      result,
      `Error: ADO_CONFIG_FILE_PATH points to non-existing path ${configPath}`,
      mockServer
    )
  })

  it('should fail if config file is not readable', async () => {
    const configPath: string = path.join(
      __dirname,
      'fixtures',
      'other-config.yaml'
    )
    fs.copyFileSync(defaultAdoEnvironment.ADO_CONFIG_FILE_PATH, configPath)
    fs.chmodSync(configPath, 0o222) // change access to write-only
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: configPath,
      },
    })
    verifyError(
      result,
      `AppError [EnvironmentError]: ${configPath} is not readable!`,
      mockServer
    )
    fs.rmSync(configPath) // cleanup
  })

  it('should fail if ADO_CONFIG_FILE_PATH points to a directory', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: defaultAdoEnvironment.evidence_path,
      },
    })
    verifyError(
      result,
      'AppError [EnvironmentError]: ADO_CONFIG_FILE_PATH does not point to a file!',
      mockServer
    )
  })

  it('should fail if ADO_WORK_ITEMS_JSON_NAME exists already', async () => {
    const outputFileName = 'output.json'
    const outputFilePath: string = path.join(
      defaultAdoEnvironment.evidence_path,
      outputFileName
    )
    fs.writeFileSync(outputFilePath, 'some data')
    expect(fs.existsSync(outputFilePath)).toEqual(true) // check precondition: output file created
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_WORK_ITEMS_JSON_NAME: outputFileName,
      },
    })
    verifyError(
      result,
      `AppError [EnvironmentError]: File ${outputFilePath} exists already, can't write evidence!`,
      mockServer
    )
    fs.rmSync(outputFilePath) // cleanup
  })

  it('should fail if ADO_URL is not https secured', async () => {
    await mockServer?.stop()
    mockServer = new MockServer({
      ...getAdoFixtures(mockServerPort),
      https: false,
    })
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_URL: `http://localhost:${mockServerPort}`,
      },
    })
    verifyError(
      result,
      'Error: ADO fetcher can only establish https-secured connections',
      mockServer
    )
  })

  it('should fail if NODE_TLS_REJECT_UNAUTHORIZED is set to 0', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
    })
    verifyError(
      result,
      'AppError [EnvironmentError]: Environment variable NODE_TLS_REJECT_UNAUTHORIZED must not be set to 0 for security reasons',
      mockServer
    )
  })
})
