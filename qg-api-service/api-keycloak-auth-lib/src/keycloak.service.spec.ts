import { Test, TestingModule } from '@nestjs/testing'
import { KeyCloakConfig, KeyCloakService } from './keycloak.service'
import { LoggerModule } from 'nestjs-pino'
import fetch from 'node-fetch'
jest.mock('node-fetch')

describe('KeyCloakService', () => {
  let service: KeyCloakService

  beforeEach(async () => {
    jest.resetAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        KeyCloakService,
        {
          provide: KeyCloakConfig,
          useFactory: () =>
            new KeyCloakConfig(
              'https://bswf.authz.bosch.com',
              'bswf',
              'on',
              'foo',
              'bar',
              'https://bswf.authz.bosch.com/auth/admin/realm/bswf',
              'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
            ),
        },
      ],
    }).compile()

    service = module.get<KeyCloakService>(KeyCloakService)

    jest
      .spyOn(service, 'onApplicationBootstrap')
      .mockImplementation(async () => {
        service['OIDCEndpoints'] = {
          introspection_endpoint:
            'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
          token_endpoint:
            'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token',
        }
      })
    service.onApplicationBootstrap()
  })

  it('should be defined properly', () => {
    expect(service).toBeDefined()
  })

  it('should return the expected user information', async () => {
    const mockPayload = {
      sub: '1234567890',
      name: 'John Doe',
      preferred_username: 'johndoe',
      email: 'johndoe@example.com',
      resource_access: {
        GLOBAL: {
          roles: ['role1', 'role2'],
        },
        NAMESPACE_1: {
          roles: ['namespace1_role1', 'namespace1_role2'],
        },
        NAMESPACE_2: {
          roles: ['namespace2_role1', 'namespace2_role2'],
        },
        iss: 'issuer',
        exp: 1644345600,
        iat: 1644342000,
      },
    }
    const mockJsonString = JSON.stringify(mockPayload)
    const mockBase64Payload = Buffer.from(mockJsonString).toString('base64')
    const mockToken = `0.${mockBase64Payload}.0`

    const userObject = await service.getKeyCloakUser(mockToken)

    expect(userObject.username).toEqual('johndoe')
    expect(userObject.roles).toStrictEqual(['role1', 'role2'])
  })

  it('should return the expected user information if globalRoleClientId is changed', async () => {
    service = new KeyCloakService(
      new KeyCloakConfig(
        'https://bswf.authz.bosch.com',
        'bswf',
        'on',
        'foo',
        'bar',
        'https://bswf.authz.bosch.com/auth/admin/realm/bswf',
        'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
        false,
        'TEST',
      ),
    )
    const mockPayload = {
      sub: '1234567890',
      name: 'John Doe',
      preferred_username: 'johndoe',
      email: 'johndoe@example.com',
      resource_access: {
        TEST: {
          roles: ['role1', 'role2'],
        },
        NAMESPACE_1: {
          roles: ['namespace1_role1', 'namespace1_role2'],
        },
        NAMESPACE_2: {
          roles: ['namespace2_role1', 'namespace2_role2'],
        },
        iss: 'issuer',
        exp: 1644345600,
        iat: 1644342000,
      },
    }
    const mockJsonString = JSON.stringify(mockPayload)
    const mockBase64Payload = Buffer.from(mockJsonString).toString('base64')
    const mockToken = `0.${mockBase64Payload}.0`
    const userObject = await service.getKeyCloakUser(mockToken)

    expect(userObject.username).toEqual('johndoe')
    expect(userObject.roles).toStrictEqual(['role1', 'role2'])
  })

  it('should not return roles if the they are not an array', async () => {
    const mockPayload = {
      sub: '1234567890',
      name: 'John Doe',
      preferred_username: 'johndoe',
      email: 'johndoe@example.com',
      resource_access: {
        GLOBAL: {
          roles: 'test',
        },
        NAMESPACE_1: {
          roles: ['namespace1_role1', 'namespace1_role2'],
        },
        NAMESPACE_2: {
          roles: ['namespace2_role1', 'namespace2_role2'],
        },
        iss: 'issuer',
        exp: 1644345600,
        iat: 1644342000,
      },
    }
    const mockJsonString = JSON.stringify(mockPayload)
    const mockBase64Payload = Buffer.from(mockJsonString).toString('base64')
    const mockToken = `0.${mockBase64Payload}.0`

    const userObject = await service.getKeyCloakUser(mockToken)

    expect(userObject.username).toEqual('johndoe')
    expect(userObject.roles).toStrictEqual([])
  })

  it('should not return roles if the the roles key does not exist', async () => {
    const mockPayload = {
      sub: '1234567890',
      name: 'John Doe',
      preferred_username: 'johndoe',
      email: 'johndoe@example.com',
      resource_access: {
        GLOBAL: {},
        NAMESPACE_1: {
          roles: ['namespace1_role1', 'namespace1_role2'],
        },
        NAMESPACE_2: {
          roles: ['namespace2_role1', 'namespace2_role2'],
        },
        iss: 'issuer',
        exp: 1644345600,
        iat: 1644342000,
      },
    }
    const mockJsonString = JSON.stringify(mockPayload)
    const mockBase64Payload = Buffer.from(mockJsonString).toString('base64')
    const mockToken = `0.${mockBase64Payload}.0`

    const userObject = await service.getKeyCloakUser(mockToken)

    expect(userObject.username).toEqual('johndoe')
    expect(userObject.email).toEqual('johndoe@example.com')
    expect(userObject.roles).toStrictEqual([])
  })

  it('should not return roles if the client does not exist in resource_access', async () => {
    const mockPayload = {
      sub: '1234567890',
      name: 'John Doe',
      preferred_username: 'johndoe',
      email: 'johndoe@example.com',
      resource_access: {
        NAMESPACE_1: {
          roles: ['namespace1_role1', 'namespace1_role2'],
        },
        NAMESPACE_2: {
          roles: ['namespace2_role1', 'namespace2_role2'],
        },
        iss: 'issuer',
        exp: 1644345600,
        iat: 1644342000,
      },
    }
    const mockJsonString = JSON.stringify(mockPayload)
    const mockBase64Payload = Buffer.from(mockJsonString).toString('base64')
    const mockToken = `0.${mockBase64Payload}.0`

    const userObject = await service.getKeyCloakUser(mockToken)

    expect(userObject.username).toEqual('johndoe')
    expect(userObject.email).toEqual('johndoe@example.com')
    expect(userObject.roles).toStrictEqual([])
  })

  it('should return a meaningful error if the token information is not complete', async () => {
    const mockPayload = {}
    const mockJsonString = JSON.stringify(mockPayload)
    const mockBase64Payload = Buffer.from(mockJsonString).toString('base64')
    const mockToken = `0.${mockBase64Payload}.0`

    try {
      await service.getKeyCloakUser(mockToken)
      // If the code reaches here, the test should fail because it should throw an error.
      fail('Expected the function to throw an error')
    } catch (error) {
      // Assert that the error message is as expected.
      expect(error.message).toBe(
        'Error in getKeyCloakUser: No preferred_username in token: 0.e30=.0',
      )
    }
  })

  it('should return the OpenID Connect Endpoints', async () => {
    const IODCEndpoints = {
      introspection_endpoint:
        'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
      token_endpoint:
        'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token',
    }
    const mockedFetch = fetch as jest.MockedFunction<typeof fetch>
    const fetchSpy = mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(IODCEndpoints),
    } as any)

    const res = await service.getOpenIdConnectEndpoints(
      'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
    )

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
      {
        method: 'GET',
      },
    )
    expect(res).toEqual(IODCEndpoints)
  })

  it('should query the introspect endpoint', async () => {
    const mockedFetch = fetch as jest.MockedFunction<typeof fetch>
    const fetchSpy = mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ active: true }),
    } as any)

    const req = {
      headers: {
        authorization: 'Bearer 1234567890',
      },
    } as any
    const res = await service.introspectToken(req)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'client_id=foo&client_secret=bar&token=1234567890',
      },
    )
    expect(res).toBeTruthy()
  })

  it('should return false if the response from Keycloak is not ok (status 500)', async () => {
    const mockedFetch = fetch as jest.MockedFunction<typeof fetch>
    const fetchSpy = mockedFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as any)

    const req = {
      headers: {
        authorization: 'Bearer 1234567890',
      },
    } as any

    try {
      await service.introspectToken(req)
    } catch (e) {
      expect(e.response).toMatchObject({
        statusCode: 500,
        message: 'Token introspection failed with status 500',
      })
    }
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'client_id=foo&client_secret=bar&token=1234567890',
      },
    )
  })

  it('should return false and log an error if the token is not Bearer', async () => {
    const req = {
      headers: {
        authorization: 'Beaver 1234567890',
      },
    } as any

    try {
      await service.introspectToken(req)
    } catch (e) {
      expect(e.response).toMatchObject({
        statusCode: 400,
        message: 'Authorization header is not using Bearer token.',
      })
    }
  })

  it('should return false and log an error if the Authorization is missing from headers', async () => {
    const req = {
      headers: {},
    } as any

    try {
      await service.introspectToken(req)
    } catch (e) {
      expect(e.response).toMatchObject({
        statusCode: 400,
        message: 'Authorization header is missing.',
      })
    }
  })

  it('should return false and log and error if the headers are missing from the request', async () => {
    const req = {} as any
    try {
      await service.introspectToken(req)
    } catch (e) {
      expect(e.response).toMatchObject({
        statusCode: 400,
        message: 'Authorization header is missing.',
      })
    }
  })

  it('should return false if the response does not contain a valid active property', async () => {
    const mockedFetch = fetch as jest.MockedFunction<typeof fetch>
    const fetchSpy = mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ active: 'true' }),
    } as any)

    const req = {
      headers: {
        authorization: 'Bearer 1234567890',
      },
    } as any
    try {
      await service.introspectToken(req)
    } catch (e) {
      expect(e.response).toMatchObject({
        statusCode: 500,
        message: 'Invalid response from token introspection',
      })
    }
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'client_id=foo&client_secret=bar&token=1234567890',
      },
    )
  })
  it('should use the configured proxy settings', async () => {
    process.env.http_proxy = 'http://proxy.example.com'
    process.env.HTTP_PROXY = 'http://proxy.example.com'
    const fetchSpy = jest.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ active: true }),
    } as any)

    const req = {
      headers: {
        authorization: 'Bearer 1234567890',
      },
    } as any
    const serviceWithProxy = new KeyCloakService(
      new KeyCloakConfig(
        'https://bswf.authz.bosch.com',
        'bswf',
        'on',
        'foo',
        'bar',
        'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
        'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
        true,
      ),
    )

    jest
      .spyOn(serviceWithProxy, 'onApplicationBootstrap')
      .mockImplementation(async () => {
        serviceWithProxy['OIDCEndpoints'] = {
          introspection_endpoint:
            'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
          token_endpoint:
            'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token',
        }
      })
    serviceWithProxy.onApplicationBootstrap()

    await serviceWithProxy.introspectToken(req)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'client_id=foo&client_secret=bar&token=1234567890',
        agent: expect.any(Object),
      },
    )
    expect(fetchSpy.mock.calls[0][1].agent).toBeDefined()
    expect(
      (fetchSpy.mock.calls[0][1].agent as any).getProxyForUrl(
        'http://example.com',
      ),
    ).toEqual('http://proxy.example.com')
    process.env.HTTP_PROXY = undefined
  })

  describe('getServiceAccountToken', () => {
    it('should return the expected token', async () => {
      jest
        .spyOn(service, 'getOpenIdConnectEndpoints')
        .mockImplementation(() => {
          return Promise.resolve({
            introspection_endpoint:
              'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
            token_endpoint:
              'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token',
          })
        })

      const mockResponse = {
        json: jest
          .fn()
          .mockResolvedValue({ access_token: 'foo', expires_in: 3600 }),
        status: 200,
      }

      const mockedFetch = fetch as jest.MockedFunction<typeof fetch>
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)
      const token = await service.getServiceAccountToken()
      expect(token.access_token).toEqual('foo')
      expect(token.expires_in).toEqual(3600)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(token.isExpired()).toBeFalsy()
    })

    it('should throw an error if the response is not ok', async () => {
      jest
        .spyOn(service, 'getOpenIdConnectEndpoints')
        .mockImplementation(() => {
          return Promise.resolve({
            introspection_endpoint:
              'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
            token_endpoint:
              'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token',
          })
        })

      const mockResponse = {
        status: 500,
      }

      const mockedFetch = fetch as jest.MockedFunction<typeof fetch>
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)

      try {
        await service.getServiceAccountToken()
      } catch (e) {
        expect(e.response).toMatchObject({
          statusCode: 500,
          message: 'Retrieving service account token failed with status 500',
        })
      }
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if the response does not contain an access_token', async () => {
      jest
        .spyOn(service, 'getOpenIdConnectEndpoints')
        .mockImplementation(() => {
          return Promise.resolve({
            introspection_endpoint:
              'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token/introspect',
            token_endpoint:
              'https://bswf.authz.bosch.com/auth/realms/bswf/protocol/openid-connect/token',
          })
        })

      const mockResponse = {
        json: jest.fn().mockResolvedValue({}),
        status: 200,
      }

      const mockedFetch = fetch as jest.MockedFunction<typeof fetch>
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)

      try {
        await service.getServiceAccountToken()
      } catch (e) {
        expect(e.response).toMatchObject({
          statusCode: 500,
          message: 'Keycloak service account token has invalid format',
        })
      }
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should should return a token that will expire after expiration time', async () => {
      jest.useFakeTimers()
      const mockResponse = {
        json: jest
          .fn()
          .mockResolvedValue({ access_token: 'foo', expires_in: 1 }),
        status: 200,
      }

      const mockedFetch = fetch as jest.MockedFunction<typeof fetch>
      mockedFetch.mockResolvedValue(mockResponse as any)

      const token = await service.getServiceAccountToken()

      expect(token.isExpired()).toBeFalsy()
      jest.advanceTimersByTime(1001)
      expect(token.isExpired()).toBeTruthy()

      jest.useRealTimers()
    })
  })

  describe('getClientIdFromName', () => {
    let mockedFetch: jest.MockedFunction<typeof fetch>
    let getServiceAccountTokenSpy: jest.SpyInstance
    beforeEach(() => {
      jest.resetAllMocks()
      mockedFetch = fetch as jest.MockedFunction<typeof fetch>
      getServiceAccountTokenSpy = jest
        .spyOn(service, 'getServiceAccountToken')
        .mockResolvedValue({
          access_token: 'foo',
          expires_in: 3600,
          isExpired: () => false,
        } as any)
    })
    it('should return the client id', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue([
          {
            id: 'foo',
            clientId: 'bar',
          },
        ]),
        status: 200,
      }
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)

      const clientId = await service.getClientIdFromName('bar')

      expect(clientId).toEqual('foo')
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(getServiceAccountTokenSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if the response is not ok', async () => {
      const mockResponse = {
        status: 500,
      }
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)

      try {
        await service.getClientIdFromName('bar')
      } catch (e) {
        expect(e.response).toMatchObject({
          statusCode: 500,
          message: 'Retrieving client id failed with status 500',
        })
      }
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(getServiceAccountTokenSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw NotFoundException if the client name is not found', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue([]),
        status: 200,
      }
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)

      try {
        await service.getClientIdFromName('bar')
      } catch (e) {
        expect(e.response).toMatchObject({
          statusCode: 500,
          message: 'Client with name bar not found',
        })
      }
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(getServiceAccountTokenSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if the response contains multiple clients', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue([
          {
            id: 'foo',
            clientId: 'bar',
          },
          {
            id: 'foo',
            clientId: 'bar',
          },
        ]),
        status: 200,
      }
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)

      try {
        await service.getClientIdFromName('bar')
      } catch (e) {
        expect(e.response).toMatchObject({
          statusCode: 500,
          message: 'Multiple clients with name bar found',
        })
      }
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(getServiceAccountTokenSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUsersOfClientRole', () => {
    let mockedFetch: jest.MockedFunction<typeof fetch>
    let getServiceAccountTokenSpy: jest.SpyInstance
    let getClientIdFromNameSpy: jest.SpyInstance
    beforeEach(() => {
      jest.resetAllMocks()
      mockedFetch = fetch as jest.MockedFunction<typeof fetch>
      getServiceAccountTokenSpy = jest
        .spyOn(service, 'getServiceAccountToken')
        .mockResolvedValue({
          access_token: 'foo',
          expires_in: 3600,
          isExpired: () => false,
        } as any)
      getClientIdFromNameSpy = jest
        .spyOn(service, 'getClientIdFromName')
        .mockResolvedValue('foo')
    })
    it('should return the roles', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue([
          {
            id: 'user1',
            username: 'foo',
            firstName: 'peter',
            lastName: 'griffin',
            email: 'peter@familyguy.com',
          },
          {
            id: 'user2',
            username: 'bar',
            firstName: 'lois',
            lastName: 'griffin',
            email: 'lois@familyguy.com',
          },
        ]),
        status: 200,
      }
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)

      const roles = await service.getUsersOfClientRole('bar', 'foo-id')

      expect(roles).toEqual([
        {
          id: 'user1',
          username: 'foo',
          firstName: 'peter',
          lastName: 'griffin',
          email: 'peter@familyguy.com',
          displayName: 'peter griffin',
        },
        {
          id: 'user2',
          username: 'bar',
          firstName: 'lois',
          lastName: 'griffin',
          email: 'lois@familyguy.com',
          displayName: 'lois griffin',
        },
      ])
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(getServiceAccountTokenSpy).toHaveBeenCalledTimes(1)
      expect(getClientIdFromNameSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if the response is not ok', async () => {
      const mockResponse = {
        status: 500,
      }
      const fetchSpy = mockedFetch.mockResolvedValue(mockResponse as any)

      try {
        await service.getUsersOfClientRole('bar', 'foo-id')
      } catch (e) {
        expect(e.response).toMatchObject({
          statusCode: 500,
          message: 'Retrieving users of client role failed with status 500',
        })
      }
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(getServiceAccountTokenSpy).toHaveBeenCalledTimes(1)
      expect(getClientIdFromNameSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUsersOfNamespace', () => {
    let getUsersOfClientRoleSpy: jest.SpyInstance
    beforeEach(() => {
      jest.resetAllMocks()
      getUsersOfClientRoleSpy = jest
        .spyOn(service, 'getUsersOfClientRole')
        .mockResolvedValue([
          {
            id: 'user1',
            username: 'foo',
            firstName: 'peter',
            lastName: 'griffin',
            displayName: 'Peter Griffin',
            email: 'peter@familyguy.com',
          },
          {
            id: 'user2',
            username: 'bar',
            firstName: 'lois',
            lastName: 'griffin',
            displayName: 'Lois Griffin',
            email: 'lois@familyguy.com',
          },
        ])
    })

    it('should return the roles', async () => {
      const roles = await service.getUsersOfNamespace(1)

      expect(roles).toEqual([
        {
          username: 'foo',
          displayName: 'Peter Griffin',
          email: 'peter@familyguy.com',
          kc_id: 'user1',
          firstName: 'peter',
          lastName: 'griffin',
        },
        {
          username: 'bar',
          displayName: 'Lois Griffin',
          email: 'lois@familyguy.com',
          kc_id: 'user2',
          firstName: 'lois',
          lastName: 'griffin',
        },
      ])
      expect(getUsersOfClientRoleSpy).toHaveBeenCalledTimes(1)
      expect(getUsersOfClientRoleSpy).toHaveBeenCalledWith(
        'NAMESPACE_1',
        'ACCESS',
      )
    })
  })

  describe('extractUserOfClientRole', () => {
    let user = {} as any

    beforeEach(() => {
      user = service.extractUser({
        id: 'f6ce7976-dd70-4afc-b58f-85bcd37ffae6',
        username: 'peter@familyguy.com',
        firstName: 'Peter',
        lastName: 'Griffin',
        email: 'peter@familyguy.com',
      })
    })

    it('should return the user', () => {
      const extracted = service.extractUser(user)

      expect(extracted).toEqual({
        id: 'f6ce7976-dd70-4afc-b58f-85bcd37ffae6',
        username: 'peter@familyguy.com',
        firstName: 'Peter',
        lastName: 'Griffin',
        email: 'peter@familyguy.com',
        displayName: 'Peter Griffin',
      })
    })

    it('should return the user with displayName set to firstName and lastName', () => {
      const extracted = service.extractUser(user)

      expect(extracted.displayName).toEqual('Peter Griffin')
    })

    it('should return the user with displayName set to display_name if the attribute is available', () => {
      user.attributes = {
        display_name: ['Peter Griffin (GROW/PAT1)'],
      }

      const extracted = service.extractUser(user)
      expect(extracted.displayName).toEqual('Peter Griffin (GROW/PAT1)')
    })
  })

  describe('toKeycloakUserOfRole', () => {
    it('should return the user', () => {
      const user = service.extractUser({
        id: 'f6ce7976-dd70-4afc-b58f-85bcd37ffae6',
        username: 'peter@familyguy.com',
        firstName: 'Peter',
        lastName: 'Griffin',
        email: 'peter@familyguy.com',
      })

      const extracted = service.toKeycloakUserOfRole(user)

      expect(extracted).toEqual({
        kc_id: 'f6ce7976-dd70-4afc-b58f-85bcd37ffae6',
        username: 'peter@familyguy.com',
        email: 'peter@familyguy.com',
        displayName: 'Peter Griffin',
        firstName: 'Peter',
        lastName: 'Griffin',
      })
    })
  })
})

