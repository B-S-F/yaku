import { Test, TestingModule } from '@nestjs/testing'
import { KeyCloakStrategy } from './keycloak.strategy'
import { KeyCloakService } from './keycloak.service'
import { UnauthorizedException } from '@nestjs/common'

describe('Keycloak Guard', () => {
  let guard: KeyCloakStrategy
  let keyCloakService: KeyCloakService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyCloakStrategy,
        {
          provide: KeyCloakService,
          useValue: {
            introspectToken: jest.fn(),
            getKeyCloakUser: jest.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<KeyCloakStrategy>(KeyCloakStrategy)
    keyCloakService = module.get<KeyCloakService>(KeyCloakService)
  })

  it('should be defined properly', () => {
    expect(guard).toBeDefined()
  })

  it('should validate a payload properly', async () => {
    const introspectSpy = jest
      .spyOn(keyCloakService, 'introspectToken')
      .mockResolvedValue(true)
    const getKeyCloakUserSpy = jest
      .spyOn(keyCloakService, 'getKeyCloakUser')
      .mockResolvedValue({
        username: 'TestUser',
        roles: ['testRole'],
        namespaces: [],
      } as any)
    const req = {
      headers: {
        authorization: 'Bearer 1234567890',
      },
    } as any
    const user = await guard.validate(req)

    expect(user).toBeDefined()
    expect(user.username).toBe('TestUser')
    expect(user.roles).toContain('testRole')
    expect(user.namespaces).toEqual([])
    expect(introspectSpy).toBeCalledTimes(1)
    expect(getKeyCloakUserSpy).toBeCalledTimes(1)
  })

  it('should throw an UnauthorizedException, if payload is not valid', async () => {
    const introspectSpy = jest
      .spyOn(keyCloakService, 'introspectToken')
      .mockResolvedValue(false)

    const req = {
      headers: {
        authorization: 'Bearer 1234567890',
      },
    } as any
    await expect(guard.validate(req)).rejects.toThrow(UnauthorizedException)
    expect(introspectSpy).toBeCalledTimes(1)
  })
})
