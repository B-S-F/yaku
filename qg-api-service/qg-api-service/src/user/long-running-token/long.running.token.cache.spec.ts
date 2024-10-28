import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import { AuthCache, AuthCacheConfig } from './long.running.token.cache'

describe('AuthCache', () => {
  it('Expiraton works', () => {
    jest.useFakeTimers()

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

    const cache = new AuthCache(new AuthCacheConfig())

    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUser)
    const insertionTime = Date.now()

    let cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBe(kcUser)

    // look up shortly before expiration
    jest.setSystemTime(
      insertionTime + AuthCacheConfig.DEFAULT_VALIDITY_PERIOD_IN_MILLIS - 1
    )

    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBe(kcUser)

    // look up shortly after expiration
    jest.setSystemTime(
      insertionTime + AuthCacheConfig.DEFAULT_VALIDITY_PERIOD_IN_MILLIS + 1
    )

    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')

    expect(cachedUser).toBeUndefined()
  })

  it('Adding and dropping are consistent', () => {
    jest.useFakeTimers()

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

    const cache = new AuthCache(new AuthCacheConfig())

    // Test when user is not added yet
    let cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBeUndefined()

    // Add user to cache
    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUser)

    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBe(kcUser)

    // Test when user is dropped
    cache.drop('04f48c06-e016-42fa-8b53-98a58a976e12')
    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBeUndefined()

    // Test drop all
    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUser)
    cache.put('ffffffff-ffff-ffff-ffff-ffffffffffff', kcUser)

    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBe(kcUser)

    cachedUser = cache.get('ffffffff-ffff-ffff-ffff-ffffffffffff')
    expect(cachedUser).toBe(kcUser)

    cache.dropAll()
    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBeUndefined()

    cachedUser = cache.get('ffffffff-ffff-ffff-ffff-ffffffffffff')
    expect(cachedUser).toBeUndefined()
  })

  it('Overriding does not work', () => {
    jest.useFakeTimers()

    const kcUserOld: KeyCloakUser = {
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

    const kcUserNew: KeyCloakUser = {
      id: 1,
      username: 'TestUser',
      email: 'testuser@example.com',
      displayName: 'Berta User',
      roles: [],
      kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
      kc_iss: '1234567890',
      kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
      interactive_login: true,
      namespaces: [],
    }

    const cache = new AuthCache(new AuthCacheConfig())
    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUserOld)
    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUserNew)

    const cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBe(kcUserOld)
  })

  it('Drop by keycloak id works', () => {
    jest.useFakeTimers()

    const kcUser: KeyCloakUser = {
      id: 1,
      username: 'TestUser',
      email: 'testuser@example.com',
      displayName: 'Test User',
      roles: [],
      kc_id: '1234567890 kc_sub',
      kc_iss: '1234567890',
      kc_sub: 'kc_sub',
      interactive_login: true,
      namespaces: [],
    }

    const cache = new AuthCache(new AuthCacheConfig())

    // Test when user is not added yet
    let cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBeUndefined()

    // Add user to cache
    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUser)

    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBe(kcUser)

    // Test when user is dropped by keycloak user id
    cache.dropByKeyCloakId('kc_sub')
    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBeUndefined()
  })

  it('Refresh failsafe works', () => {
    jest.useFakeTimers()

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

    const cache = new AuthCache(new AuthCacheConfig())
    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUser)
    const insertionTime = Date.now()

    let cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBe(kcUser)

    // put again shortly before expiration
    jest.setSystemTime(
      insertionTime + AuthCacheConfig.DEFAULT_VALIDITY_PERIOD_IN_MILLIS - 10
    )

    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUser)

    jest.setSystemTime(
      insertionTime + AuthCacheConfig.DEFAULT_VALIDITY_PERIOD_IN_MILLIS + 1
    )

    // we expect that the expiry date was not changed and the entry has expired
    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBeUndefined

    // re-add
    cache.put('04f48c06-e016-42fa-8b53-98a58a976e12', kcUser)
    cachedUser = cache.get('04f48c06-e016-42fa-8b53-98a58a976e12')
    expect(cachedUser).toBe(kcUser)
  })
})
