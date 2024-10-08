import {
  KeyCloakNamespace,
  KeyCloakUser,
  KeyCloakUserOfRole,
  MissingUserError,
} from '@B-S-F/api-keycloak-auth-lib'
import { Injectable } from '@nestjs/common'
import { KEYCLOAK_ADMIN_ROLE } from '../../src/guards/roles.guard'

export const kc_user_sub = '4c0bc4f6-4766-45f3-90e6-6b9a6fd23cbb'

@Injectable()
export class KeyCloakServiceMock {
  userTokenMap: Map<string, KeyCloakUser> = new Map()
  mockusers: KeyCloakUser[] = [
    {
      id: 0,
      kc_id: 'mock_kc_id 4c0bc4f6-4766-45f3-90e6-6b9a6fd23cbb',
      kc_iss: 'mock_kc_id',
      kc_sub: '4c0bc4f6-4766-45f3-90e6-6b9a6fd23cbb',
      username: 'user0@bosch.com',
      displayName: 'Q.Uestion Asker',
      email: 'user0@bosch.com',
      roles: ['ACCESS'],
      interactive_login: true,
      namespaces: [],
    },
    {
      id: 1,
      kc_id: 'mock_kc_id b95b1ccc-64ac-42b0-acfc-ddd866d09659',
      kc_iss: 'mock_kc_id',
      kc_sub: 'b95b1ccc-64ac-42b0-acfc-ddd866d09659',
      username: 'user1@bosch.com',
      displayName: 'D.Iscution Participator',
      email: 'user1@bosch.com',
      roles: ['ACCESS'],
      interactive_login: true,
      namespaces: [],
    },
    {
      id: 2,
      kc_id: 'mock_kc_id 0d61334b-2de8-4700-a0ae-f254741a9a8b',
      kc_iss: 'mock_kc_id',
      kc_sub: '0d61334b-2de8-4700-a0ae-f254741a9a8b',
      username: 'user2@bosch.com',
      displayName: 'S.Ubscri Bear',
      email: 'user2@bosch.com',
      roles: ['ACCESS'],
      interactive_login: true,
      namespaces: [],
    },
    {
      id: 3,
      kc_id: 'mock_kc_id 602bd38c-81c3-4404-b98b-14f5da08eb3b',
      kc_iss: 'mock_kc_id',
      kc_sub: '602bd38c-81c3-4404-b98b-14f5da08eb3b',
      username: 'user3@bosch.com',
      displayName: 'M. Entioned',
      email: 'user3@bosch.com',
      roles: ['ACCESS'],
      interactive_login: true,
      namespaces: [],
    },
    {
      id: 4,
      kc_id: 'mock_kc_id 588e085b-2208-49ea-9aef-b050b29d835f',
      kc_iss: 'mock_kc_id',
      kc_sub: '588e085b-2208-49ea-9aef-b050b29d835f',
      username: 'user4@bosch.com',
      displayName: 'Comm EntAuThor',
      email: 'user4@bosch.com',
      roles: ['ACCESS'],
      interactive_login: true,
      namespaces: [],
    },
    {
      id: 5,
      kc_id: 'mock_kc_id 38d9e104-1c43-4717-9a15-a00ae71ec0d5',
      kc_iss: 'mock_kc_id',
      kc_sub: '38d9e104-1c43-4717-9a15-a00ae71ec0d5',
      username: 'user5@bosch.com',
      displayName: 'Comm EntAuThor',
      email: 'user5@bosch.com',
      roles: ['ACCESS'],
      interactive_login: true,
      namespaces: [],
    },
    {
      id: 6,
      kc_id: 'mock_kc_id f2fd60c9-01f3-4a03-92be-4f50b0928ab2',
      kc_iss: 'mock_kc_id',
      kc_sub: 'f2fd60c9-01f3-4a03-92be-4f50b0928ab2',
      username: 'user6@bosch.com',
      displayName: 'Ad. Minn',
      email: 'user6@bosch.com',
      roles: ['ADMIN'],
      interactive_login: true,
      namespaces: [],
    },
  ]
  defaultUser: KeyCloakUser = this.mockusers[0]
  // eslint-disable-next-line no-unused-vars
  async getKeyCloakUser(token: string): Promise<KeyCloakUser> {
    return this.userTokenMap.get(token)
  }

  // eslint-disable-next-line no-unused-vars
  async introspectToken(_req: Request): Promise<boolean> {
    return true
  }

