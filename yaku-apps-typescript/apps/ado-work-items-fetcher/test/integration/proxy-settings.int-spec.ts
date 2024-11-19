import * as fs from 'fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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

describe('Ado Fetcher Proxy Settings', () => {
  const adoEnvironment = {
    ...defaultAdoEnvironment,
    ADO_APPLY_PROXY_SETTINGS: 'true',
  }

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

  it('should fail when PROXY_HOST is not set', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...adoEnvironment,
        PROXY_PORT: '9000',
      },
    })
    verifyError(
      result,
      'ReferenceError: The environment variable "PROXY_HOST" is not set!',
      mockServer,
    )
  })

  it('should fail when PROXY_PORT is not set', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...adoEnvironment,
        PROXY_HOST: 'my.proxy',
      },
    })
    verifyError(
      result,
      'ReferenceError: The environment variable PROXY_PORT" is not set!',
      mockServer,
    )
  })

  it('should fail when PROXY_PORT is lower than 1', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...adoEnvironment,
        PROXY_HOST: 'my.proxy',
        PROXY_PORT: '0',
      },
    })
    verifyError(
      result,
      'Error: environment variable PROXY_PORT does not represent an integer value in the range 0 < PROXY_PORT < 65535',
      mockServer,
    )
  })

  it('should fail when PROXY_PORT is greater than 65535', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...adoEnvironment,
        PROXY_HOST: 'my.proxy',
        PROXY_PORT: '65536',
      },
    })
    verifyError(
      result,
      'Error: environment variable PROXY_PORT does not represent an integer value in the range 0 < PROXY_PORT < 65535',
      mockServer,
    )
  })

  it('should fail when PROXY_PORT does not represent a numeric value', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...adoEnvironment,
        PROXY_HOST: 'my.proxy',
        PROXY_PORT: 'abc',
      },
    })
    verifyError(
      result,
      'Error: environment variable PROXY_PORT must contain digits only',
      mockServer,
    )
  })

  it('should fail when PROXY_PORT represents a floating point value', async () => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...adoEnvironment,
        PROXY_HOST: 'my.proxy',
        PROXY_PORT: '900.1',
      },
    })
    verifyError(
      result,
      'Error: environment variable PROXY_PORT must contain digits only',
      mockServer,
    )
  })

  it.each(['my.proxy', 'localhost', '127.0.0.1'])(
    'should succeed with valid hostname %s',
    async (hostname: string) => {
      const result: RunProcessResult = await run(adoFetcherExecutable, [], {
        env: {
          ...adoEnvironment,
          PROXY_HOST: hostname,
          PROXY_PORT: '9000',
        },
      })

      expect(result.stdout).length(0)
      if (result.exitCode !== 0) {
        /*
         * The fetcher will likely fail, since it either can't establish a connection to the given host
         * or it can't resolve the hostname.
         * However, in these cases, proxy settings were correct and the fetcher tried to make the request
         * through the proxy.
         * If the fetcher failed for any other reason, the following expect will make the test fail.
         */
        expect(
          result.stderr[0].match(/(ECONNREFUSED|ENOTFOUND)/g).length,
        ).toBeGreaterThan(0)
      }
    },
  )

  it.each([
    'exa_mple.com',
    '-example.com',
    'my.proxy:3000',
    'http://my.proxy',
    'https://my.proxy',
  ])('should fail with invalid hostname %s', async (hostname: string) => {
    const result: RunProcessResult = await run(adoFetcherExecutable, [], {
      env: {
        ...adoEnvironment,
        PROXY_HOST: hostname,
        PROXY_PORT: '9000',
      },
    })
    verifyError(result, `Error: invalid PROXY_HOST: ${hostname}`, mockServer)
  })
})
