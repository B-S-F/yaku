import {
  PaginationQueryOptions,
  SortOrder,
  UrlHandlerFactory,
  UrlProtocolConfig,
  queryOptionsSchema,
  streamToString,
  toListQueryOptions,
  createMockResponse,
  namespaceUrl,
  testingNamespaceId,
} from '@B-S-F/api-commons-lib'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { JsonValidatorService } from '../../gp-services/json-validator.service'
import { YamlValidatorService } from '../../gp-services/yaml-validator.service'
import { Namespace } from '../namespace/namespace.entity'
import { ConfigEntity } from './config.entity'
import { ConfigsController } from './configs.controller'
import { ConfigsService } from './configs.service'
import { testUser, baseUrl } from '../../gp-services/test-services'

describe('ConfigsController', () => {
  let controller: ConfigsController
  let service: ConfigsService

  const configId = 1
  const configAltId = 2
  const configNotId = 3
  const configName = 'Test1'
  const configUpdName = 'Test11'
  const configDescription = 'Description1'

  const mockConfigsUrl = `${namespaceUrl}/configs`
  const mockConfigsUrlId = `${mockConfigsUrl}/${configId}`

  const mockedTotalCount = 42

  const validateState = 'YELLOW'
  const validateFindings = ['Hello', 'World']
  const initialConfig = 'This is an initial config bla text'
  const initialFilename = 'qg-config5.yaml'
  const questionnaireString = 'Mocked questionnaire'
  const questionnaire = [
    { buffer: Buffer.from(questionnaireString, 'utf-8') },
  ] as unknown as Express.Multer.File
  const excelQuestionnaireString = 'Mocked content of Excel file'
  const excelColumnConfigString = 'Mocked content of Excel config file'
  const excelQuestionnaire = [
    {
      buffer: Buffer.from(excelQuestionnaireString, 'utf-8'),
      originalname: 'TestProject',
    },
  ] as unknown as Express.Multer.File
  const excelColumnConfig = [
    { buffer: Buffer.from(excelColumnConfigString, 'utf-8') },
  ] as unknown as Express.Multer.File

  function createStandardObject(): ConfigEntity {
    const config = new ConfigEntity()
    config.globalId = 1
    config.namespace = { id: testingNamespaceId, name: '' }
    config.id = configId
    config.name = configName
    config.description = configDescription
    config.creationTime = new Date(0)
    config.lastModificationTime = new Date(0)
    config.files = [
      { id: 1, filename: 'qg-config.yaml', config },
      { id: 2, filename: 'qg-config1.yaml', config },
      { id: 3, filename: 'another-config.yaml', config },
      {
        id: 4,
        filename: 'yet änöther configΩ.yaml',
        config,
      },
    ]
    return config
  }

  function createSimpleStandardObject(): ConfigEntity {
    const config = new ConfigEntity()
    config.globalId = 1
    config.namespace = { id: testingNamespaceId, name: '' }
    config.id = configAltId
    config.name = configName
    config.creationTime = new Date(0)
    config.lastModificationTime = new Date(0)
    config.files = [{ id: 1, filename: 'qg-config.yaml', config }]
    return config
  }

  function createListOfTen(): ConfigEntity[] {
    const configList: ConfigEntity[] = []
    const namespace = {
      id: testingNamespaceId,
      name: '',
      users: [],
    } as Namespace

    const createConfig = (id: number): ConfigEntity => {
      const config = new ConfigEntity()
      config.globalId = id
      config.namespace = namespace
      config.id = id
      config.name = `Cfg${id}`
      config.creationTime = new Date(0)
      config.lastModificationTime = new Date(Date.now() - id * 60 * 1000)
      config.files = []
      return config
    }
    for (let i = 1; i <= 10; i++) {
      configList.push(createConfig(i))
    }
    return configList
  }

  function createFromData(
    namespaceId: number,
    name: string,
    description?: string
  ): ConfigEntity {
    const config = new ConfigEntity()
    config.globalId = 0
    config.namespace = { id: namespaceId, name: '' }
    config.id = configId
    config.name = name
    if (description || description === '') {
      config.description = description
    }
    config.creationTime = new Date()
    config.lastModificationTime = config.creationTime
    config.files = []
    return config
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigsController],
      providers: [
        JsonValidatorService,
        {
          provide: YamlValidatorService,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: ConfigsService,
          useValue: {
            create: jest.fn(),
            getConfig: jest.fn(),
            getConfigs: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            validate: jest.fn(),
            createInitialConfig: jest.fn(),
            createInitialConfigFromExcel: jest.fn(),
          },
        },
        UrlHandlerFactory,
        {
          provide: UrlProtocolConfig,
          useValue: {
            serviceProtocol: 'https',
          },
        },
      ],
    }).compile()

    controller = module.get<ConfigsController>(ConfigsController)
    service = module.get<ConfigsService>(ConfigsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('Create config', () => {
    it('should create a new config with description', async () => {
      jest.useFakeTimers()
      const srvSpy = jest
        .spyOn(service, 'create')
        .mockImplementation(
          async (nsid: number, name: string, description: string) =>
            Promise.resolve(createFromData(nsid, name, description))
        )
      const response = createMockResponse(`${baseUrl}/configs`, testUser)

      const created = await controller.createConfig(
        testingNamespaceId,
        { name: configName, description: configDescription },
        response
      )

      expect(created.id).toBe(configId)
      expect(created.name).toBe(configName)
      expect(created.description).toBe(configDescription)
      expect(created.creationTime).toEqual(new Date())
      expect(created.lastModificationTime).toEqual(created.creationTime)
      expect(created.files.qgConfig).toBeFalsy()
      expect(created.files.additionalConfigs).toBeFalsy()

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configName,
        configDescription
      )
      expect(response.header).toBeCalledWith('Location', `${mockConfigsUrlId}`)
      jest.useRealTimers()
    })

    it('should create a new config without description', async () => {
      jest.useFakeTimers()
      const srvSpy = jest
        .spyOn(service, 'create')
        .mockImplementation(
          async (nsid: number, name: string, description: string) =>
            Promise.resolve(createFromData(nsid, name, description))
        )
      const response = createMockResponse(`${baseUrl}/configs`, testUser)
      const created = await controller.createConfig(
        testingNamespaceId,
        { name: configName },
        response
      )

      expect(created.id).toBe(configId)
      expect(created.name).toBe(configName)
      expect(created.creationTime).toEqual(new Date())
      expect(created.lastModificationTime).toEqual(created.creationTime)
      expect(created.files.qgConfig).toBeFalsy()
      expect(created.files.additionalConfigs).toBeFalsy()

      expect(srvSpy).toBeCalledWith(testingNamespaceId, configName, undefined)
      expect(response.header).toBeCalledWith('Location', `${mockConfigsUrlId}`)
      jest.useRealTimers()
    })

    it('should throw a BadRequestException if data is not valid', async () => {
      const response = createMockResponse(`${baseUrl}/configs`, testUser)

      await expect(
        controller.createConfig(testingNamespaceId, { name: '' }, response)
      ).rejects.toThrow(BadRequestException)

      expect(service.create).not.toBeCalled()
      expect(response.header).not.toBeCalled()
    })
  })

  describe('Get single config', () => {
    it('should retrieve a single config for a certain id', async () => {
      const srvSpy = jest
        .spyOn(service, 'getConfig')
        .mockResolvedValue(createStandardObject())
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}`,
        testUser
      )

      const retrieved = await controller.getConfig(
        testingNamespaceId,
        configId,
        response
      )

      expect(retrieved).not.toBeInstanceOf(ConfigEntity)
      expect(retrieved.name).toBe(configName)
      expect(retrieved.description).toBe(configDescription)
      expect(retrieved.id).toBe(configId)
      expect(retrieved.creationTime).toEqual(new Date(0))
      expect(retrieved.lastModificationTime).toEqual(new Date(0))
      expect(retrieved.files.qgConfig).toBe(
        `${mockConfigsUrlId}/files/qg-config.yaml`
      )
      expect(retrieved.files.additionalConfigs).toContain(
        `${mockConfigsUrlId}/files/qg-config1.yaml`
      )
      expect(retrieved.files.additionalConfigs).toContain(
        `${mockConfigsUrlId}/files/another-config.yaml`
      )
      expect(retrieved.files.additionalConfigs).toContain(
        `${mockConfigsUrlId}/files/yet%20%C3%A4n%C3%B6ther%20config%CE%A9.yaml`
      )
      expect(retrieved.files.additionalConfigs.length).toBe(3)

      expect(srvSpy).toBeCalledWith(testingNamespaceId, configId)
    })

    it('should retrieve a simple config', async () => {
      const srvSpy = jest
        .spyOn(service, 'getConfig')
        .mockResolvedValue(createSimpleStandardObject())
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}`,
        testUser
      )

      const retrieved = await controller.getConfig(
        testingNamespaceId,
        configAltId,
        response
      )

      expect(retrieved).not.toBeInstanceOf(ConfigEntity)
      expect(retrieved.name).toBe(configName)
      expect(retrieved.description).toBeFalsy()
      expect(retrieved.id).toBe(configAltId)
      expect(retrieved.creationTime).toEqual(new Date(0))
      expect(retrieved.lastModificationTime).toEqual(new Date(0))
      expect(retrieved.files.qgConfig).toBe(
        `${mockConfigsUrlId}/files/qg-config.yaml`
      )
      expect(retrieved.files.additionalConfigs).toBeFalsy()

      expect(srvSpy).toBeCalledWith(testingNamespaceId, configAltId)
    })

    it('should throw a NotFoundException if id is unknown', async () => {
      const srvSpy = jest
        .spyOn(service, 'getConfig')
        .mockRejectedValue(new NotFoundException())
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}`,
        testUser
      )

      await expect(
        controller.getConfig(testingNamespaceId, configNotId, response)
      ).rejects.toThrow(NotFoundException)

      expect(srvSpy).toBeCalledWith(testingNamespaceId, configNotId)
    })
  })

  describe('Update config', () => {
    it('should update a complex config properly', async () => {
      const srvSpy = jest
        .spyOn(service, 'update')
        .mockImplementation(
          async (
            namespaceId: number,
            configId: number,
            name: string,
            description: string
          ) => {
            const config = createStandardObject()
            config.name = name
            config.description = description
            return config
          }
        )

      const response = createMockResponse(
        `${baseUrl}/configs/${configId}`,
        testUser
      )
      const retrieved = await controller.updateConfig(
        testingNamespaceId,
        configId,
        { name: configUpdName, description: null },
        response
      )

      expect(retrieved.name).toBe(configUpdName)
      expect(retrieved.description).toBeFalsy()
      expect(retrieved.id).toBe(configId)
      expect(retrieved.creationTime).toEqual(new Date(0))
      expect(retrieved.lastModificationTime).toEqual(new Date(0))
      expect(retrieved.files.qgConfig).toBe(
        `${mockConfigsUrlId}/files/qg-config.yaml`
      )
      expect(retrieved.files.additionalConfigs).toContain(
        `${mockConfigsUrlId}/files/qg-config1.yaml`
      )
      expect(retrieved.files.additionalConfigs).toContain(
        `${mockConfigsUrlId}/files/another-config.yaml`
      )
      expect(retrieved.files.additionalConfigs).toContain(
        `${mockConfigsUrlId}/files/yet%20%C3%A4n%C3%B6ther%20config%CE%A9.yaml`
      )
      expect(retrieved.files.additionalConfigs.length).toBe(3)

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configId,
        configUpdName,
        null
      )
    })

    it('should update a simpler config properly', async () => {
      const srvSpy = jest
        .spyOn(service, 'update')
        .mockImplementation(
          async (
            namespaceId: number,
            configId: number,
            name: string,
            description: string
          ) => {
            const config = createSimpleStandardObject()
            config.name = name
            config.description = description
            return config
          }
        )

      const response = createMockResponse(
        `${baseUrl}/configs/${configId}`,
        testUser
      )

      const retrieved = await controller.updateConfig(
        testingNamespaceId,
        configAltId,
        { name: configUpdName, description: configDescription },
        response
      )

      expect(retrieved.name).toBe(configUpdName)
      expect(retrieved.description).toBe(configDescription)
      expect(retrieved.id).toBe(configAltId)
      expect(retrieved.creationTime).toEqual(new Date(0))
      expect(retrieved.lastModificationTime).toEqual(new Date(0))
      expect(retrieved.files.qgConfig).toBe(
        `${mockConfigsUrlId}/files/qg-config.yaml`
      )
      expect(retrieved.files.additionalConfigs).toBeFalsy()

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configAltId,
        configUpdName,
        configDescription
      )
    })

    it('should throw a BadRequestException, if data does not fulfil constraints', async () => {
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}`,
        testUser
      )

      await expect(
        controller.updateConfig(testingNamespaceId, configAltId, {}, response)
      ).rejects.toThrow(BadRequestException)

      expect(service.update).not.toBeCalled()
    })

    it('should throw a NotFoundException if id is unknown', async () => {
      const srvSpy = jest
        .spyOn(service, 'update')
        .mockRejectedValue(new NotFoundException())
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}`,
        testUser
      )

      await expect(
        controller.updateConfig(
          testingNamespaceId,
          configNotId,
          { name: configUpdName },
          response
        )
      ).rejects.toThrow(NotFoundException)

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configNotId,
        configUpdName,
        undefined
      )
    })
  })

  describe('Delete config', () => {
    it('should return properly on delete', async () => {
      await controller.deleteConfig(testingNamespaceId, configId)

      expect(service.delete).toBeCalledWith(testingNamespaceId, configId)
    })
  })

  describe('Get list of configs', () => {
    it('should return the list of configs given as proper paginated data', async () => {
      const srvSpy = jest.spyOn(service, 'getConfigs').mockResolvedValue({
        entities: createListOfTen(),
        itemCount: mockedTotalCount,
      })
      const response = createMockResponse(`${baseUrl}/configs`, testUser)

      const retrieved = await controller.getConfigs(
        testingNamespaceId,
        { page: 2, items: 10, sortOrder: SortOrder.ASC },
        response
      )

      expect(retrieved.pagination.pageNumber).toBe(2)
      expect(retrieved.pagination.pageSize).toBe(10)
      expect(retrieved.pagination.totalCount).toBe(mockedTotalCount)
      expect(retrieved.data.length).toBe(10)
      expect(retrieved.data[0].id).toBeDefined()
      expect(retrieved.data[0].name).toBeDefined()
      expect(retrieved.data[0].files).toBeDefined()
      expect(retrieved.links.first).toBe(
        `${mockConfigsUrl}?page=1&items=10&sortOrder=ASC`
      )
      expect(retrieved.links.last).toBe(
        `${mockConfigsUrl}?page=5&items=10&sortOrder=ASC`
      )
      expect(retrieved.links.prev).toBe(
        `${mockConfigsUrl}?page=1&items=10&sortOrder=ASC`
      )
      expect(retrieved.links.next).toBe(
        `${mockConfigsUrl}?page=3&items=10&sortOrder=ASC`
      )

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        toListQueryOptions(
          { page: 2, items: 10, sortOrder: SortOrder.ASC },
          queryOptionsSchema.strict(),
          [],
          'id'
        )
      )
    })

    it('should return the list of configs given as proper paginated data with partial default query options', async () => {
      const srvSpy = jest.spyOn(service, 'getConfigs').mockResolvedValue({
        entities: createListOfTen(),
        itemCount: mockedTotalCount,
      })

      const response = createMockResponse(`${baseUrl}/configs`, testUser)
      const retrieved = await controller.getConfigs(
        testingNamespaceId,
        { items: 10 } as PaginationQueryOptions,
        response
      )

      expect(retrieved.pagination.pageNumber).toBe(1)
      expect(retrieved.pagination.pageSize).toBe(10)
      expect(retrieved.pagination.totalCount).toBe(mockedTotalCount)
      expect(retrieved.data.length).toBe(10)
      expect(retrieved.data[0].id).toBeDefined()
      expect(retrieved.data[0].name).toBeDefined()
      expect(retrieved.data[0].files).toBeDefined()
      expect(retrieved.links.first).toBe(`${mockConfigsUrl}?page=1&items=10`)
      expect(retrieved.links.last).toBe(`${mockConfigsUrl}?page=5&items=10`)
      expect(retrieved.links.prev).toBeFalsy()
      expect(retrieved.links.next).toBe(`${mockConfigsUrl}?page=2&items=10`)

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        toListQueryOptions(
          { items: 10 } as PaginationQueryOptions,
          queryOptionsSchema.strict(),
          [],
          'id'
        )
      )
    })

    it('should handle an empty list as expected', async () => {
      const srvSpy = jest
        .spyOn(service, 'getConfigs')
        .mockResolvedValue({ entities: [], itemCount: 0 })

      const response = createMockResponse(`${baseUrl}/configs`, testUser)
      const retrieved = await controller.getConfigs(
        testingNamespaceId,
        { items: 10 } as PaginationQueryOptions,
        response
      )

      expect(retrieved.pagination.pageNumber).toBe(1)
      expect(retrieved.pagination.pageSize).toBe(0)
      expect(retrieved.pagination.totalCount).toBe(0)
      expect(retrieved.data.length).toBe(0)
      expect(retrieved.links.first).toBe(`${mockConfigsUrl}?page=1&items=10`)
      expect(retrieved.links.last).toBe(`${mockConfigsUrl}?page=1&items=10`)
      expect(retrieved.links.prev).toBeFalsy()
      expect(retrieved.links.next).toBeFalsy()

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        toListQueryOptions(
          { items: 10 } as PaginationQueryOptions,
          queryOptionsSchema.strict(),
          [],
          'id'
        )
      )
    })

    it.each([1, null, {}, [], ''])(
      'should handle not allowed sorting property "%s" properly',
      async (property) => {
        const response = createMockResponse(`${baseUrl}/configs`, testUser)
        await expect(
          controller.getConfigs(
            testingNamespaceId,
            { sortBy: property } as PaginationQueryOptions,
            response
          )
        ).rejects.toThrow(BadRequestException)
      }
    )
  })

  describe('Special methods', () => {
    it('should return a proper validation result', async () => {
      const srvSpy = jest.spyOn(service, 'validate').mockResolvedValue({
        status: validateState,
        findings: validateFindings,
      })
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}/validate`,
        testUser
      )

      const validationResult = await controller.validateConfig(
        testingNamespaceId,
        configId,
        response
      )

      expect(validationResult.status).toBe(validateState)
      expect(validationResult.findings).toBe(validateFindings)
      expect(validationResult.validated).toBe(`${mockConfigsUrlId}`)
      expect(srvSpy).toBeCalledWith(testingNamespaceId, configId)
    })

    it('should return a proper config file content for createInitialConfig', async () => {
      const srvSpy = jest
        .spyOn(service, 'createInitialConfig')
        .mockResolvedValue({
          filename: initialFilename,
          content: Buffer.from(initialConfig, 'utf-8'),
        })
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}/initial-config`,
        testUser
      )

      const configFile = await controller.createInitialConfig(
        testingNamespaceId,
        configId,
        { content: questionnaire },
        response
      )

      expect(response.header).toBeCalledTimes(3)
      expect(response.header).toBeCalledWith(
        'Content-Type',
        'application/octet-stream'
      )
      expect(response.header).toBeCalledWith(
        'Content-Disposition',
        `attachment; filename="${initialFilename}"`
      )
      expect(response.header).toBeCalledWith(
        'Location',
        `${mockConfigsUrlId}/files/${initialFilename}`
      )
      expect(await streamToString(configFile.getStream())).toBe(initialConfig)
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configId,
        questionnaire[0].buffer
      )
    })

    it('should return a proper config file content for createInitialConfigFromExcel', async () => {
      const srvSpy = jest
        .spyOn(service, 'createInitialConfigFromExcel')
        .mockResolvedValue({
          filename: initialFilename,
          content: Buffer.from(initialConfig, 'utf-8'),
        })
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}/initial-config`,
        testUser
      )

      const configFile = await controller.createInitialConfigFromExcel(
        testingNamespaceId,
        configId,
        { xlsx: excelQuestionnaire, config: excelColumnConfig },
        response
      )

      expect(response.header).toBeCalledTimes(3)
      expect(response.header).toBeCalledWith(
        'Content-Type',
        'application/octet-stream'
      )
      expect(response.header).toBeCalledWith(
        'Content-Disposition',
        `attachment; filename="${initialFilename}"`
      )
      expect(response.header).toBeCalledWith(
        'Location',
        `${mockConfigsUrlId}/files/${initialFilename}`
      )
      expect(await streamToString(configFile.getStream())).toBe(initialConfig)
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configId,
        excelQuestionnaire[0].originalname,
        excelQuestionnaire[0].buffer,
        excelColumnConfig[0].buffer
      )
    })
  })
})
