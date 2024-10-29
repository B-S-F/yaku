import { Test, TestingModule } from '@nestjs/testing'
import { OSSSourceController } from './oss-compliance.controller'
import { OSSComplianceService } from './oss-compliance.service'
import { streamToString } from './stream-utils'
import { createMockResponse, namespaceUrl } from './test-services'
import { BadRequestException, NotFoundException } from '@nestjs/common'

describe('OSS Compliance controller stack', () => {
  let controller: OSSSourceController
  let service: OSSComplianceService

  const sbomContent = 'Great SBOM content'
  const sbomFilename = 'SBOM.json'
  const componentMap = {
    comp1: 'some path',
    comp2: 'some other path',
  }
  const sourceFileContent = 'Great source content'
  const url = `${namespaceUrl}/oss/sbom`

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OSSSourceController],
      providers: [
        {
          provide: OSSComplianceService,
          useValue: {
            getSBOM: jest.fn().mockResolvedValue(Buffer.from(sbomContent)),
            getSBOMFilename: jest.fn().mockReturnValue(sbomFilename),
            getComponentsWithSources: jest
              .fn()
              .mockReturnValue(Object.keys(componentMap)),
            getSourceForComponent: jest.fn().mockResolvedValue({
              filename: componentMap.comp1,
              content: Buffer.from(sourceFileContent),
            }),
          },
        },
      ],
    }).compile()

    controller = module.get<OSSSourceController>(OSSSourceController)
    service = module.get<OSSComplianceService>(OSSComplianceService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should pass through sbom data as expected', async () => {
    const response = createMockResponse(url)
    const data = await controller.getOSSComplianceInfo(response)

    expect(await streamToString(data.getStream())).toBe(sbomContent)
    expect(response.header).toBeCalledWith(
      'Content-Disposition',
      `attachment; filename="${sbomFilename}"`,
    )
  })

  it('should pass through a component list', () => {
    const data = controller.getOSSComponentList()

    expect(data).toEqual({ components: Object.keys(componentMap) })
  })

  it('should pass through component source file content', async () => {
    const name = Object.keys(componentMap)[0]
    const response = createMockResponse(url)
    const data = await controller.getSourceOfOSSComponent(name, response)

    expect(await streamToString(data.getStream())).toBe(sourceFileContent)
    expect(response.header).toBeCalledWith(
      'Content-Disposition',
      `attachment; filename="${componentMap[name]}"`,
    )
  })

  it('should pass through an exception from the service', async () => {
    jest
      .spyOn(service, 'getSourceForComponent')
      .mockRejectedValue(new NotFoundException())
    const name = Object.keys(componentMap)[0]
    const response = createMockResponse(url)

    await expect(
      controller.getSourceOfOSSComponent(name, response),
    ).rejects.toThrow(NotFoundException)
  })

  it.each([undefined, null, '', ' \t\n'])(
    'should validate for improper names',
    async (name) => {
      const response = createMockResponse(url)

      await expect(
        controller.getSourceOfOSSComponent(name, response),
      ).rejects.toThrow(BadRequestException)
      expect(service.getSourceForComponent).not.toBeCalled()
    },
  )
})
