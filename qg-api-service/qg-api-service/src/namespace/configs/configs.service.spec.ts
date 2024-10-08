import {
  BadRequestException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { QueryFailedError, Repository } from 'typeorm'
import { Finding } from '../findings/entity/finding.entity'
import { FindingService } from '../findings/finding.service'
import { Metric } from '../metrics/entity/metric.entity'
import { MetricService } from '../metrics/metric.service'
import { NamespaceLocalIdService } from '../namespace/namespace-local-id.service'
import { Namespace } from '../namespace/namespace.entity'
import { ConfigEntity, FileContentEntity, FileEntity } from './config.entity'
import { ConfigsService } from './configs.service'
import { ExcelTransformerService } from './excel-transformer.service'
import { GeneratorService } from './generator.service'
import { UsersService } from '../users/users.service'

describe('ConfigsService', () => {
  let service: ConfigsService
  let configRepository: Repository<ConfigEntity>
  let fileRepository: Repository<FileEntity>
  let fileContentRepository: Repository<FileContentEntity>
  let namespaceLocalIdService: NamespaceLocalIdService
  let generatorService: GeneratorService
  let excelReaderService: ExcelTransformerService
  let findingService: FindingService
  let findingRepository: Repository<Finding>

  const namespace1: Namespace = {
    id: 1,
    name: 'NS1',
  }

  let config1Ns1: ConfigEntity
  let config2Ns1: ConfigEntity

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigsService,
        FindingService,
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn(),
          },
        },
        {
          provide: MetricService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Metric),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Finding),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ConfigEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((config: ConfigEntity) => {
              return config
            }),
            save: jest.fn().mockImplementation((config: ConfigEntity) => {
              return config
            }),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FileEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn().mockImplementation((file: FileEntity) => {
              return file
            }),
            save: jest.fn().mockImplementation((file: FileEntity) => {
              return file
            }),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FileContentEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest
              .fn()
              .mockImplementation((fileContent: FileContentEntity) => {
                return fileContent
              }),
            save: jest
              .fn()
              .mockImplementation((fileContent: FileContentEntity) => {
                return fileContent
              }),
            update: jest.fn(),
          },
        },
        {
          provide: NamespaceLocalIdService,
          useValue: {
            nextId: jest.fn(),
            initializeIdCreation: jest.fn(),
          },
        },
        {
          provide: GeneratorService,
          useValue: {
            generateInitialConfig: jest.fn(),
          },
        },
        {
          provide: ExcelTransformerService,
          useValue: {
            transformExcelToQuestionnaireData: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<ConfigsService>(ConfigsService)
    configRepository = module.get(getRepositoryToken(ConfigEntity))
    fileRepository = module.get(getRepositoryToken(FileEntity))
    fileContentRepository = module.get(getRepositoryToken(FileContentEntity))
    namespaceLocalIdService = module.get(NamespaceLocalIdService)
    generatorService = module.get(GeneratorService)
    excelReaderService = module.get(ExcelTransformerService)
    findingService = module.get(FindingService)
    findingRepository = module.get(getRepositoryToken(Finding))

    config1Ns1 = {
      globalId: 1,
      namespace: namespace1,
      id: 1,
      name: 'config1',
      description: 'config1 description',
      creationTime: new Date(),
      lastModificationTime: new Date(),
      files: [],
    } as ConfigEntity

    config2Ns1 = {
      globalId: 2,
      namespace: namespace1,
      id: 2,
      name: 'config2',
      description: 'config2 description',
      creationTime: new Date(),
      lastModificationTime: new Date(),
      files: [],
    } as ConfigEntity
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getList', () => {
    function mockQueryBuilder(itemCount: number, entities: ConfigEntity[]) {
      return jest
        .spyOn(configRepository, 'createQueryBuilder')
        .mockReturnValue({
          leftJoinAndSelect() {
            return this
          },
          where() {
            return this
          },
          async getCount() {
            return itemCount as any
          },
          async getRawAndEntities() {
            return {
              entities,
            }
          },
        } as any)
    }

    it('should return list of configs', async () => {
      mockQueryBuilder(2, [config1Ns1, config2Ns1])
      const listQueryHandler: any = {
        sortBy: 'name',
        addToQueryBuilder: jest.fn(),
      }

      const result = await service.getConfigs(namespace1.id, listQueryHandler)
      expect(result.itemCount).toEqual(2)
      expect(result.entities).toEqual([config1Ns1, config2Ns1])
    })
  })

  describe('getConfig', () => {
    it('should return the config with the given id', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)
      const result = await service.getConfig(namespace1.id, 1)
      expect(result).toEqual(config1Ns1)
    })

    it('should throw an error if the config does not exist', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(null)
      await expect(service.getConfig(namespace1.id, 1)).rejects.toThrowError(
        NotFoundException
      )
    })

    it('should throw an error if the configId is not an id', async () => {
      const invalidIds = [undefined, null, '', -1]
      for (const id of invalidIds) {
        await expect(
          service.getConfig(namespace1.id, id as any)
        ).rejects.toThrow(BadRequestException)
      }
    })

    it('should throw an error if the namespaceId is not an id', async () => {
      const invalidIds = [undefined, null, '', -1]
      for (const id of invalidIds) {
        await expect(service.getConfig(id as any, 1)).rejects.toThrow(
          BadRequestException
        )
      }
    })
  })

  describe('create', () => {
    it('should create a new config', async () => {
      const expectedNextID = 3
      const nextIdSpy = jest
        .spyOn(namespaceLocalIdService, 'nextId')
        .mockResolvedValue(expectedNextID)

      const result = await service.create(
        namespace1.id,
        'config1',
        'some description'
      )

      expect(nextIdSpy).toBeCalledTimes(1)
      expect(configRepository.save).toBeCalledTimes(1)
      expect(configRepository.save).toBeCalledWith({
        id: expectedNextID,
        name: 'config1',
        description: 'some description',
        namespace: {
          id: namespace1.id,
        },
        creationTime: new Date(),
        lastModificationTime: new Date(),
      })
      expect(result.description).toBe('some description')
      expect(result.name).toBe('config1')
    })

    it('should pass up an error that happens during nextId creation', async () => {
      const nextIdSpy = jest
        .spyOn(namespaceLocalIdService, 'nextId')
        .mockRejectedValue(new Error('some error'))
      await expect(
        service.create(namespace1.id, 'config1', 'some description')
      ).rejects.toThrowError()
      expect(nextIdSpy).toBeCalledTimes(1)
      expect(configRepository.create).not.toBeCalled()
    })

    it('should handle invalid config names', async () => {
      const invalidNames = [undefined, null, '']
      for (const name of invalidNames) {
        await expect(
          service.create(namespace1.id, name as any, 'some description')
        ).rejects.toThrowError(BadRequestException)
      }
    })
  })

  describe('update', () => {
    it('should update the config', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)

      jest.advanceTimersByTime(3)
      await service.update(
        namespace1.id,
        1,
        'new config name',
        'new description'
      )

      expect(configRepository.update).toBeCalledTimes(1)
      expect(configRepository.update).toBeCalledWith(
        { globalId: config1Ns1.globalId },
        {
          globalId: config1Ns1.globalId,
          name: 'new config name',
          description: 'new description',
          lastModificationTime: new Date(),
        }
      )
      expect(configRepository.save).toBeCalledTimes(1)
      expect(configRepository.save).toBeCalledWith({
        globalId: config1Ns1.globalId,
        name: 'new config name',
        description: 'new description',
        lastModificationTime: new Date(),
      })
    })

    it('should keep description if not provided', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)

      await service.update(
        namespace1.id,
        1,
        'some config name',
        undefined as any
      )

      expect(configRepository.update).toBeCalledTimes(1)
      expect(configRepository.update).toBeCalledWith(
        { globalId: config1Ns1.globalId },
        {
          globalId: config1Ns1.globalId,
          name: 'some config name',
          description: config1Ns1.description,
          lastModificationTime: new Date(),
        }
      )
      expect(configRepository.save).toBeCalledTimes(1)
      expect(configRepository.save).toBeCalledWith({
        globalId: config1Ns1.globalId,
        name: 'some config name',
        description: config1Ns1.description,
        lastModificationTime: new Date(),
      })
    })

    it('should keep name if not provided', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)

      await service.update(
        namespace1.id,
        1,
        undefined as any,
        'some description'
      )

      expect(configRepository.update).toBeCalledTimes(1)
      expect(configRepository.update).toBeCalledWith(
        { globalId: config1Ns1.globalId },
        {
          globalId: config1Ns1.globalId,
          name: config1Ns1.name,
          description: 'some description',
          lastModificationTime: new Date(),
        }
      )
      expect(configRepository.save).toBeCalledTimes(1)
      expect(configRepository.save).toBeCalledWith({
        globalId: config1Ns1.globalId,
        name: config1Ns1.name,
        description: 'some description',
        lastModificationTime: new Date(),
      })
    })

    it('should treat a empty description as null', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)

      await service.update(namespace1.id, 1, undefined as any, '')

      expect(configRepository.save).toBeCalledTimes(1)
      expect(configRepository.save).toBeCalledWith({
        globalId: config1Ns1.globalId,
        name: config1Ns1.name,
        description: null,
        lastModificationTime: new Date(),
      })
      expect(configRepository.update).toBeCalledTimes(1)
    })

    it('should treat a null description as null', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)

      await service.update(namespace1.id, 1, undefined as any, null)

      expect(configRepository.save).toBeCalledTimes(1)
      expect(configRepository.save).toBeCalledWith({
        globalId: config1Ns1.globalId,
        name: config1Ns1.name,
        description: null,
        lastModificationTime: new Date(),
      })
      expect(configRepository.update).toBeCalledTimes(1)
    })

    it('should throw if the config does not exist', async () => {
      const findOneSpy = jest
        .spyOn(configRepository, 'findOne')
        .mockResolvedValue(undefined)

      await expect(
        service.update(namespace1.id, 1, 'new config name', 'new description')
      ).rejects.toThrowError(NotFoundException)

      expect(findOneSpy).toBeCalledTimes(1)
    })
  })

  describe('updateConfigModificationTime', () => {
    it('should update the config modification time', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)

      jest.advanceTimersByTime(3)
      await service['updateConfigModificationTime'](namespace1.id, 1)

      expect(configRepository.save).toBeCalledWith({
        ...config1Ns1,
        files: undefined,
        lastModificationTime: new Date(
          config1Ns1.lastModificationTime.getTime() + 3
        ),
      })
    })
  })

  describe('delete', () => {
    it('should delete the config including all files (cascading by database)', async () => {
      jest
        .spyOn(findingService, 'deleteAssociatedFindings')
        .mockImplementation(jest.fn())
      await service.delete(namespace1.id, 1)

      expect(configRepository.delete).toBeCalledTimes(1)
      expect(configRepository.delete).toBeCalledWith({
        namespace: { id: namespace1.id },
        id: 1,
      })
      expect(findingService.deleteAssociatedFindings).toHaveBeenCalledWith(
        namespace1.id,
        1
      )
    })

    it('should throw an error if runs exist which reference the config', async () => {
      jest
        .spyOn(configRepository, 'delete')
        .mockRejectedValue(
          new QueryFailedError(
            'delete something',
            [],
            'violates foreign key constraint' as unknown as QueryFailedError
          )
        )

      await expect(service.delete(namespace1.id, 1)).rejects.toThrow(
        BadRequestException
      )
    })

    it('should forward unexpected errors on delete', async () => {
      jest.spyOn(configRepository, 'delete').mockRejectedValue(new Error())

      await expect(service.delete(namespace1.id, 1)).rejects.toThrow(Error)
    })
  })

  describe('validate', () => {
    it('should respond that the method is not implemented', async () => {
      await expect(service.validate(1, 1)).rejects.toThrow(
        NotImplementedException
      )
    })
  })

  describe('createInitialConfig', () => {
    it('should create the initial config', async () => {
      const generateConfigSpy = jest
        .spyOn(generatorService, 'generateInitialConfig')
        .mockReturnValue('I am content')
      const getConfigSpy = jest
        .spyOn(service, 'getConfig')
        .mockResolvedValue(config1Ns1)
      const createFileSpy = jest.spyOn(service, 'createFile')
      const updateConfigModificationTimeSpy = jest
        .spyOn(ConfigsService.prototype as any, 'updateConfigModificationTime')
        .mockResolvedValue(undefined)

      const questionnaireDataBuffer = Buffer.from('questionnaire data', 'utf-8')
      const res = await service.createInitialConfig(
        1,
        1,
        questionnaireDataBuffer
      )

      expect(generateConfigSpy).toBeCalledTimes(1)
      expect(generateConfigSpy).toBeCalledWith(questionnaireDataBuffer)
      expect(getConfigSpy).toBeCalledTimes(2)
      expect(getConfigSpy).toBeCalledWith(namespace1.id, config1Ns1.id)
      expect(createFileSpy).toBeCalledTimes(1)
      expect(createFileSpy).toBeCalledWith(
        namespace1.id,
        config1Ns1.id,
        'qg-config.yaml',
        Buffer.from('I am content', 'utf-8')
      )
      expect(updateConfigModificationTimeSpy).toBeCalledTimes(2)
      expect(updateConfigModificationTimeSpy).toBeCalledWith(
        namespace1.id,
        config1Ns1.id
      )
      expect(res.filename).toEqual('qg-config.yaml')
      expect(res.content.toString()).toEqual('I am content')
    })

    it('should not override config files, that already exist', async () => {
      config1Ns1.files = [
        {
          id: 1,
          filename: 'qg-config.yaml',
          config: config1Ns1,
        },
        {
          id: 2,
          filename: 'qg-config-1.yaml',
          config: config1Ns1,
        },
      ]

      jest
        .spyOn(generatorService, 'generateInitialConfig')
        .mockReturnValue('I am content')
      const createFileSpy = jest.spyOn(service, 'createFile')
      jest.spyOn(service, 'getConfig').mockResolvedValue(config1Ns1)
      jest
        .spyOn(ConfigsService.prototype as any, 'updateConfigModificationTime')
        .mockResolvedValue(undefined)

      const res = await service.createInitialConfig(
        1,
        1,
        Buffer.from('questionnaire data', 'utf-8')
      )

      expect(createFileSpy).toBeCalledWith(
        namespace1.id,
        config1Ns1.id,
        'qg-config-2.yaml',
        Buffer.from('I am content', 'utf-8')
      )
      expect(res.filename).toEqual('qg-config-2.yaml')
    })

    it('should pass a BadRequestException thrown by the generation service', async () => {
      jest
        .spyOn(generatorService, 'generateInitialConfig')
        .mockImplementation(() => {
          throw new BadRequestException()
        })

      await expect(
        service.createInitialConfig(
          1,
          1,
          Buffer.from('questionnaire data', 'utf-8')
        )
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('createInitialConfigFromExcel', () => {
    it('should create a config file out of an excel file', async () => {
      const excelContentData = {
        project: 'TestData',
        version: '0.1',
        chapters: {},
      }
      const excelTransformServiceSpy = jest
        .spyOn(excelReaderService, 'transformExcelToQuestionnaireData')
        .mockReturnValue(excelContentData)
      const generateConfigSpy = jest
        .spyOn(generatorService, 'generateInitialConfig')
        .mockReturnValue('I am content')
      const getConfigSpy = jest
        .spyOn(service, 'getConfig')
        .mockResolvedValue(config1Ns1)
      const createFileSpy = jest.spyOn(service, 'createFile')
      const updateConfigModificationTimeSpy = jest
        .spyOn(ConfigsService.prototype as any, 'updateConfigModificationTime')
        .mockResolvedValue(undefined)

      const excelContent = Buffer.from('questionnaire data', 'utf-8')
      const configContent = Buffer.from('config', 'utf-8')
      const res = await service.createInitialConfigFromExcel(
        1,
        1,
        excelContentData.project,
        excelContent,
        configContent
      )

      expect(excelTransformServiceSpy).toBeCalledTimes(1)
      expect(excelTransformServiceSpy).toBeCalledWith(
        'TestData',
        excelContent,
        configContent
      )
      expect(generateConfigSpy).toBeCalledTimes(1)
      expect(generateConfigSpy).toBeCalledWith(excelContentData)
      expect(getConfigSpy).toBeCalledTimes(2)
      expect(getConfigSpy).toBeCalledWith(namespace1.id, config1Ns1.id)
      expect(createFileSpy).toBeCalledTimes(1)
      expect(createFileSpy).toBeCalledWith(
        namespace1.id,
        config1Ns1.id,
        'qg-config.yaml',
        Buffer.from('I am content', 'utf-8')
      )
      expect(updateConfigModificationTimeSpy).toBeCalledTimes(2)
      expect(updateConfigModificationTimeSpy).toBeCalledWith(
        namespace1.id,
        config1Ns1.id
      )
      expect(res.filename).toEqual('qg-config.yaml')
      expect(res.content.toString()).toEqual('I am content')
    })

    it('should pass a BadRequestException thrown by the excel transformation service', async () => {
      jest
        .spyOn(excelReaderService, 'transformExcelToQuestionnaireData')
        .mockImplementation(() => {
          throw new BadRequestException()
        })

      await expect(
        service.createInitialConfigFromExcel(
          1,
          1,
          'TestProject',
          Buffer.from('questionnaire data', 'utf-8'),
          Buffer.from('config data', 'utf-8')
        )
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('createFile', () => {
    it('should create a file entity and a file content entity', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)
      jest.spyOn(fileRepository, 'findOneBy').mockResolvedValue(undefined)
      const fileCreateSpy = jest
        .spyOn(fileRepository, 'create')
        .mockImplementation((input) => input as any)
      jest.spyOn(fileRepository, 'save').mockImplementation((input) => {
        return input as any
      })
      const fileContentCreateSpy = jest
        .spyOn(fileContentRepository, 'create')
        .mockImplementation((input) => input as any)
      jest.spyOn(fileContentRepository, 'save').mockImplementation((input) => {
        return input as any
      })
      const updateConfigModificationTimeSpy = jest
        .spyOn(ConfigsService.prototype as any, 'updateConfigModificationTime')
        .mockResolvedValue(undefined)

      await service.createFile(1, 1, 'some-name', Buffer.from('TEST', 'utf-8'))

      expect(fileCreateSpy).toBeCalledTimes(1)
      expect(fileCreateSpy).toBeCalledWith({
        filename: 'some-name',
        config: config1Ns1,
      })
      expect(fileContentCreateSpy).toBeCalledTimes(1)
      expect(fileContentCreateSpy).toBeCalledWith({
        content: 'TEST',
        file: { filename: 'some-name', config: config1Ns1 },
      })
      expect(updateConfigModificationTimeSpy).toBeCalledTimes(1)
      expect(updateConfigModificationTimeSpy).toBeCalledWith(
        namespace1.id,
        config1Ns1.id
      )
    })

    it('should throw an error if the fileContent is empty', async () => {
      await expect(
        service.createFile(1, 1, 'some-name', Buffer.from('', 'utf-8'))
      ).rejects.toThrow(BadRequestException)

      expect(fileContentRepository.save).not.toBeCalled()
    })

    it('should throw an error if the file content is not utf-8 encoded', async () => {
      await expect(
        service.createFile(
          1,
          1,
          'some-name',
          Buffer.from('\ufeffTEST', 'utf16le')
        )
      ).rejects.toThrow(BadRequestException)

      expect(fileContentRepository.save).not.toBeCalled()
    })

    it('should throw an error if the config does not exist', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(undefined)

      await expect(
        service.createFile(1, 1, 'some-name', Buffer.from('TEST', 'utf-8'))
      ).rejects.toThrow(NotFoundException)

      expect(fileContentRepository.save).not.toBeCalled()
    })

    it('should throw an error if the file already exists', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue({} as any)
      jest
        .spyOn(fileRepository, 'findOneBy')
        .mockResolvedValue({} as FileEntity)

      await expect(
        service.createFile(1, 1, 'some-name', Buffer.from('TEST', 'utf-8'))
      ).rejects.toThrow(BadRequestException)

      expect(fileContentRepository.save).not.toBeCalled()
    })
  })

  describe('getFileContent', () => {
    const file1 = {
      id: 1,
      filename: 'file1',
      config: { id: 1 } as ConfigEntity,
    } as FileEntity

    const fileContent1 = {
      content: 'TEST',
      file: file1,
    } as FileContentEntity

    it('should return the file content', async () => {
      jest.spyOn(fileRepository, 'findOneBy').mockResolvedValue(file1)
      jest
        .spyOn(fileContentRepository, 'findOneBy')
        .mockResolvedValue(fileContent1)

      const fileContent = await service.getFileContent(1, 1, 'file1')

      expect(fileContent.toString()).toEqual('TEST')
    })

    it('should throw an error if the file content does not exist', async () => {
      jest.spyOn(fileRepository, 'findOneBy').mockResolvedValue(undefined)

      await expect(service.getFileContent(1, 1, 'file1')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('getContentOfMultipleFiles', () => {
    const file1 = {
      id: 1,
      filename: 'file1',
      config: { id: 1 } as ConfigEntity,
    } as FileEntity

    const file2 = {
      id: 2,
      filename: 'file2',
      config: { id: 1 } as ConfigEntity,
    } as FileEntity

    const fileContent1 = {
      content: 'TEST',
      file: file1,
    } as FileContentEntity

    const fileContent2 = {
      content: 'TEST2',
      file: file2,
    } as FileContentEntity

    it('should return the file content', async () => {
      jest
        .spyOn(fileContentRepository, 'find')
        .mockResolvedValue([fileContent1, fileContent2])

      const fileContent = await service.getContentOfMultipleFiles(1, 1, [
        'file1',
        'file2',
      ])

      expect(fileContent).toEqual({
        file1: 'TEST',
        file2: 'TEST2',
      })
    })

    it('should return an empty object if no files are found', async () => {
      jest.spyOn(fileContentRepository, 'find').mockResolvedValue([])

      const fileContent = await service.getContentOfMultipleFiles(1, 1, [
        'file1',
        'file2',
      ])

      expect(fileContent).toEqual({})
    })
  })

  describe('updateFile', () => {
    const file1 = {
      id: 1,
      filename: 'file1',
      config: { id: 1 } as ConfigEntity,
    } as FileEntity

    const fileContent1 = {
      id: 1,
      content: 'TEST',
      file: file1,
    } as FileContentEntity

    it('should update the file content', async () => {
      jest.spyOn(fileRepository, 'findOneBy').mockResolvedValue(file1)
      jest
        .spyOn(fileContentRepository, 'findOneBy')
        .mockResolvedValue(fileContent1)
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)
      const updateConfigModificationTimeSpy = jest
        .spyOn(ConfigsService.prototype as any, 'updateConfigModificationTime')
        .mockResolvedValue(undefined)

      await service.updateFile(1, 1, 'file1', Buffer.from('NEW TEST'))

      expect(fileContentRepository.update).toBeCalledTimes(1)
      expect(fileContentRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { ...fileContent1, content: 'NEW TEST' }
      )
      expect(fileContentRepository.save).toBeCalledTimes(1)
      expect(fileContentRepository.save).toHaveBeenCalledWith({
        ...fileContent1,
        content: 'NEW TEST',
      })
      expect(updateConfigModificationTimeSpy).toBeCalledTimes(1)
      expect(updateConfigModificationTimeSpy).toBeCalledWith(
        namespace1.id,
        config1Ns1.id
      )
    })

    it('should throw an error if the file content does not exist', async () => {
      jest.spyOn(fileRepository, 'findOneBy').mockResolvedValue(file1)
      jest
        .spyOn(fileContentRepository, 'findOneBy')
        .mockResolvedValue(undefined)

      await expect(
        service.updateFile(1, 1, 'file1', Buffer.from('TEST', 'utf-8'))
      ).rejects.toThrow(NotFoundException)

      expect(fileContentRepository.save).not.toBeCalled()
    })

    it('should throw an error if the file content is not utf-8 encoded', async () => {
      jest.spyOn(fileRepository, 'findOneBy').mockResolvedValue(file1)
      jest
        .spyOn(fileContentRepository, 'findOneBy')
        .mockResolvedValue(fileContent1)

      await expect(
        service.updateFile(1, 1, 'file1', Buffer.from('\ufeffTEST', 'utf16le'))
      ).rejects.toThrow(BadRequestException)

      expect(fileContentRepository.save).not.toBeCalled()
    })
  })

  describe('deleteFile', () => {
    it('should delete the file content', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(config1Ns1)
      service['updateConfigModificationTime'] = jest.fn()

      await service.deleteFile(1, 1, 'file1')

      expect(configRepository.findOne).toBeCalledTimes(1)
      expect(configRepository.findOne).toBeCalledWith({
        where: { namespace: { id: 1 }, id: 1 },
        relations: ['files'],
      })
      expect(fileRepository.delete).toBeCalledTimes(1)
      expect(fileRepository.delete).toHaveBeenCalledWith({
        config: { globalId: config1Ns1.globalId },
        filename: 'file1',
      })
      expect(service['updateConfigModificationTime']).toBeCalledTimes(1)
      expect(service['updateConfigModificationTime']).toBeCalledWith(
        namespace1.id,
        config1Ns1.id
      )
    })

    it('should not throw an error if the config does not exist', async () => {
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(null)

      await service.deleteFile(1, 1, 'file1')

      expect(fileRepository.delete).not.toBeCalled()
      expect(service['updateConfigModificationTime']).not.toBeCalled()
    })

    it('should forward unexpected errors on deleteFile', async () => {
      jest.spyOn(configRepository, 'findOne').mockRejectedValue(new Error())

      await expect(service.deleteFile(1, 2, 'file1')).rejects.toThrow(Error)
    })
  })

  describe('getNamespaceCreatedCallback', () => {
    it('should return a function', () => {
      const callback = service.getNamespaceCreatedCallback()
      expect(typeof callback).toEqual('function')
    })

    it('should call the idService', () => {
      const callback = service.getNamespaceCreatedCallback()
      callback(1)
      expect(namespaceLocalIdService.initializeIdCreation).toBeCalledTimes(1)
      expect(namespaceLocalIdService.initializeIdCreation).toBeCalledWith(
        'ConfigEntity',
        1
      )
    })
  })

  describe('copyConfig', () => {
    it('should copy the config', async () => {
      const queryRunnerMock = {
        manager: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
      }
      const file1 = {
        id: 1,
        filename: 'file1',
        config: { id: 1 } as ConfigEntity,
      } as FileEntity

      const fileContent1 = {
        content: 'TEST',
        file: file1,
      } as FileContentEntity

      const config1Ns2 = {
        globalId: 1,
        namespace: { id: 2 },
        id: 1,
        name: 'config1',
        description: 'config1 description',
        creationTime: new Date(),
        lastModificationTime: new Date(),
        files: [file1],
      } as ConfigEntity

      const coppiedConfig1Ns2 = {
        globalId: 1,
        namespace: { id: 2 },
        id: 1,
        name: 'copyOfConfig1',
        description: 'copy of config1 description',
        creationTime: new Date(),
        lastModificationTime: new Date(),
        files: [],
      } as ConfigEntity

      jest
        .spyOn(queryRunnerMock.manager, 'findOne')
        .mockResolvedValueOnce(config1Ns2)
      jest
        .spyOn(queryRunnerMock.manager, 'create')
        .mockReturnValueOnce(coppiedConfig1Ns2)
      jest
        .spyOn(queryRunnerMock.manager, 'save')
        .mockResolvedValueOnce(coppiedConfig1Ns2)
      jest
        .spyOn(queryRunnerMock.manager, 'findOne')
        .mockResolvedValueOnce(fileContent1)

      await service.copyConfigWithTransaction(
        queryRunnerMock as any,
        2,
        1,
        'copyOfConfig1',
        'copy of config1 description'
      )

      expect(queryRunnerMock.manager.create).toBeCalledTimes(3)
      expect(queryRunnerMock.manager.save).toBeCalledTimes(3)
      expect(queryRunnerMock.manager.save).toBeCalledWith(coppiedConfig1Ns2)
      expect(queryRunnerMock.manager.findOne).toBeCalledTimes(3)
      expect(queryRunnerMock.manager.findOne).toBeCalledWith(ConfigEntity, {
        where: { id: 1, namespace: { id: 2 } },
        relations: ['files'],
      })
      expect(queryRunnerMock.manager.findOne).toBeCalledWith(
        FileContentEntity,
        {
          where: {
            file: {
              config: {
                id: 1,
                namespace: { id: 2 },
              },
              filename: 'file1',
            },
          },
        }
      )
    })

    it('should throw an error if the config does not exist', async () => {
      const queryRunnerMock = {
        manager: {
          findOne: jest.fn().mockImplementation(() => {
            return undefined
          }),
        },
      }
      jest.spyOn(configRepository, 'findOne').mockResolvedValue(undefined)

      await expect(
        service.copyConfigWithTransaction(
          queryRunnerMock as any,
          namespace1.id,
          1,
          'copyOfConfig1',
          'copy of config1 description'
        )
      ).rejects.toThrow(NotFoundException)
    })
  })
})
