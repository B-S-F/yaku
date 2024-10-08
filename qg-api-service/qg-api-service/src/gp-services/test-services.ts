import { testingNamespaceId } from '@B-S-F/api-commons-lib'
import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'

export const testUser: KeyCloakUser = {
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

export const baseUrl = `/api/v1/namespaces/${testingNamespaceId}`
