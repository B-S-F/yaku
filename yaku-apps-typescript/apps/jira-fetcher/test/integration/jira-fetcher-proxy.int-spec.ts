import { afterEach, describe, expect, it } from 'vitest'
import {
  MOCK_SERVER_CERT_PATH,
  MockServer,
  MockServerOptions,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'

import { getEmptySearchMockOptions } from './fixtures/getEmptySearchMockOptions'

const jiraFetcherExecutable = `${__dirname}/../../dist/index.js`
const MOCK_SERVER_PORT = 8080

describe('Proxy', () => {
  let mockServer: MockServer | undefined

  const options: MockServerOptions = getEmptySearchMockOptions(MOCK_SERVER_PORT)

  afterEach(async () => {
    await mockServer?.stop()
  })

  it('should try to connect to proxy', async () => {
    const env = {
      NODE_EXTRA_CA_CERTS: MOCK_SERVER_CERT_PATH,
      JIRA_URL: `https://localhost:${MOCK_SERVER_PORT}`,
      JIRA_CONFIG_FILE_PATH: `${__dirname}/configs/jira-bug-tickets.yaml`,
      JIRA_PAT: 'abcde',
      HTTPS_PROXY: `https://localhost:${MOCK_SERVER_PORT}/`,
    }

    mockServer = new MockServer(options)

    const result: RunProcessResult = await run(
      jiraFetcherExecutable,
      undefined,
      {
        env: env,
      },
    )

    // We do not implement CONNECT in the mock server which is needed for proxy functionality
    // Resort to check for a failed proxy connect attempt
    expect(result.stderr.join()).toContain('Proxy')
    expect(result.stderr.join()).toContain('CONNECT')

    // We expect that nothing comes through
    expect(mockServer.getNumberOfRequests()).toEqual(0)
  }),
    it('should connect directly', async () => {
      const env = {
        NODE_EXTRA_CA_CERTS: MOCK_SERVER_CERT_PATH,
        JIRA_URL: `https://localhost:${MOCK_SERVER_PORT}`,
        JIRA_CONFIG_FILE_PATH: `${__dirname}/configs/jira-bug-tickets.yaml`,
        JIRA_PAT: 'abcde',
      }

      mockServer = new MockServer(options)

      await run(jiraFetcherExecutable, undefined, {
        env: env,
      })

      expect(
        mockServer.getRequests('/rest/api/2/search', 'post').length,
      ).toEqual(1)
      expect(mockServer.getNumberOfRequests()).toEqual(1)
    })
})
