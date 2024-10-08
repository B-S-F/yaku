import { jest } from '@jest/globals'
import { ApiClient } from '@B-S-F/yaku-client-lib'
import { Environment } from './commands/environment'
import { EnvHttpProxyAgent } from 'undici'

const currentEnv: Environment = {
  name: 'new',
  url: 'http://dot.com/api/v1',
  accessToken: 'acc',
  expiresAt: 1719927052,
  namespace: 1,
  current: true,
}

// This is a workaround to mock the environment module, given the interference of commonjs and esmodules
jest.unstable_mockModule('./commands/environment', () => ({
  loadCurrentEnvironment: jest.fn(() => {
    return currentEnv
  }),
  updateEnvironment: jest.fn(() => {
    return {}
  }),
}))

jest.unstable_mockModule('./oauth', () => ({
  refreshOAuth: jest.fn(() => {
    return { ...currentEnv, refreshToken: 'updatedRefreshToken' }
  }),
}))

const oAuth = await import('./oauth')
const connection = await import('./connect')

describe('', () => {
  it('should use proxy env var compatible dispatcher', async () => {
    const result = await connection.connect()

    expect(result.client).toBeDefined()
    expect(result.client).toBeInstanceOf(ApiClient)

    expect(result.client['config']['baseUrl']).toBe(currentEnv.url)
    expect(result.client['config']['token']).toBe(currentEnv.accessToken)

    expect(result.client['config']['agent']).toBeInstanceOf(EnvHttpProxyAgent)
  })
})

describe('refreshEnvironment()', () => {
  it('should refresh the token', async () => {
    const result = await connection.refreshEnvironment({
      ...currentEnv,
      refreshToken: 'ref',
    })

    expect(oAuth.refreshOAuth).toHaveBeenCalled()
    expect(result.refreshToken).toEqual('updatedRefreshToken')
  })
})
