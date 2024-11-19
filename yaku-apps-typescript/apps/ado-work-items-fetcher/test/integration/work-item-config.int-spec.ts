// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

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
  fixturesPath,
  mockServerPort,
} from './common'
import { getAdoFixtures } from './fixtures/ado-fixtures'
import { verifyError } from './test-utils'

describe('Work Item Configuration', () => {
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

  it('should fail if workItems configuration object is present, but empty', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-workitems-is-empty.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems ~ Message: Expected object, received null',
      mockServer,
    )
  })

  it('should fail with empty configuration file', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(fixturesPath, 'config-empty.yaml'),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path:  ~ Message: Expected object, received null',
      mockServer,
    )
  })

  it('should fail if configuration file does not contain an object', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(fixturesPath, 'config-no-object.yaml'),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path:  ~ Message: Expected object, received string',
      mockServer,
    )
  })

  it('should fail if workItems is not an object', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-workitems-no-object.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems ~ Message: Expected object, received string',
      mockServer,
    )
  })

  it('should fail if query is not a string', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-query-is-no-string.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems.query ~ Message: Expected string, received number',
      mockServer,
    )
  })

  it('should fail if neededFields is not an array', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-neededfields-is-no-array.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems.neededFields ~ Message: Expected array, received number',
      mockServer,
    )
  })

  it('should fail if neededField is an array, but contains an object', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-neededfields-contains-object.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems.neededFields[0] ~ Message: Expected string, received object',
      mockServer,
    )
  })

  it('should fail if hierarchyDepth is not a number', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-hierarchydepth-is-no-number.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems.hierarchyDepth ~ Message: Expected number, received string',
      mockServer,
    )
  })

  it('should fail if hierarchyDepth is a floating point number', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-hierarchydepth-is-floating-point-number.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems.hierarchyDepth ~ Message: Expected integer, received float',
      mockServer,
    )
  })

  it('should fail if hierarchyDepth is negative', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-hierarchydepth-is-negative.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: too_small ~ Path: workItems.hierarchyDepth ~ Message: Number must be greater than 0',
      mockServer,
    )
  })

  it('should fail if relations is no object', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-relations-is-no-object.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems.relations ~ Message: Expected object, received string',
      mockServer,
    )
  })

  it('should fail if relations.get is not a boolean', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-relations-get-is-no-boolean.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_type ~ Path: workItems.relations.relations.get ~ Message: Expected boolean, received string',
      mockServer,
    )
  })

  it('should fail if relations.relationType contains an unsupported value', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...defaultAdoEnvironment,
        ADO_CONFIG_FILE_PATH: path.join(
          fixturesPath,
          'config-relations-type-is-unsupported.yaml',
        ),
      },
    })

    verifyError(
      result,
      'Error: Code: invalid_union ~ Path: workItems.relations.relations.relationType ~ Message: Invalid input',
      mockServer,
    )
  })
})
