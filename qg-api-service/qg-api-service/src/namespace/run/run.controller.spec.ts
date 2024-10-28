import {
  FilterOption,
  ListQueryHandler,
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
import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { randomInt, randomUUID } from 'crypto'
import fs from 'fs'
import { Readable } from 'stream'
import { ConfigEntity, FileEntity } from '../configs/config.entity'
import { Namespace } from '../namespace/namespace.entity'
import { RunController } from './run.controller'
import { Run, RunResult, RunStatus } from './run.entity'
import { EVIDENCEFILE, RESULTFILE, RunService } from './run.service'
import { testUser, baseUrl } from '../../gp-services/test-services'

describe('RunController', () => {
  let controller: RunController
  let service: RunService

  const mockRunsUrl = `${namespaceUrl}/runs`

  const namespace: Namespace = { id: testingNamespaceId, name: '' }

  const config: ConfigEntity = {
    globalId: 1,
    namespace,
    id: 1,
    name: 'The Config',
    files: [],
  } as ConfigEntity

  const file: FileEntity = {
    id: 1,
    filename: 'qg-config.yaml',
    config,
  } as FileEntity

  config.files.push(file)

  const run1: Run = {
    globalId: 1,
    namespace,
    id: 1,
    status: RunStatus.Completed,
    overallResult: RunResult.Green,
    argoNamespace: 'arrrrrrgl',
    argoName: 'arrrrrrgl-42',
    argoId: randomUUID(),
    log: ['Worked great', 'Result: Green'],
    creationTime: new Date('02 Dec 2022 13:35:00 GMT'),
    completionTime: new Date('02 Dec 2022 13:35:45 GMT'),
    storagePath: randomUUID(),
    config,
  } as Run

  const createdRun: Run = {
    globalId: 2,
    namespace,
    id: 2,
    status: RunStatus.Running,
    creationTime: new Date('01 Dec 2022 12:25:00 GMT'),
    storagePath: randomUUID(),
    config,
  } as Run

  const mockedTotalCount = 1025

  function createListOf20Runs(): Run[] {
    const runList: Run[] = []
    const createRun = (id: number): Run => {
      const status = Object.values(RunStatus)[randomInt(3)]
      return {
        globalId: id,
        namespace,
        id,
        status,
        storagePath: randomUUID(),
        creationTime: new Date(Date.now()),
        argoNamespace: 'Arrrrgl22',
        config,
      } as Run
    }
    for (let i = 1; i <= 20; i++) {
      runList.push(createRun(i))
    }
    return runList
  }

  const run1ResultContent = 'qg-result.yaml content'
  const run1EvidenceContent = 'evidences.zip content'

  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [RunController],
      providers: [
        {
          provide: RunService,
          useValue: {
            getList: jest
              .fn()
              .mockImplementation(
                (nsid: number, queryHandler: ListQueryHandler) => {
                  if (nsid !== testingNamespaceId) {
                    throw new Error('Expect the Unexpected')
                  }
                  expect(queryHandler).toBeDefined()
                  return {
                    entities: createListOf20Runs(),
                    itemCount: mockedTotalCount,
                  }
                }
              ),
            get: jest.fn(),
            getResult: jest.fn(),
            getEvidence: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
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

    controller = module.get<RunController>(RunController)
    service = module.get<RunService>(RunService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('Get Detailed Run', () => {
    it('should receive a run resource properly', async () => {
      const srvSpy = jest.spyOn(service, 'get').mockResolvedValue(run1)
      const response = createMockResponse(
        `${baseUrl}/runs/${run1.id}`,
        testUser
      )

      const retrieved = await controller.get(
        testingNamespaceId,
        run1.id,
        response
      )

      expect(retrieved.id).toBe(run1.id)
      expect(retrieved.status).toBe(run1.status)
      expect(retrieved.overallResult).toBe(run1.overallResult)
      expect(retrieved.creationTime).toBe(run1.creationTime)
      expect(retrieved.completionTime).toBe(run1.completionTime)
      expect(retrieved.argoName).toBe(run1.argoName)
      expect(retrieved.argoNamespace).toBe(run1.argoNamespace)
      expect(retrieved.config).toBe(`${namespaceUrl}/configs/${config.id}`)

      expect(srvSpy).toBeCalledWith(testingNamespaceId, run1.id)
    })

    it('should throw a NotFoundException, if id is unknown on get', async () => {
      const srvSpy = jest
        .spyOn(service, 'get')
        .mockRejectedValue(new NotFoundException())
      const response = createMockResponse(
        `${baseUrl}/runs/${run1.id}`,
        testUser
      )

      await expect(
        controller.get(testingNamespaceId, run1.id + 1, response)
      ).rejects.toThrow(NotFoundException)

      expect(srvSpy).toBeCalledWith(testingNamespaceId, run1.id + 1)
    })
  })

  describe('Get Run Results', () => {
    it('should receive the results of a run properly', async () => {
      const srvSpy = jest
        .spyOn(service, 'getResult')
        .mockResolvedValue(Readable.from(run1ResultContent))
      const response = createMockResponse(
        `${baseUrl}/runs/${run1.id}/results`,
        testUser
      )
      const mockedReadStream = Readable.from([run1ResultContent])
      jest
        .spyOn(fs, 'createReadStream')
        .mockReturnValue(mockedReadStream as any)

      const retrieved = await controller.getResult(
        testingNamespaceId,
        run1.id,
        response
      )

      expect(response.header).toBeCalledWith('Content-Type', 'application/yaml')
      expect(response.header).toBeCalledWith(
        'Content-Disposition',
        `attachment; filename="${RESULTFILE}"`
      )
      expect(await streamToString(retrieved.getStream())).toBe(
        run1ResultContent
      )
      expect(srvSpy).toBeCalledWith(testingNamespaceId, run1.id)
    })

    it('should throw a NotFoundException, if id is unknown on getResult', async () => {
      const srvSpy = jest
        .spyOn(service, 'getResult')
        .mockRejectedValue(new NotFoundException())
      const response = createMockResponse(
        `${baseUrl}/runs/${run1.id}/results`,
        testUser
      )

      await expect(
        controller.getResult(testingNamespaceId, run1.id + 1, response)
      ).rejects.toThrow(NotFoundException)

      expect(srvSpy).toBeCalledWith(testingNamespaceId, run1.id + 1)
    })
  })

  describe('Get Evidence', () => {
    it('should receive the evidences of a run properly', async () => {
      const srvSpy = jest
        .spyOn(service, 'getEvidence')
        .mockResolvedValue(Readable.from(run1EvidenceContent))
      const response = createMockResponse(
        `${baseUrl}/runs/${run1.id}/evidences`,
        testUser
      )
      const mockedReadStream = Readable.from([run1EvidenceContent])
      jest
        .spyOn(fs, 'createReadStream')
        .mockReturnValue(mockedReadStream as any)

      const retrieved = await controller.getEvidence(
        testingNamespaceId,
        run1.id,
        response
      )

      expect(response.header).toBeCalledWith('Content-Type', 'application/zip')
      expect(response.header).toBeCalledWith(
        'Content-Disposition',
        `attachment; filename="${EVIDENCEFILE}"`
      )
      expect(await streamToString(retrieved.getStream())).toBe(
        run1EvidenceContent
      )
      expect(srvSpy).toBeCalledWith(testingNamespaceId, run1.id)
    })

    it('should throw a NotFoundException, if id is unknown on getEvidence', async () => {
      const srvSpy = jest
        .spyOn(service, 'getEvidence')
        .mockRejectedValue(new NotFoundException())
      const response = createMockResponse(
        `${baseUrl}/runs/${run1.id}/evidences`,
        testUser
      )

      await expect(
        controller.getEvidence(testingNamespaceId, run1.id + 1, response)
      ).rejects.toThrow(NotFoundException)

      expect(srvSpy).toBeCalledWith(testingNamespaceId, run1.id + 1)
    })
  })

  describe('Start Run', () => {
    it('should start a run properly', async () => {
      const srvSpy = jest.spyOn(service, 'create').mockResolvedValue(createdRun)
      const response = createMockResponse(`${baseUrl}/runs`, testUser)

      const run = await controller.create(
        testingNamespaceId,
        { configId: config.id },
        response
      )

      expect(response.status).toBeCalledWith(HttpStatus.ACCEPTED)
      expect(response.header).toBeCalledWith(
        'Location',
        `${mockRunsUrl}/${createdRun.id}`
      )
      expect(run.id).toBe(createdRun.id)
      expect(run.status).toBe(RunStatus.Running)
      expect(run.creationTime).toBe(createdRun.creationTime)
      expect(run.config).toBe(`${namespaceUrl}/configs/${config.id}`)

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        config.id,
        {
          id: '04f48c06-e016-42fa-8b53-98a58a976e12',
          username: 'TestUser',
          email: 'testuser@example.com',
          displayName: 'Test User',
        },
        {
          environment: {},
        }
      )
    })

    it('should throw a NotFoundException, if config is unknown on start run', async () => {
      const srvSpy = jest
        .spyOn(service, 'create')
        .mockRejectedValue(new NotFoundException())
      const response = createMockResponse(`${baseUrl}/runs`, testUser)

      await expect(
        controller.create(
          testingNamespaceId,
          { configId: config.id + 1 },
          response
        )
      ).rejects.toThrow(NotFoundException)

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        config.id + 1,
        {
          id: '04f48c06-e016-42fa-8b53-98a58a976e12',
          username: 'TestUser',
          email: 'testuser@example.com',
          displayName: 'Test User',
        },
        {
          environment: {},
        }
      )
    })

    it('should throw a BadRequestException, if data validation fails in service', async () => {
      const srvSpy = jest
        .spyOn(service, 'create')
        .mockRejectedValue(new BadRequestException())
      const response = createMockResponse(`${baseUrl}/runs`, testUser)

      await expect(
        controller.create(
          testingNamespaceId,
          {
            configId: config.id,
            environment: {
              ENV_KEY1: 'env-value1',
            },
          },
          response
        )
      ).rejects.toThrow(BadRequestException)

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        config.id,
        {
          id: '04f48c06-e016-42fa-8b53-98a58a976e12',
          username: 'TestUser',
          email: 'testuser@example.com',
          displayName: 'Test User',
        },
        {
          environment: {
            ENV_KEY1: 'env-value1',
          },
        }
      )
    })

    it('should start a run with environment variables', async () => {
      const srvSpy = jest.spyOn(service, 'create').mockResolvedValue(createdRun)
      const response = createMockResponse(`${baseUrl}/runs`, testUser)

      const run = await controller.create(
        testingNamespaceId,
        {
          configId: config.id,
          environment: { ENV_KEY1: 'env-value1', ENV_KEY2: 'env-value2' },
        },
        response
      )

      expect(response.status).toBeCalledWith(HttpStatus.ACCEPTED)
      expect(response.header).toBeCalledWith(
        'Location',
        `${mockRunsUrl}/${createdRun.id}`
      )
      expect(run.id).toBe(createdRun.id)
      expect(run.status).toBe(RunStatus.Running)
      expect(run.creationTime).toBe(createdRun.creationTime)
      expect(run.config).toBe(`${namespaceUrl}/configs/${config.id}`)
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        config.id,
        {
          id: '04f48c06-e016-42fa-8b53-98a58a976e12',
          username: 'TestUser',
          email: 'testuser@example.com',
          displayName: 'Test User',
        },
        {
          environment: {
            ENV_KEY1: 'env-value1',
            ENV_KEY2: 'env-value2',
          },
        }
      )
    })

    it('should start a run with the single check option selected', async () => {
      const srvSpy = jest.spyOn(service, 'create').mockResolvedValue(createdRun)
      const response = createMockResponse(`${baseUrl}/runs`, testUser)
      const singleCheck = { chapter: '1', requirement: '1', check: '1' }
      const run = await controller.create(
        testingNamespaceId,
        {
          configId: config.id,
          singleCheck,
        },
        response
      )

      expect(response.status).toBeCalledWith(HttpStatus.ACCEPTED)
      expect(response.header).toBeCalledWith(
        'Location',
        `${mockRunsUrl}/${createdRun.id}`
      )
      expect(run.id).toBe(createdRun.id)
      expect(run.status).toBe(RunStatus.Running)
      expect(run.creationTime).toBe(createdRun.creationTime)
      expect(run.config).toBe(`${namespaceUrl}/configs/${config.id}`)
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        config.id,
        {
          id: '04f48c06-e016-42fa-8b53-98a58a976e12',
          username: 'TestUser',
          email: 'testuser@example.com',
          displayName: 'Test User',
        },
        {
          environment: {},
          singleCheck,
        }
      )
    })

    it.each([
      { configId: 'somestring' },
      { configId: 0 },
      { configId: 2.5 },
      { configId: 1, environment: { ' ': 'content' } },
      { configId: 1, environment: { key: undefined } },
      { configId: 1, environment: { key: null } },
      { configId: 1, singleCheck: { requirement: '1', check: '1' } },
      {
        configId: 1,
        singleCheck: { chapter: 1, requirement: '1', check: '1' },
      },
      {
        configId: 1,
        singleCheck: { chapter: undefined, requirement: '1', check: '1' },
      },
      {
        configId: 1,
        singleCheck: { chapter: null, requirement: '1', check: '1' },
      },
      {
        configId: 1,
        singleCheck: { chapter: ' \t\n', requirement: '1', check: '1' },
      },
      { configId: 1, singleCheck: { chapter: '1', check: '1' } },
      {
        configId: 1,
        singleCheck: { chapter: '1', requirement: 1, check: '1' },
      },
      {
        configId: 1,
        singleCheck: { chapter: '1', requirement: undefined, check: '1' },
      },
      {
        configId: 1,
        singleCheck: { chapter: '1', requirement: null, check: '1' },
      },
      {
        configId: 1,
        singleCheck: { chapter: '1', requirement: ' \t\n', check: '1' },
      },
      { configId: 1, singleCheck: { chapter: '1', requirement: '1' } },
      {
        configId: 1,
        singleCheck: { chapter: '1', requirement: '1', check: 1 },
      },
      {
        configId: 1,
        singleCheck: { chapter: '1', requirement: '1', check: undefined },
      },
      {
        configId: 1,
        singleCheck: { chapter: '1', requirement: '1', check: null },
      },
      {
        configId: 1,
        singleCheck: { chapter: '1', requirement: '1', check: ' \t\n' },
      },
    ])(
      'should throw BadRequest Exception, in case of a misformed body',
      async (body: any) => {
        const response = createMockResponse(`${baseUrl}/runs`, testUser)

        await expect(
          controller.create(testingNamespaceId, body, response)
        ).rejects.toThrow(BadRequestException)

        expect(service.create).not.toBeCalled()
      }
    )
  })

  describe('Delete Run', () => {
    it('should return properly on delete', async () => {
      const response = createMockResponse(`${baseUrl}/runs`, testUser)
      await controller.delete(testingNamespaceId, run1.id, response)
      expect(service.delete).toBeCalledWith(testingNamespaceId, run1.id, {
        id: '04f48c06-e016-42fa-8b53-98a58a976e12',
        username: 'TestUser',
        email: 'testuser@example.com',
        displayName: 'Test User',
      })
    })
  })

  describe('Get Run List', () => {
    it('should return the list of runs given as proper paginated data', async () => {
      const srvSpy = jest.spyOn(service, 'getList').mockResolvedValue({
        entities: createListOf20Runs(),
        itemCount: mockedTotalCount,
      })
      const response = createMockResponse(`${baseUrl}/runs`, testUser)
      const retrieved = await controller.getRuns(
        testingNamespaceId,
        { page: 2, items: 20, sortOrder: SortOrder.ASC },
        response
      )

      expect(retrieved.pagination.pageNumber).toBe(2)
      expect(retrieved.pagination.pageSize).toBe(20)
      expect(retrieved.pagination.totalCount).toBe(mockedTotalCount)
      expect(retrieved.data.length).toBe(20)
      expect(retrieved.data[0].id).toBeDefined()
      expect(retrieved.data[0].status).toBeDefined()
      expect(retrieved.data[0].creationTime).toBeDefined()
      expect(retrieved.data[0].config).toBeDefined()
      expect(retrieved.links.first).toBe(
        `${mockRunsUrl}?page=1&items=20&sortOrder=ASC`
      )
      expect(retrieved.links.last).toBe(
        `${mockRunsUrl}?page=52&items=20&sortOrder=ASC`
      )
      expect(retrieved.links.prev).toBe(
        `${mockRunsUrl}?page=1&items=20&sortOrder=ASC`
      )
      expect(retrieved.links.next).toBe(
        `${mockRunsUrl}?page=3&items=20&sortOrder=ASC`
      )

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        toListQueryOptions(
          { page: 2, items: 20, sortOrder: SortOrder.ASC },
          queryOptionsSchema.strict(),
          [],
          'id'
        )
      )
    })

    it('should return the list of configs given as proper paginated data with partial default query options', async () => {
      const srvSpy = jest.spyOn(service, 'getList').mockResolvedValue({
        entities: createListOf20Runs(),
        itemCount: mockedTotalCount,
      })
      const response = createMockResponse(`${baseUrl}/runs`, testUser)
      const retrieved = await controller.getRuns(
        testingNamespaceId,
        {} as PaginationQueryOptions,
        response
      )

      expect(retrieved.pagination.pageNumber).toBe(1)
      expect(retrieved.pagination.pageSize).toBe(20)
      expect(retrieved.pagination.totalCount).toBe(mockedTotalCount)
      expect(retrieved.data.length).toBe(20)
      expect(retrieved.data[0].id).toBeDefined()
      expect(retrieved.data[0].status).toBeDefined()
      expect(retrieved.data[0].creationTime).toBeDefined()
      expect(retrieved.data[0].config).toBeDefined()
      expect(retrieved.links.first).toBe(`${mockRunsUrl}?page=1&items=20`)
      expect(retrieved.links.last).toBe(`${mockRunsUrl}?page=52&items=20`)
      expect(retrieved.links.prev).toBeFalsy()
      expect(retrieved.links.next).toBe(`${mockRunsUrl}?page=2&items=20`)

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        toListQueryOptions({}, queryOptionsSchema.strict(), [], 'id')
      )
    })

    it('should handle an empty list as expected', async () => {
      const srvSpy = jest
        .spyOn(service, 'getList')
        .mockResolvedValue({ entities: [], itemCount: 0 })

      const response = createMockResponse(`${baseUrl}/runs`, testUser)
      const retrieved = await controller.getRuns(
        testingNamespaceId,
        { items: 10 } as PaginationQueryOptions,
        response
      )

      expect(retrieved.pagination.pageNumber).toBe(1)
      expect(retrieved.pagination.pageSize).toBe(0)
      expect(retrieved.pagination.totalCount).toBe(0)
      expect(retrieved.data.length).toBe(0)
      expect(retrieved.links.first).toBe(`${mockRunsUrl}?page=1&items=10`)
      expect(retrieved.links.last).toBe(`${mockRunsUrl}?page=1&items=10`)
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

    it('should parse a filter option in query parameter', async () => {
      const srvSpy = jest.spyOn(service, 'getList').mockResolvedValue({
        entities: createListOf20Runs(),
        itemCount: mockedTotalCount,
      })
      const response = createMockResponse(`${baseUrl}/runs`, testUser)
      const retrieved = await controller.getRuns(
        testingNamespaceId,
        { filter: 'config=1,2' } as PaginationQueryOptions,
        response
      )

      expect(retrieved.pagination.pageNumber).toBe(1)
      expect(retrieved.pagination.pageSize).toBe(20)
      expect(retrieved.pagination.totalCount).toBe(mockedTotalCount)
      expect(retrieved.data.length).toBe(20)
      expect(retrieved.data[0].id).toBeDefined()
      expect(retrieved.data[0].status).toBeDefined()
      expect(retrieved.data[0].creationTime).toBeDefined()
      expect(retrieved.data[0].config).toBeDefined()
      expect(retrieved.links.first).toBe(`${mockRunsUrl}?page=1&items=20`)
      expect(retrieved.links.last).toBe(`${mockRunsUrl}?page=52&items=20`)
      expect(retrieved.links.prev).toBeFalsy()
      expect(retrieved.links.next).toBe(`${mockRunsUrl}?page=2&items=20`)

      const queryOptions = toListQueryOptions(
        {},
        queryOptionsSchema.strict(),
        [],
        'id'
      )
      queryOptions.additionalParams.filtering = [
        { property: 'config', values: ['1', '2'] } as FilterOption,
      ]
      expect(srvSpy).toBeCalledWith(testingNamespaceId, queryOptions)
    })

    it('should parse multiple filter option in query parameter', async () => {
      const srvSpy = jest.spyOn(service, 'getList').mockResolvedValue({
        entities: createListOf20Runs(),
        itemCount: mockedTotalCount,
      })
      const response = createMockResponse(`${baseUrl}/runs`, testUser)
      const retrieved = await controller.getRuns(
        testingNamespaceId,
        { filter: ['config=1,2', 'latestOnly=true'] } as PaginationQueryOptions,
        response
      )

      expect(retrieved.pagination.pageNumber).toBe(1)
      expect(retrieved.pagination.pageSize).toBe(20)
      expect(retrieved.pagination.totalCount).toBe(mockedTotalCount)
      expect(retrieved.data.length).toBe(20)
      expect(retrieved.data[0].id).toBeDefined()
      expect(retrieved.data[0].status).toBeDefined()
      expect(retrieved.data[0].creationTime).toBeDefined()
      expect(retrieved.data[0].config).toBeDefined()
      expect(retrieved.links.first).toBe(`${mockRunsUrl}?page=1&items=20`)
      expect(retrieved.links.last).toBe(`${mockRunsUrl}?page=52&items=20`)
      expect(retrieved.links.prev).toBeFalsy()
      expect(retrieved.links.next).toBe(`${mockRunsUrl}?page=2&items=20`)

      const queryOptions = toListQueryOptions(
        {},
        queryOptionsSchema.strict(),
        [],
        'id'
      )
      queryOptions.additionalParams.filtering = [
        { property: 'config', values: ['1', '2'] } as FilterOption,
        { property: 'latestOnly', values: ['true'] } as FilterOption,
      ]
      expect(srvSpy).toBeCalledWith(testingNamespaceId, queryOptions)
    })

    it('should not allow to sort for unallowed properties', async () => {
      const response = createMockResponse(`${baseUrl}/runs`, testUser)
      await expect(
        controller.getRuns(
          testingNamespaceId,
          { sortBy: 'column' } as PaginationQueryOptions,
          response
        )
      ).rejects.toThrow(BadRequestException)
    })
  })
})