  async getUsersOfNamespace(
    // eslint-disable-next-line no-unused-vars
    _namespaceId: number
  ): Promise<KeyCloakUserOfRole[]> {
    // If _namespaceId is among the user's namespace ids,
    // map that user to a KeyCloakUserOfRole

    const usersInNamespace: KeyCloakUserOfRole[] = this.mockusers
      .filter((kc_user: KeyCloakUser) => {
        const namespaceIds = kc_user.namespaces.map(
          (namespace: KeyCloakNamespace) => namespace.id
        )
        return namespaceIds.includes(_namespaceId)
      })
      .map((user: KeyCloakUser) => {
        return {
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          // The term of 'kc_id' is a bit confusing. Should we change to kc_sub?
          kc_id: user.kc_sub,
          firstName: user.displayName.split(' ')[0],
          lastName: user.displayName.split(' ')[1],
        }
      })

    return usersInNamespace
  }

  // eslint-disable-next-line no-unused-vars
  async getUserById(id: string): Promise<KeyCloakUserOfRole> {
    const foundUser: KeyCloakUser = this.mockusers.find(
      (mockuser) => mockuser.kc_sub === id
    )
    if (!foundUser) {
      throw new MissingUserError(`User with id ${id} not found`)
    }

    return {
      username: foundUser.username,
      displayName: foundUser.displayName,
      email: foundUser.email,
      kc_id: foundUser.kc_sub,
      firstName: foundUser.displayName.split(' ')[0],
      lastName: foundUser.displayName.split(' ')[1],
    }
  }

  // eslint-disable-next-line no-unused-vars
  async getUserByUsername(_username: string): Promise<KeyCloakUserOfRole> {
    const foundUser: KeyCloakUser = this.mockusers.find(
      (mockuser) => String(mockuser.username) === _username
    )

    if (!foundUser) {
      throw new MissingUserError(`User with username ${_username} not found`)
    }

    return {
      username: foundUser.username,
      displayName: foundUser.displayName,
      email: foundUser.email,
      kc_id: foundUser.kc_sub,
      firstName: foundUser.displayName.split(' ')[0],
      lastName: foundUser.displayName.split(' ')[1],
    }
  }

  async getKeyCloakUserFromCliClient(
    userId: string,
    additionalScopes: string[]
  ): Promise<KeyCloakUser> {
    const foundUser: KeyCloakUser = this.mockusers.find(
      (mockuser) => String(mockuser.id) === userId
    )

    return Promise.resolve(foundUser)
  }

  async setUsername(id: string, username: string) {
    ;(await this.getKeyCloakUserFromCliClient(id, [])).username = username
  }

  async setDisplayName(id: string, displayName: string) {
    ;(await this.getKeyCloakUserFromCliClient(id, [])).displayName = displayName
  }

  async revokeAccessToMockuserForAllNamespaces(id: string) {
    ;(await this.getKeyCloakUserFromCliClient(id, [])).namespaces = []
  }

  async revokeAccessToAllMockusersForAllNamespaces() {
    for (const user of this.mockusers) {
      await this.revokeAccessToMockuserForAllNamespaces(String(user.id))
    }
  }

  // eslint-disable-next-line no-unused-vars
  grantAccessToMockuserForNamespace(
    user_kc_sub: string,
    namespaceId: number,
    roles?: string[]
  ) {
    const foundUser: KeyCloakUser = this.mockusers.find(
      (mockuser) => mockuser.kc_sub === user_kc_sub
    )

    const userNamespaces = foundUser.namespaces.find(
      (namespace) => namespace.id === namespaceId
    )

    const kcUserNamespace = {
      id: namespaceId,
      name: `NAMESPACE_${namespaceId}`,
      roles: roles ?? ['ACCESS'],
      users: [...(userNamespaces?.users || []), foundUser.username],
      type: 'KeyCloakUser',
    } as KeyCloakNamespace

    foundUser.namespaces.push(kcUserNamespace)
  }

  grantAdmin(id: number) {
    const foundUser: KeyCloakUser = this.mockusers.find(
      (mockuser) => mockuser.id === id
    )

    foundUser.roles = [KEYCLOAK_ADMIN_ROLE]
  }

  revokeAdmin(id: number) {
    const foundUser: KeyCloakUser = this.mockusers.find(
      (mockuser) => mockuser.id === id
    )

    foundUser.roles = []
  }

  getMockUsers(): KeyCloakUser[] {
    return this.mockusers
  }
  getTokenMap(): Map<string, KeyCloakUser> {
    return this.userTokenMap
  }

  mapTokenToMockUser(token: string, user: KeyCloakUser) {
    this.userTokenMap.set(token, user)
  }
}
