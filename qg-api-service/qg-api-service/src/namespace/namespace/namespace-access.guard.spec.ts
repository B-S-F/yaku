import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { testingNamespaceId } from '@B-S-F/api-commons-lib'
import { NamespaceAccessGuard } from './namespace-access.guard'
import {
  KEYCLOAK_ADMIN_ROLE,
  NAMESPACE_ACCESS_ROLE,
} from '../../guards/roles.guard'
import {
  KeyCloakNamespace,
  KeyCloakUser,
} from '@B-S-F/api-keycloak-auth-lib'

describe('NamespaceAccessGuard', () => {
  let testee: NamespaceAccessGuard
  let module: TestingModule

  function getRequest(
    namespaceId: number,
    user: any,
    requiresAdmin = false
  ): any {
    const request: any = {
      params: { namespaceId },
      user,
    }
    if (requiresAdmin) {
      request.requiresRoles = ['admin']
    }
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }
  }

  const testKeyCloakNamespace: KeyCloakNamespace = {
    id: 1,
    name: 'NS1',
    roles: [NAMESPACE_ACCESS_ROLE],
    users: [],
    type: 'type',
  }

  const standardUser: KeyCloakUser = {
    id: 1,
    username: 'TestUser',
    email: 'testuser@example.com',
    displayName: 'Test User',
    roles: [],
    kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
    kc_iss: '1234567890',
    kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
    interactive_login: true,
    namespaces: [testKeyCloakNamespace],
  }

  const adminUser: KeyCloakUser = {
    id: 2,
    username: 'TestUser',
    email: 'testuser@example.com',
    displayName: 'Test User',
    roles: [KEYCLOAK_ADMIN_ROLE],
    kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
    kc_iss: '1234567890',
    kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
    interactive_login: true,
    namespaces: [testKeyCloakNamespace],
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [NamespaceAccessGuard],
    }).compile()

    testee = module.get<NamespaceAccessGuard>(NamespaceAccessGuard)
  })

  it('should be defined', () => {
    expect(testee).toBeDefined()
  })

  it('should activate if a proper request comes in', async () => {
    const request = getRequest(testingNamespaceId, standardUser)

    const result = await testee.canActivate(request)
    expect(result).toBeTruthy()
  })

  it('should not activate, if the user is unknown to namespace', async () => {
    const user = {
      id: 1,
      username: 'TestUser',
      email: 'testuser@example.com',
      displayName: 'Test User',
      roles: [],
      kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
      kc_iss: '1234567890',
      kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
      interactive_login: true,
      namespaces: [
        {
          id: 2,
          name: 'NS2',
          roles: [NAMESPACE_ACCESS_ROLE],
          users: [],
          type: 'type',
        },
      ],
    }
    const request = getRequest(testingNamespaceId, user)

    const result = await testee.canActivate(request)
    expect(result).toBeFalsy()
  })

  it('should activate, if the request endpoint requires admin access, for standard user', async () => {
    // Counter intuitive test case, but it is not task of the guard to determine that a user is an admin
    // This is already solved by the roles guard and this case should in reality never happen because the roles guide already declined access
    // Just for documentation purposes
    const request = getRequest(testingNamespaceId, standardUser, true)

    const result = await testee.canActivate(request)
    expect(result).toBeTruthy()
  })

  it('should activate, if the request endpoint requires admin access, for admin user', async () => {
    const request = getRequest(testingNamespaceId, adminUser, true)

    const result = await testee.canActivate(request)
    expect(result).toBeTruthy()
  })

  it('should activate, if the request endpoint is not below a namespace', async () => {
    const request = getRequest(undefined, standardUser)

    const result = await testee.canActivate(request)
    expect(result).toBeTruthy()
  })

  it('should not activate if no user is provided for an endpoint which is below a namespace', async () => {
    const request = getRequest(testingNamespaceId, undefined)

    const result = await testee.canActivate(request)
    expect(result).toBeFalsy()
  })

  it('should throw a BadRequestException, if the namespace id is not an integer', async () => {
    const request = getRequest(3.5, undefined)

    await expect(testee.canActivate(request)).rejects.toThrow(
      BadRequestException
    )
  })
})
