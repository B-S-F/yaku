import { Test, TestingModule } from '@nestjs/testing'
import { KeyCloakModule } from './keycloak.module'
import { KeyCloakConfig, KeyCloakService } from './keycloak.service'

describe('KeyCloakModule', () => {
  let module: TestingModule
  let keyCloakService: KeyCloakService

  // Store original environment variables
  const originalEnv = { ...process.env }

  beforeEach(async () => {
    // Set default values for environment variables
    process.env.KEYCLOAK_SERVER = 'your_server'
    process.env.KEYCLOAK_REALM = 'your_realm'
    process.env.KEYCLOAK_AUTH = 'on'
    process.env.KEYCLOAK_CLIENT_ID = 'your_client_id'
    process.env.KEYCLOAK_CLIENT_SECRET = 'your_client_secret'
    process.env.KEYCLOAK_ADMIN_URL = 'your_admin_url'
    process.env.KEYCLOAK_WELL_KNOWN_CONFIG = 'your_well_known_config'

    module = await Test.createTestingModule({
      imports: [KeyCloakModule],
    }).compile()

    keyCloakService = module.get<KeyCloakService>(KeyCloakService)
  })

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv }
  })

  it('should be defined', () => {
    expect(keyCloakService).toBeDefined()
  })

  it('should use configuration from environment variables', () => {
    const config = module.get<KeyCloakConfig>(KeyCloakConfig)

    expect(config.server).toBe('your_server')
    expect(config.realm).toBe('your_realm')
    expect(config.enabled).toBe('on')
    expect(config.clientId).toBe('your_client_id')
    expect(config.clientSecret).toBe('your_client_secret')
  })
})
