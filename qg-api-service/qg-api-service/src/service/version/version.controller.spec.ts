import { Test, TestingModule } from '@nestjs/testing'
import { VersionController } from './version.controller'
import { VersionInformation, VersionService } from './version.service'

describe('VersionController', () => {
  let controller: VersionController

  const testdata: VersionInformation = {
    serviceVersion: '1.0.0',
    imageVersion: '2.0.0',
    qgcliVersions: { v1: '1.0.0', v2: '2.0.0' },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionController],
      providers: [
        {
          provide: VersionService,
          useValue: {
            getVersion: jest.fn().mockImplementation(() => testdata),
          },
        },
      ],
    }).compile()

    controller = module.get<VersionController>(VersionController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should pass through data as expected', () => {
    const data = controller.getVersionInfo()
    expect(data.imageVersion).toBe(testdata.imageVersion)
    expect(data.serviceVersion).toBe(testdata.serviceVersion)
    expect(data.qgcliVersions).toBe(testdata.qgcliVersions)
  })
})
