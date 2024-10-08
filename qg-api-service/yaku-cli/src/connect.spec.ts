import { jest } from '@jest/globals'
import { ApiClient } from '@B-S-F/yaku-client-lib'
import { Environment } from './commands/environment'
import { Agent, ProxyAgent } from 'undici'

const currentEnv: Environment = {
  name: 'new',
  url: 'http://dot.com/api/v1',
  accessToken: 'acc',
  expiresAt: 1719927052,
  namespace: 1,
  current: true,
}
const proxyVariables = [
  'https_proxy',
  'HTTPS_PROXY',
  'http_proxy',
  'HTTP_PROXY',
]

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

const env = await import('./commands/environment')
const oAuth = await import('./oauth')
const connection = await import('./connect')

const resultChecking = (result: any, usesProxyAgent: boolean) => {
  expect(env.loadCurrentEnvironment).toHaveBeenCalled()

  expect(result.client).toBeDefined()
  expect(result.client).toBeInstanceOf(ApiClient)

  expect(result.client['config']['baseUrl']).toBe(currentEnv.url)
  expect(result.client['config']['token']).toBe(currentEnv.accessToken)

  if (usesProxyAgent === true) {
    expect(result.client['config']['agent']).toBeInstanceOf(ProxyAgent)
  } else {
    expect(result.client['config']['agent']).toBeInstanceOf(Agent)
  }
}

describe('connect function from yaku-cli', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    proxyVariables.forEach((variable) => {
      delete process.env[variable]
    })
  })

  afterEach(() => {
    process.env = originalEnv
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('proxy environment variables are not set', () => {
    it('should use the Basic Agent when no proxy environment variables are set', async () => {
      const result = await connection.connect()

      proxyVariables.forEach((variable) => {
        expect(process.env[variable]).toBeUndefined()
      })
      resultChecking(result, false)
    })
  })

  describe('proxy environment variables are set to empty string', () => {
    it.each(proxyVariables)(
      'should use the Basic Agent when %s is set to an empty string',
      async (proxyVariable) => {
        process.env[proxyVariable] = ''

        const result = await connection.connect()

        proxyVariables.forEach((variable) => {
          if (variable === proxyVariable) {
            expect(process.env[variable]).toBeDefined()
          } else {
            expect(process.env[variable]).toBeUndefined()
          }
        })
        resultChecking(result, false)
      }
    )
  })

  describe('proxy environment variables are set', () => {
    it.each(proxyVariables)(
      'should use the Basic Agent when %s is set',
      async (proxyVariable) => {
        process.env[proxyVariable] = 'https://192.168.1.3:8080/'

        const result = await connection.connect()

        proxyVariables.forEach((variable) => {
          if (variable === proxyVariable) {
            expect(process.env[variable]).toBeDefined()
          } else {
            expect(process.env[variable]).toBeUndefined()
          }
        })
        resultChecking(result, true)
      }
    )
  })

  describe('precedence of proxy environment variables', () => {
    it.each([
      {
        description:
          'should use https_proxy when both https_proxy and http_proxy are set',
        proxy: {
          https_proxy: 'https://192.168.1.3:8080/',
          http_proxy: 'http://192.168.1.3:8080/',
        },
        expectedProxy: 'https_proxy',
      },
      {
        description:
          'should use https_proxy when https_proxy and HTTPS_PROXY are set',
        proxy: {
          https_proxy: 'https://192.168.1.3:8080/',
          HTTPS_PROXY: 'https://193.168.1.3:8080/',
        },
        expectedProxy: 'https_proxy',
      },
      {
        description:
          'should use http_proxy when both http_proxy and HTTP_PROXY are set',
        proxy: {
          http_proxy: 'http://192.168.1.3:8080/',
          HTTP_PROXY: 'http://193.168.1.3:8080/',
        },
        expectedProxy: 'http_proxy',
      },
      {
        description:
          'should use https_proxy when all proxy environment variables are set',
        proxy: {
          https_proxy: 'https://192.168.1.3:8080/',
          http_proxy: 'http://193.168.1.3:8080/',
          HTTP_PROXY: 'http://194.168.1.3:8080/',
          HTTPS_PROXY: 'https://195.168.1.3:8080/',
        },
        expectedProxy: 'https_proxy',
      },
    ])('$description', async ({ proxy, expectedProxy }) => {
      Object.keys(proxy).forEach((key) => {
        process.env[key] = proxy[key as keyof typeof proxy]
      })

      const result = await connection.connect()

      const symbols = Object.getOwnPropertySymbols(
        result.client['config']['agent']
      )
      const proxyAgentOptionsSymbol = symbols.find(
        (symbol) => symbol.toString() === 'Symbol(proxy agent options)'
      )
      const proxyAgentOptions = proxyAgentOptionsSymbol
        ? result.client['config']['agent'][proxyAgentOptionsSymbol]
        : undefined

      proxyVariables.forEach((variable) => {
        if (proxy.hasOwnProperty(variable)) {
          expect(process.env[variable]).toBeDefined()
        } else {
          expect(process.env[variable]).toBeUndefined()
        }
      })
      expect(proxyAgentOptions.uri).toBe(process.env[expectedProxy])
      resultChecking(result, true)
    })
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
