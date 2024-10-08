/* eslint @typescript-eslint/no-var-requires: "off" */

import { Test, TestingModule } from '@nestjs/testing'
import { WorkflowImageConfig } from '../../namespace/workflow/workflow-argo.service'
import { ServiceConfig } from '../../service-config'
import { VersionService } from './version.service'

describe('VersionService', () => {
  let service: VersionService

  const serviceVersion = '2.0.0'
  const imageVersion = '3.0.0'

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        {
          provide: ServiceConfig,
          useFactory: () => {
            return new ServiceConfig(3000, '', serviceVersion, imageVersion)
          },
        },
        {
          provide: WorkflowImageConfig,
          useFactory: () =>
            new WorkflowImageConfig(
              'image',
              { v1: '1.0.0', v2: '1.2.0' },
              'always'
            ),
        },
      ],
    }).compile()

    service = module.get<VersionService>(VersionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return proper values', () => {
    const info = service.getVersion()
    expect(info.imageVersion).toBe(imageVersion)
    expect(info.qgcliVersions).toEqual({ v0: '', v1: '1.0.0', v2: '1.2.0' })
    expect(info.serviceVersion).toBe(serviceVersion)
  })
})
