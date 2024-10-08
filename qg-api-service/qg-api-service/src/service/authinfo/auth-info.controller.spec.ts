import { Test, TestingModule } from '@nestjs/testing'
import { AuthInfoController } from './auth-info.controller'
import { AuthInfoDto, AuthInfoService } from './auth-info.service'

describe('AuthInfoController', () => {
  let controller: AuthInfoController

  const testdata: AuthInfoDto = {
    wellKnownConfigUrl:
      'http://localhost:30115/auth/realms/bswf/.well-known/openid-configuration',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthInfoController],
      providers: [
        {
          provide: AuthInfoService,
          useValue: {
            getAuthInfo: jest.fn().mockImplementation(() => testdata),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthInfoController>(AuthInfoController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should pass through data as expected', () => {
    const data = controller.getAuthInfo()
    expect(data.wellKnownConfigUrl).toBe(testdata.wellKnownConfigUrl)
  })
})
