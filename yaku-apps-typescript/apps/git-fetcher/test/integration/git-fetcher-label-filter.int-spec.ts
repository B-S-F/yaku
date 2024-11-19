import * as fs from 'fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MockServer,
  MockServerOptions,
  run,
  RunProcessResult,
} from '../../../../integration-tests/src/util'
import { getGitPullRequestsMockOptions } from './fixtures/getGitPullRequestsMockServerResponse'
import {
  defaultEnvironment,
  gitFetcherExecutable,
  MOCK_SERVER_PORT,
  verifyOutputFile,
} from './utils'

describe('Label Filter', () => {
  let mockServer: MockServer | undefined

  beforeAll(() => {
    expect(fs.existsSync(gitFetcherExecutable)).toBe(true)
  })

  beforeEach(() => {
    fs.mkdirSync(`${defaultEnvironment.evidence_path}`)
  })

  afterEach(async () => {
    fs.rmSync(`${defaultEnvironment.evidence_path}`, {
      recursive: true,
    })
    await mockServer?.stop()
  })

  describe('Success Cases', () => {
    const options: MockServerOptions = getGitPullRequestsMockOptions(
      MOCK_SERVER_PORT,
      200,
    )

    it('should fetch pull requests from GitHub, but should return empty string, when label filter does not match pr-labels', async () => {
      const env = {
        ...defaultEnvironment,
        GIT_FETCHER_SERVER_AUTH_METHOD: 'token',
        GIT_FETCHER_SERVER_TYPE: 'github',
        GIT_FETCHER_API_TOKEN: 'someToken',
        GIT_FETCHER_CONFIG_FILE_PATH: `${__dirname}/configs/git-fetcher-config-github-wrong-label.yml`,
      }

      mockServer = new MockServer(options)

      const result: RunProcessResult = await run(
        gitFetcherExecutable,
        undefined,
        {
          env: env,
        },
      )

      await verifyOutputFile(env.evidence_path, true, JSON.stringify([]))
      expect(result.exitCode).to.equal(0)
    })
  })
})
