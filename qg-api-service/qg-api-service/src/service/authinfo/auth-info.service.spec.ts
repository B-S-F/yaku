import { Test, TestingModule } from '@nestjs/testing'
import { AuthInfoService, AuthInfoServiceConfig } from './auth-info.service'

describe('AuthInfoService', () => {
  let service: AuthInfoService

  const TEST_WELL_KNOWN_URL =
    'http://localhost:30115/auth/realms/bswf/.well-known/openid-configuration'

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthInfoService,
        {
          provide: AuthInfoServiceConfig,
          useFactory: () => {
            return new AuthInfoServiceConfig(TEST_WELL_KNOWN_URL)
          },
        },
      ],
    }).compile()

    service = module.get<AuthInfoService>(AuthInfoService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return the correct values', () => {
    const data = service.getAuthInfo()
    expect(data.wellKnownConfigUrl).toBe(TEST_WELL_KNOWN_URL)
  })
})
