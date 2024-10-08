import { streamToString } from '@B-S-F/api-commons-lib'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { randomInt, randomUUID } from 'crypto'
import { LoggerModule, PinoLogger } from 'nestjs-pino'
import { Readable } from 'stream'
import {
  DeepPartial,
  EntityManager,
  EntityTarget,
  QueryRunner,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
} from 'typeorm'
import { testingNamespaceId } from '@B-S-F/api-commons-lib'
import { ConfigEntity } from '../configs/config.entity'
import { ConfigsService } from '../configs/configs.service'
import { RequestUser } from '../module.utils'
import { NamespaceLocalIdService } from '../namespace/namespace-local-id.service'
import { Namespace } from '../namespace/namespace.entity'
import { WorkflowManager } from '../workflow/workflow-argo.service'
import { Run, RunAuditService, RunResult, RunStatus } from './run.entity'
import { RunService } from './run.service'

describe('RunService', () => {
  let service: RunService
  let workflowManager: WorkflowManager
  let repository: Repository<Run>
  let queryRunner: QueryRunner

  let module: TestingModule

  const namespace: Namespace = { id: testingNamespaceId, name: '' }

  const config = () => {
    const config = new ConfigEntity()
    config.globalId = 1
    config.namespace = namespace
    config.id = 1
    config.name = 'The Config'
    config.files = []
    return config
  }

  const run: Run = {
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
    config: config(),
  } as Run

  const run2: Run = {
    globalId: 2,
    namespace,
    id: 2,
    status: RunStatus.Running,
    argoNamespace: 'arrrrrrgl',
    argoName: 'arrrrrrgl-4711',
    argoId: randomUUID(),
    creationTime: new Date('02 Dec 2022 13:35:00 GMT'),
    storagePath: randomUUID(),
    config: config(),
  } as Run

  const actor = new RequestUser(
    '7341a294-7a51-4fdc-90c6-af58e6bea690',
    'actor',
    'actor',
    'actor'
  )

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        RunService,
        {
          provide: ConfigsService,
          useValue: {
            getConfig: jest.fn(),
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
          provide: WorkflowManager,
          useValue: {
            run: jest.fn(),
            updateRunIfFinished: jest.fn(),
            downloadResult: jest.fn(),
            deleteWorkflowArtifacts: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Run),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            manager: {
              connection: {
                createQueryRunner: jest.fn(() => queryRunner),
              },
            },
          },
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), error: jest.fn(), trace: jest.fn() },
        },
        {
          provide: RunAuditService,
          useValue: {
            append: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<RunService>(RunService)
    workflowManager = module.get<WorkflowManager>(WorkflowManager)
    repository = module.get(getRepositoryToken(Run))
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOneOrFail: jest.fn() as any,
        findOne: jest.fn() as any,
        create: jest
          .fn()
          .mockImplementation(
            (entityClass: EntityTarget<Run>, run: DeepPartial<Run>) => {
              return { ...run, globalId: 4711, namespace } as Run
            }
          ),
        remove: jest.fn() as any,
        save: jest
          .fn()
          .mockImplementation(
            (entityClass: EntityTarget<Run>, run: Run, options: SaveOptions) =>
              run
          ),
        update: jest.fn() as any,
        delete: jest.fn() as any,
        getRepository: jest.fn() as any,
      } as unknown as EntityManager,
    } as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('Get list of runs', () => {
    const config2: ConfigEntity = {
      globalId: 1,
      namespace,
      id: 2,
      name: 'The other Config',
      files: [],
    } as ConfigEntity

    const queryBuilderMock = {
      andWhereValue: null,

      leftJoinAndSelect() {
        return this
      },
      where() {
        return this
      },
      select() {
        return this
      },
      groupBy() {
        return this
      },
      andWhere(condition: string, criteria: any[]) {
        this.andWhereValue = { condition, criteria }
        return this
      },
      getQuery: jest.fn(),
      getCount: jest.fn(),
      getRawAndEntities: jest.fn(),
    }

    function mockQueryBuilder(
      itemCount: number,
      entities: Run[],
      filtered: boolean
    ) {
      return jest
        .spyOn(repository, 'createQueryBuilder')
        .mockImplementation(() => {
          const mock = queryBuilderMock
          mock.getCount = jest.fn().mockResolvedValue(itemCount)
          mock.getRawAndEntities = jest.fn().mockImplementation(async () => {
            if (filtered) {
              return {
                entities: entities.filter((item) => item.config.id === 1),
              }
            } else {
              return { entities }
            }
          })
          mock.getQuery = jest.fn().mockReturnValue('Foo Bar')
          return mock as unknown as SelectQueryBuilder<Run>
        })
    }

    function createListOf20Runs(): Run[] {
      const runList: Run[] = []
      const createRun = (id: number): Run => {
        const status = Object.values(RunStatus)[randomInt(3)]
        const currentConf = id % 4 ? config() : config2
        return {
          globalId: id,
          namespace,
          id,
          status,
          storagePath: randomUUID(),
          creationTime: new Date(Date.now()),
          argoNamespace: 'Arrrrgl22',
          config: currentConf,
        } as Run
      }
      for (let i = 1; i <= 20; i++) {
        runList.push(createRun(i))
      }
      return runList
    }

    afterEach(() => {
      queryBuilderMock.andWhereValue = null
    })

    it('should return a list of runs', async () => {
      const entities = createListOf20Runs()
      const querySpy = mockQueryBuilder(100, entities, false)
      const listQueryHandler: any = {
        sortBy: 'id',
        additionalParams: {},
        addToQueryBuilder: jest.fn(),
      }

      const result = await service.getList(testingNamespaceId, listQueryHandler)

      expect(result.itemCount).toBe(100)
      expect(result.entities).toEqual(entities)
      expect(querySpy).toBeCalledWith('runs')
      expect(queryBuilderMock.andWhereValue).toBeNull()
      expect(queryBuilderMock.getCount).toBeCalledTimes(1)
      expect(queryBuilderMock.getRawAndEntities).toBeCalledTimes(1)
      expect(listQueryHandler.addToQueryBuilder).toBeCalledWith(
        queryBuilderMock,
        'runs'
      )
    })

    it('should allow to filter for configs', async () => {
      const entities = createListOf20Runs()
      const querySpy = mockQueryBuilder(100, entities, true)
      const listQueryHandler: any = {
        sortBy: 'id',
        additionalParams: {
          filtering: [{ property: 'config', values: ['1'] }],
        },
        addToQueryBuilder: jest.fn(),
      }

      const result = await service.getList(testingNamespaceId, listQueryHandler)

      expect(result.itemCount).toBe(100)
      expect(result.entities.length).toEqual(15)
      expect(querySpy).toBeCalledWith('runs')
      expect(queryBuilderMock.andWhereValue).toEqual({
        condition: 'ConfigEntity.id IN (:...cids)',
        criteria: { cids: ['1'] },
      })
      expect(queryBuilderMock.getCount).toBeCalledTimes(1)
      expect(queryBuilderMock.getRawAndEntities).toBeCalledTimes(1)
      expect(listQueryHandler.addToQueryBuilder).toBeCalledWith(
        queryBuilderMock,
        'runs'
      )
    })

    it('should allow to filter with latestOnly option', async () => {
      const entities = createListOf20Runs()
      const querySpy = mockQueryBuilder(100, entities, true)
      const listQueryHandler: any = {
        sortBy: 'id',
        additionalParams: {
          filtering: [{ property: 'latestOnly', values: ['true'] }],
        },
        addToQueryBuilder: jest.fn(),
      }

      const result = await service.getList(testingNamespaceId, listQueryHandler)

      expect(result.itemCount).toBe(100)
      expect(result.entities.length).toEqual(15)
      expect(querySpy).toBeCalledWith('runs')
      expect(queryBuilderMock.andWhereValue).toEqual({
        condition: `runs.globalId IN (Foo Bar)`,
        criteria: undefined,
      })
      expect(queryBuilderMock.getCount).toBeCalledTimes(1)
      expect(queryBuilderMock.getRawAndEntities).toBeCalledTimes(1)
      expect(listQueryHandler.addToQueryBuilder).toBeCalledWith(
        queryBuilderMock,
        'runs'
      )
    })

    it('should not allow to filter for other properties', async () => {
      mockQueryBuilder(100, [], true)
      const props = Object.keys(run).filter((key) => key !== 'config')
      for (const prop of props) {
        const listQueryHandler: any = {
          sortBy: 'id',
          additionalParams: {
            filtering: [{ property: prop, values: ['dummy'] }],
          },
          addToQueryBuilder: jest.fn(),
        }
        await expect(
          service.getList(testingNamespaceId, listQueryHandler)
        ).rejects.toThrow(BadRequestException)
        expect(queryBuilderMock.andWhereValue).toBeNull()
        expect(queryBuilderMock.getCount).not.toBeCalled()
        expect(queryBuilderMock.getRawAndEntities).not.toBeCalled()
      }
    })
  })

  describe('Get single run', () => {
    it('should return a completed run', async () => {
      const repoSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(run)

      const retrieved = await service.get(testingNamespaceId, run.id)

      expect(retrieved).toEqual(run)
      expect(repoSpy).toBeCalledWith({
        where: { namespace: { id: testingNamespaceId }, id: run.id },
        relations: ['config', 'namespace'],
      })
      expect(workflowManager.updateRunIfFinished).not.toBeCalled()
    })

    it('should throw NotFound if run is not available', async () => {
      const repoSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(null)

      await expect(service.get(testingNamespaceId, 666)).rejects.toThrow(
        NotFoundException
      )

      expect(repoSpy).toBeCalledWith({
        where: { namespace: { id: testingNamespaceId }, id: 666 },
        relations: ['config', 'namespace'],
      })
      expect(workflowManager.updateRunIfFinished).not.toBeCalled()
    })

    it('should check for run if the run is still running', async () => {
      const repoSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(run2)
      const mgrSpy = jest
        .spyOn(workflowManager, 'updateRunIfFinished')
        .mockResolvedValue(run2)

      const retrieved = await service.get(testingNamespaceId, run2.id)

      expect(retrieved).toEqual(run2)
      expect(repoSpy).toBeCalledWith({
        where: { namespace: { id: testingNamespaceId }, id: run2.id },
        relations: ['config', 'namespace'],
      })
      expect(mgrSpy).toBeCalledWith(run2)
    })

    it('should handle an error in checking a running run by returning the retrieved database object', async () => {
      const repoSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(run2)
      const mgrSpy = jest
        .spyOn(workflowManager, 'updateRunIfFinished')
        .mockRejectedValue(new Error('Sad but failed'))

      const retrieved = await service.get(testingNamespaceId, run2.id)

      expect(retrieved).toEqual(run2)
      expect(repoSpy).toBeCalledWith({
        where: { namespace: { id: testingNamespaceId }, id: run2.id },
        relations: ['config', 'namespace'],
      })
      expect(mgrSpy).toBeCalledWith(run2)
    })

    it('should return after 2 seconds when updateRunIfFinished takes to long without update', async () => {
      const repoSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(run2)

      let timeout: any
      const workPromise: (run: Run) => Promise<Run> = (run2: Run) =>
        new Promise((resolve, _) => {
          timeout = setTimeout(() => resolve(run2), 3000)
          return timeout
        })

      const mgrSpy = jest
        .spyOn(workflowManager, 'updateRunIfFinished')
        .mockImplementation(workPromise)

      const logSpy = (service['logger']['warn'] = jest.fn())

      const retrieved = await service.get(testingNamespaceId, run2.id)

      expect(retrieved).toEqual(run2)
      expect(repoSpy).toBeCalledWith({
        where: { namespace: { id: testingNamespaceId }, id: run2.id },
        relations: ['config', 'namespace'],
      })
      expect(mgrSpy).toBeCalledWith(run2)
      expect(logSpy).toBeCalledWith(
        'Could not check workflow state for run 2 (1:2), error was Error: Timeout'
      )
    })
  })

  describe('Create Run', () => {
    let configsService: ConfigsService
    let idService: NamespaceLocalIdService

    beforeEach(() => {
      jest.useFakeTimers()
      configsService = module.get<ConfigsService>(ConfigsService)
      idService = module.get<NamespaceLocalIdService>(NamespaceLocalIdService)
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should create the run as expected', async () => {
      const cfgMock = jest
        .spyOn(configsService, 'getConfig')
        .mockResolvedValue(config())
      const idMock = jest.spyOn(idService, 'nextId').mockResolvedValue(66)

      const retrieved = await service.create(testingNamespaceId, 1, actor)

      expect(retrieved.config).toEqual(config())
      expect(retrieved.namespace).toEqual(namespace)
      expect(retrieved.storagePath).toBeDefined()
      expect(retrieved.status).toBe(RunStatus.Pending)
      expect(retrieved.creationTime).toEqual(new Date())
      expect(retrieved.id).toBe(66)
      expect(retrieved.globalId).toBe(4711)
      expect(retrieved.overallResult).toBeUndefined()
      expect(retrieved.argoNamespace).toBeUndefined()
      expect(retrieved.argoName).toBeUndefined()
      expect(retrieved.argoId).toBeUndefined()
      expect(retrieved.log).toBeUndefined()
      expect(retrieved.completionTime).toBeUndefined()

      expect(cfgMock).toBeCalledWith(testingNamespaceId, 1)
      expect(idMock).toBeCalled()
      expect(queryRunner.manager.create).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, retrieved)
      expect(workflowManager.run).toBeCalledWith(retrieved, { environment: {} })
    })

    it(`should call the WorkflowManger with environment variables`, async () => {
      const cfgMock = jest
        .spyOn(configsService, 'getConfig')
        .mockResolvedValue(config())
      const idMock = jest.spyOn(idService, 'nextId').mockResolvedValue(66)

      const envs: { [key: string]: string } = {
        TEST_KEY1: 'TEST_VALUE1',
        TEST_KEY2: 'TEST_VALUE2',
      }

      const retrieved = await service.create(testingNamespaceId, 1, actor, {
        environment: envs,
      })

      expect(cfgMock).toBeCalledWith(testingNamespaceId, 1)
      expect(idMock).toBeCalled()
      expect(queryRunner.manager.create).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, retrieved)
      expect(workflowManager.run).toBeCalledWith(retrieved, {
        environment: {
          TEST_KEY1: 'TEST_VALUE1',
          TEST_KEY2: 'TEST_VALUE2',
        },
      })
    })

    it('should call the workflow manager with a single check option', async () => {
      const cfgMock = jest
        .spyOn(configsService, 'getConfig')
        .mockResolvedValue(config())
      const idMock = jest.spyOn(idService, 'nextId').mockResolvedValue(66)

      const options = {
        environment: {},
        singleCheck: { chapter: '1', requirement: '1', check: '1' },
      }
      const retrieved = await service.create(
        testingNamespaceId,
        1,
        actor,
        options
      )

      expect(retrieved.config).toEqual(config())
      expect(retrieved.namespace).toEqual(namespace)
      expect(retrieved.storagePath).toBeDefined()
      expect(retrieved.status).toBe(RunStatus.Pending)
      expect(retrieved.creationTime).toEqual(new Date())
      expect(retrieved.id).toBe(66)
      expect(retrieved.globalId).toBe(4711)
      expect(retrieved.overallResult).toBeUndefined()
      expect(retrieved.argoNamespace).toBeUndefined()
      expect(retrieved.argoName).toBeUndefined()
      expect(retrieved.argoId).toBeUndefined()
      expect(retrieved.log).toBeUndefined()
      expect(retrieved.completionTime).toBeUndefined()

      expect(cfgMock).toBeCalledWith(testingNamespaceId, 1)
      expect(idMock).toBeCalled()
      expect(queryRunner.manager.create).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, retrieved)
      expect(workflowManager.run).toBeCalledWith(retrieved, options)
    })

    it('should throw NotFound on a non-existing config', async () => {
      const cfgMock = jest
        .spyOn(configsService, 'getConfig')
        .mockRejectedValue(new NotFoundException())

      await expect(
        service.create(testingNamespaceId, 1, actor)
      ).rejects.toThrow(NotFoundException)

      expect(cfgMock).toBeCalledWith(testingNamespaceId, 1)
      expect(idService.nextId).not.toBeCalled()
      expect(queryRunner.manager.create).not.toBeCalled()
      expect(queryRunner.manager.save).not.toBeCalled()
      expect(workflowManager.run).not.toBeCalled()
    })
  })

  describe('Get results from run', () => {
    const content = 'Great result content'

    it('should return the result file as expected', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run)
      jest
        .spyOn(workflowManager, 'downloadResult')
        .mockResolvedValue(Readable.from(content))

      const result = await service.getResult(testingNamespaceId, run.id)

      expect(await streamToString(result)).toBe(content)
      expect(service.get).toBeCalledWith(testingNamespaceId, run.id)
      expect(workflowManager.downloadResult).toBeCalledWith(
        run.storagePath,
        'qg-result.yaml'
      )
    })

    it('should return the evidence file as expected', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run)
      jest
        .spyOn(workflowManager, 'downloadResult')
        .mockResolvedValue(Readable.from(content))

      const result = await service.getEvidence(testingNamespaceId, run.id)

      expect(await streamToString(result)).toBe(content)
      expect(service.get).toBeCalledWith(testingNamespaceId, run.id)
      expect(workflowManager.downloadResult).toBeCalledWith(
        run.storagePath,
        'evidences.zip'
      )
    })

    it('should throw BadRequest, if run is not completed', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run2)

      await expect(
        service.getResult(testingNamespaceId, run2.id)
      ).rejects.toThrow(BadRequestException)

      expect(service.get).toBeCalledWith(testingNamespaceId, run2.id)
      expect(workflowManager.downloadResult).not.toBeCalled()
    })
  })

  describe('Delete run', () => {
    it('should delete a run', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run)

      await service.delete(testingNamespaceId, run.id, actor)

      expect(workflowManager.deleteWorkflowArtifacts).toBeCalledWith(run)
      expect(queryRunner.manager.remove).toBeCalledWith(run)
    })

    it('should not do anything on unknown run', async () => {
      jest.spyOn(service, 'get').mockRejectedValue(new NotFoundException())

      await service.delete(testingNamespaceId, run.id, actor)

      expect(workflowManager.deleteWorkflowArtifacts).not.toBeCalled()
      expect(queryRunner.manager.remove).not.toBeCalled()
    })

    it('should throw BadRequest, if run is in state Running', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run2)

      await expect(
        service.delete(testingNamespaceId, run.id, actor)
      ).rejects.toThrow(BadRequestException)

      expect(workflowManager.deleteWorkflowArtifacts).not.toBeCalled()
      expect(queryRunner.manager.remove).not.toBeCalled()
    })

    it('should pass unexpected errors', async () => {
      jest.spyOn(service, 'get').mockRejectedValue(new Error())

      await expect(
        service.delete(testingNamespaceId, run.id, actor)
      ).rejects.toThrow()

      expect(workflowManager.deleteWorkflowArtifacts).not.toBeCalled()
      expect(queryRunner.manager.remove).not.toBeCalled()
    })
  })

  describe('getNamespaceCreatedCallback', () => {
    it('should return a function', () => {
      const callback = service.getNamespaceCreatedCallback()
      expect(typeof callback).toEqual('function')
    })

    it('should call the idService', () => {
      const idService = module.get<NamespaceLocalIdService>(
        NamespaceLocalIdService
      )
      const callback = service.getNamespaceCreatedCallback()
      callback(1)
      expect(idService.initializeIdCreation).toBeCalledTimes(1)
      expect(idService.initializeIdCreation).toBeCalledWith('Run', 1)
    })
  })
})
