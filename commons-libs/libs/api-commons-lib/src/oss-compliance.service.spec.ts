import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as path from 'path'
import {
  OSSComplianceConfig,
  OSSComplianceService,
} from './oss-compliance.service'

describe('OSSComplianceService', () => {
  let service: OSSComplianceService

  const testfile = path.join(
    __dirname,
    'testdata',
    'oss-compliance.service.testfile.json',
  )
  const componentMap = {
    comp1: path.join(__dirname, 'testdata', 'fileForComp1.txt'),
    comp2: path.join(__dirname, 'testdata', 'fileForComp2.txt'),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OSSComplianceService,
        {
          provide: OSSComplianceConfig,
          useFactory: () => {
            return new OSSComplianceConfig(testfile, componentMap)
          },
        },
      ],
    }).compile()

    service = module.get<OSSComplianceService>(OSSComplianceService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should allow to create the service config with only the first parameter given', () => {
    const config = new OSSComplianceConfig(testfile)
    expect(config.sbomFilepath).toBe(testfile)
    expect(Object.keys(config.sourceNameToFileMap)).toHaveLength(0)
  })

  it('should return proper values', async () => {
    expect((await service.getSBOM()).toString('utf-8')).toBe(
      '{\n  "text": "Some String"\n}\n',
    )
  })

  it('should extract the filename of the sbom file properly from the given path', () => {
    expect(service.getSBOMFilename()).toBe(
      'oss-compliance.service.testfile.json',
    )
  })

  it('should return all component names from the component map', () => {
    expect(service.getComponentsWithSources()).toEqual(
      Object.keys(componentMap),
    )
  })

  it('should return the proper content for a requested component', async () => {
    const received = await service.getSourceForComponent('comp1')
    const filename = received.filename
    const content = received.content.toString('utf-8')

    expect(filename).toBe('fileForComp1.txt')
    expect(content).toBe('Component 1 source code')
  })

  it('should throw a NotFound, in case of an unknown configuration', async () => {
    await expect(service.getSourceForComponent('comp3')).rejects.toThrow(
      NotFoundException,
    )
  })

  it('should throw an arbitrary error in case of a configuration issue (mapping points to non existing file name)', async () => {
    await expect(service.getSourceForComponent('comp2')).rejects.toThrow()
  })
})