describe('KeyCloak disabled', () => {
  let service: KeyCloakService

  beforeEach(async () => {
    jest.resetAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        KeyCloakService,
        {
          provide: KeyCloakConfig,
          useFactory: () =>
            new KeyCloakConfig(
              'https://bswf.authz.bosch.com',
              'bswf',
              'off',
              'foo',
              'bar',
              'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
              'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
            ),
        },
      ],
    }).compile()

    service = module.get<KeyCloakService>(KeyCloakService)
  })

  it('should be defined properly', () => {
    expect(service).toBeDefined()
  })

  it('should return false if keycloak is disabled', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ username: 'TestUser' }),
    } as any)

    const req = {
      headers: {
        authorization: 'Bearer 1234567890',
      },
    } as any
    const res = await service.introspectToken(req)
    expect(fetchSpy).toHaveBeenCalledTimes(0)
    expect(res).toBeFalsy()
  })
})

describe('KeyCloakConfig', () => {
  it('should be defined properly', () => {
    const cfg = new KeyCloakConfig(
      'https://bswf.authz.bosch.com',
      'bswf',
      'on',
      'foo',
      'bar',
      'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
      'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
    )
    expect(cfg).toBeDefined()
  })

  it('should throw an error if enabled is neither "on" nor "off"', () => {
    expect(
      () =>
        new KeyCloakConfig(
          'https://bswf.authz.bosch.com',
          'bswf',
          'foo',
          'foo',
          'bar',
          'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
          'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
        ),
    ).toThrow()
  })

  it('should throw an error if enabled is "on" but server is not set', () => {
    expect(
      () =>
        new KeyCloakConfig(
          '',
          'bswf',
          'on',
          'foo',
          'bar',
          'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
          'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
        ),
    ).toThrow()
  })

  it('should throw an error if enabled is "on" but realm is not set', () => {
    expect(
      () =>
        new KeyCloakConfig(
          'https://bswf.authz.bosch.com',
          '',
          'on',
          'foo',
          'bar',
          'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
          'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
        ),
    ).toThrow()
  })

  it('should throw an error if enabled is "on" but client id is not set', () => {
    expect(
      () =>
        new KeyCloakConfig(
          'https://bswf.authz.bosch.com',
          'bswf',
          'on',
          '',
          'bar',
          'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
          'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
        ),
    ).toThrow()
  })

  it('should throw an error if enabled is "on" but client secret is not set', () => {
    expect(
      () =>
        new KeyCloakConfig(
          'https://bswf.authz.bosch.com',
          'bswf',
          'on',
          'foo',
          '',
          'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
          'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
        ),
    ).toThrow()
  })

  it('should throw an error if enabled is "on" but keycloak admin URL is not set', () => {
    expect(
      () =>
        new KeyCloakConfig(
          'https://bswf.authz.bosch.com',
          'bswf',
          'on',
          'foo',
          'bar',
          '',
          'https://bswf.authz.bosch.com/auth/realms/bswf/.well-known/openid-configuration',
        ),
    ).toThrow()
  })

  it('should throw an error if enabled is "on" but keycloak well-known config URL is not set', () => {
    expect(
      () =>
        new KeyCloakConfig(
          'https://bswf.authz.bosch.com',
          'bswf',
          'on',
          'foo',
          'bar',
          'https://bswf.authz.bosch.com/auth/admin/realms/bswf',
          '',
        ),
    ).toThrow()
  })
})
