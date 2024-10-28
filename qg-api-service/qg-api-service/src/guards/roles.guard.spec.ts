import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import { Controller } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { ROLES_KEY, KEYCLOAK_ADMIN_ROLE, RolesGuard } from './roles.guard'

describe('RolesGuard', () => {
  let guard: RolesGuard
  let module: TestingModule

  let reflector: Reflector

  const kcAdminUser: KeyCloakUser = {
    id: 1,
    username: 'TestUser',
    email: 'testuser@example.com',
    displayName: 'Test User',
    roles: [KEYCLOAK_ADMIN_ROLE],
    kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
    kc_iss: '1234567890',
    kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
    interactive_login: true,
    namespaces: [],
  }

  const kcUser: KeyCloakUser = {
    id: 1,
    username: 'TestUser',
    email: 'testuser@example.com',
    displayName: 'Test User',
    roles: [],
    kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
    kc_iss: '1234567890',
    kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
    interactive_login: true,
    namespaces: [],
  }

  let userRequested = false
  let request: any

  const handler = { handler: true }
  const controllerClass = Controller.prototype
  const context: any = {
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({
      getRequest: () => {
        userRequested = true
        return request
      },
    }),
  }

  beforeEach(async () => {
    userRequested = false

    module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<RolesGuard>(RolesGuard)
    reflector = module.get<Reflector>(Reflector)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  it('should return true, if no roles are required (empty list return)', () => {
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([])

    const result = guard.canActivate(context)

    expect(result).toBeTruthy()
    expect(reflectorSpy).toBeCalledWith(ROLES_KEY, [handler, controllerClass])
    expect(userRequested).toBeFalsy()
  })

  it('should return true, if no roles are required (null return)', () => {
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(null)

    const result = guard.canActivate(context)

    expect(result).toBeTruthy()
    expect(reflectorSpy).toBeCalledWith(ROLES_KEY, [handler, controllerClass])
    expect(userRequested).toBeFalsy()
  })

  it('should return true, if a role is required that is found in the user object', () => {
    request = { user: kcAdminUser }
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin'])

    const result = guard.canActivate(context)

    expect(result).toBeTruthy()
    expect(request.requiresRoles).toContain('admin')
    expect(reflectorSpy).toBeCalledWith(ROLES_KEY, [handler, controllerClass])
    expect(userRequested).toBeTruthy()
  })

  it('should return true, if multiple roles are required and at least one is found in the user object', () => {
    request = { user: kcAdminUser }
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin', 'moderator'])

    const result = guard.canActivate(context)

    expect(result).toBeTruthy()
    expect(request.requiresRoles).toEqual(['admin', 'moderator'])
    expect(reflectorSpy).toBeCalledWith(ROLES_KEY, [handler, controllerClass])
    expect(userRequested).toBeTruthy()
  })

  it('should return false, if a role is required that is not found in the user object', () => {
    request = { user: kcUser }
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin'])

    const result = guard.canActivate(context)

    expect(result).toBeFalsy()
    expect(request.requiresRoles).toBeUndefined()
    expect(reflectorSpy).toBeCalledWith(ROLES_KEY, [handler, controllerClass])
    expect(userRequested).toBeTruthy()
  })

  it('should return false, if none of the required roles matches the users roles', () => {
    request = { user: kcUser }
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin', 'manager'])

    const result = guard.canActivate(context)

    expect(result).toBeFalsy()
    expect(request.requiresRoles).toBeUndefined()
    expect(reflectorSpy).toBeCalledWith(ROLES_KEY, [handler, controllerClass])
    expect(userRequested).toBeTruthy()
  })

  it('should return false, if no user is assigned, but roles are required', () => {
    request = { user: undefined }
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin'])

    const result = guard.canActivate(context)

    expect(result).toBeFalsy()
    expect(reflectorSpy).toBeCalledWith(ROLES_KEY, [handler, controllerClass])
    expect(userRequested).toBeTruthy()
  })
})
