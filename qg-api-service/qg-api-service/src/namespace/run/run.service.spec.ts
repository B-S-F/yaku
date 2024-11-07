// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

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
import { AuditActor } from '../audit/audit.entity'

describe('RunService', () => {
  let service: RunService
  let auditService: RunAuditService
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

  const run = new Run()
  run.globalId = 1
  run.namespace = namespace
  run.id = 1
  run.status = RunStatus.Completed
  run.overallResult = RunResult.Green
  run.argoNamespace = 'arrrrrrgl'
  run.argoName = 'arrrrrrgl-42'
  run.argoId = randomUUID()
  run.log = ['Worked great', 'Result: Green']
  run.creationTime = new Date('02 Dec 2022 13:35:00 GMT')
  run.completionTime = new Date('02 Dec 2022 13:35:45 GMT')
  run.storagePath = randomUUID()
  run.synthetic = false
  run.config = config()

  const run2 = new Run()
  run2.globalId = 2
  run2.namespace = namespace
  run2.id = 2
  run2.status = RunStatus.Running
  run2.argoNamespace = 'arrrrrrgl'
  run2.argoName = 'arrrrrrgl-4711'
  run2.argoId = randomUUID()
  run2.creationTime = new Date('02 Dec 2022 13:35:00 GMT')
  run2.storagePath = randomUUID()
  run.synthetic = false
  run2.config = config()

  const actor = new RequestUser(
    '7341a294-7a51-4fdc-90c6-af58e6bea690',
    'actor',
    'actor',
    'actor',
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
    auditService = module.get<RunAuditService>(RunAuditService)
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
            },
          ),
        remove: jest.fn() as any,
        save: jest
          .fn()
          .mockImplementation(
            (entityClass: EntityTarget<Run>, run: Run, options: SaveOptions) =>
              run,
          ),
        update: jest.fn() as any,
        delete: jest.fn() as any,
        getRepository: jest.fn() as any,
      } as unknown as EntityManager,
    } as any
  })

  afterEach(() => jest.restoreAllMocks())

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
      filtered: boolean,
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
          synthetic: false,
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
      expect(querySpy).toHaveBeenCalledWith('runs')
      expect(queryBuilderMock.andWhereValue).toBeNull()
      expect(queryBuilderMock.getCount).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.getRawAndEntities).toHaveBeenCalledTimes(1)
      expect(listQueryHandler.addToQueryBuilder).toHaveBeenCalledWith(
        queryBuilderMock,
        'runs',
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
      expect(querySpy).toHaveBeenCalledWith('runs')
      expect(queryBuilderMock.andWhereValue).toEqual({
        condition: 'ConfigEntity.id IN (:...cids)',
        criteria: { cids: ['1'] },
      })
      expect(queryBuilderMock.getCount).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.getRawAndEntities).toHaveBeenCalledTimes(1)
      expect(listQueryHandler.addToQueryBuilder).toHaveBeenCalledWith(
        queryBuilderMock,
        'runs',
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
      expect(querySpy).toHaveBeenCalledWith('runs')
      expect(queryBuilderMock.andWhereValue).toEqual({
        condition: `runs.globalId IN (Foo Bar)`,
        criteria: undefined,
      })
      expect(queryBuilderMock.getCount).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.getRawAndEntities).toHaveBeenCalledTimes(1)
      expect(listQueryHandler.addToQueryBuilder).toHaveBeenCalledWith(
        queryBuilderMock,
        'runs',
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
          service.getList(testingNamespaceId, listQueryHandler),
        ).rejects.toThrow(BadRequestException)
        expect(queryBuilderMock.andWhereValue).toBeNull()
        expect(queryBuilderMock.getCount).not.toHaveBeenCalled()
        expect(queryBuilderMock.getRawAndEntities).not.toHaveBeenCalled()
      }
    })
  })

  describe('Get single run', () => {
    it('should return a completed run', async () => {
      const repoSpy = jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValue(run)

      const retrieved = await service.get(testingNamespaceId, run.id)

      expect(retrieved).toEqual(run)
      expect(repoSpy).toHaveBeenCalledWith(Run, {
        where: { namespace: { id: testingNamespaceId }, id: run.id },
        relations: ['config', 'namespace'],
      })
      expect(workflowManager.updateRunIfFinished).not.toHaveBeenCalled()
    })

    it('should throw NotFound if run is not available', async () => {
      const repoSpy = jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValue(null)

      await expect(service.get(testingNamespaceId, 666)).rejects.toThrow(
        NotFoundException,
      )

      expect(repoSpy).toHaveBeenCalledWith(Run, {
        where: { namespace: { id: testingNamespaceId }, id: 666 },
        relations: ['config', 'namespace'],
      })
      expect(workflowManager.updateRunIfFinished).not.toHaveBeenCalled()
    })

    it('should check for run if the run is still running', async () => {
      const repoSpy = jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValue(run2)
      const mgrSpy = jest
        .spyOn(workflowManager, 'updateRunIfFinished')
        .mockResolvedValue(run2)

      const retrieved = await service.get(testingNamespaceId, run2.id)

      expect(retrieved).toEqual(run2)
      expect(repoSpy).toHaveBeenCalledWith(Run, {
        where: { namespace: { id: testingNamespaceId }, id: run2.id },
        relations: ['config', 'namespace'],
      })
      expect(mgrSpy).toHaveBeenCalledWith(run2)
    })

    it('should handle an error in checking a running run by returning the retrieved database object', async () => {
      const repoSpy = jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValue(run2)
      const mgrSpy = jest
        .spyOn(workflowManager, 'updateRunIfFinished')
        .mockRejectedValue(new Error('Sad but failed'))

      const retrieved = await service.get(testingNamespaceId, run2.id)

      expect(retrieved).toEqual(run2)
      expect(repoSpy).toHaveBeenCalledWith(Run, {
        where: { namespace: { id: testingNamespaceId }, id: run2.id },
        relations: ['config', 'namespace'],
      })
      expect(mgrSpy).toHaveBeenCalledWith(run2)
    })

    it('should return after 2 seconds when updateRunIfFinished takes to long without update', async () => {
      const repoSpy = jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValue(run2)

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
      expect(repoSpy).toHaveBeenCalledWith(Run, {
        where: { namespace: { id: testingNamespaceId }, id: run2.id },
        relations: ['config', 'namespace'],
      })
      expect(mgrSpy).toHaveBeenCalledWith(run2)
      expect(logSpy).toHaveBeenCalledWith(
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
      const currentDate = new Date()
      const createWithTransactionSpy = jest
        .spyOn(service, 'createWithTransaction')
        .mockResolvedValue({
          ...run,
          id: 66,
          globalId: 4711,
          config: config(),
          status: RunStatus.Pending,
          creationTime: currentDate,
          overallResult: undefined,
          argoId: undefined,
          argoName: undefined,
          argoNamespace: undefined,
          log: undefined,
          completionTime: undefined,
        } as Run)

      const retrieved = await service.create(testingNamespaceId, 1, actor)

      expect(retrieved.config).toEqual(config())
      expect(retrieved.namespace).toEqual(namespace)
      expect(retrieved.storagePath).toBeDefined()
      expect(retrieved.status).toBe(RunStatus.Pending)
      expect(retrieved.creationTime).toEqual(currentDate)
      expect(retrieved.id).toBe(66)
      expect(retrieved.globalId).toBe(4711)
      expect(retrieved.overallResult).toBeUndefined()
      expect(retrieved.argoNamespace).toBeUndefined()
      expect(retrieved.argoName).toBeUndefined()
      expect(retrieved.argoId).toBeUndefined()
      expect(retrieved.log).toBeUndefined()
      expect(retrieved.completionTime).toBeUndefined()

      expect(createWithTransactionSpy).toHaveBeenCalledWith(
        queryRunner,
        namespace.id,
        config().id,
        actor
      )
      expect(workflowManager.run).toHaveBeenCalledWith(retrieved, {
        environment: {},
      })
      verifySuccessfullTransaction(queryRunner)
    })

    it(`should call the WorkflowManger with environment variables`, async () => {
      const currentDate = new Date()
      const createWithTransactionSpy = jest
        .spyOn(service, 'createWithTransaction')
        .mockResolvedValue({
          ...run,
          id: 66,
          globalId: 4711,
          config: config(),
          status: RunStatus.Pending,
          creationTime: currentDate,
          overallResult: undefined,
          argoId: undefined,
          argoName: undefined,
          argoNamespace: undefined,
          log: undefined,
          completionTime: undefined,
        } as Run)

      const envs: { [key: string]: string } = {
        TEST_KEY1: 'TEST_VALUE1',
        TEST_KEY2: 'TEST_VALUE2',
      }

      const retrieved = await service.create(testingNamespaceId, 1, actor, {
        environment: envs,
      })

      expect(createWithTransactionSpy).toHaveBeenCalledWith(
        queryRunner,
        namespace.id,
        config().id,
        actor
      )
      expect(workflowManager.run).toHaveBeenCalledWith(retrieved, {
        environment: {
          TEST_KEY1: 'TEST_VALUE1',
          TEST_KEY2: 'TEST_VALUE2',
        },
      })
      verifySuccessfullTransaction(queryRunner)
    })

    it('should call the workflow manager with a single check option', async () => {
      const currentDate = new Date()
      const createWithTransactionSpy = jest
        .spyOn(service, 'createWithTransaction')
        .mockResolvedValue({
          ...run,
          id: 66,
          globalId: 4711,
          config: config(),
          status: RunStatus.Pending,
          creationTime: currentDate,
          overallResult: undefined,
          argoId: undefined,
          argoName: undefined,
          argoNamespace: undefined,
          log: undefined,
          completionTime: undefined,
        } as Run)

      const options = {
        environment: {},
        singleCheck: { chapter: '1', requirement: '1', check: '1' },
      }
      const retrieved = await service.create(
        testingNamespaceId,
        1,
        actor,
        options,
      )

      expect(retrieved.config).toEqual(config())
      expect(retrieved.namespace).toEqual(namespace)
      expect(retrieved.storagePath).toBeDefined()
      expect(retrieved.status).toBe(RunStatus.Pending)
      expect(retrieved.creationTime).toEqual(currentDate)
      expect(retrieved.id).toBe(66)
      expect(retrieved.globalId).toBe(4711)
      expect(retrieved.overallResult).toBeUndefined()
      expect(retrieved.argoNamespace).toBeUndefined()
      expect(retrieved.argoName).toBeUndefined()
      expect(retrieved.argoId).toBeUndefined()
      expect(retrieved.log).toBeUndefined()
      expect(retrieved.completionTime).toBeUndefined()

      expect(createWithTransactionSpy).toHaveBeenCalledWith(
        queryRunner,
        namespace.id,
        config().id,
        actor
      )
      expect(workflowManager.run).toHaveBeenCalledWith(retrieved, options)
      verifySuccessfullTransaction(queryRunner)
    })

    it('should rollback the transaction if an error occurs', async () => {
      const createWithTransactionSpy = jest
        .spyOn(service, 'createWithTransaction')
        .mockRejectedValue(new Error())

      const result = service.create(namespace.id, config().id, actor)

      await expect(result).rejects.toThrow()
      expect(createWithTransactionSpy).toHaveBeenCalled()
      expect(workflowManager.run).not.toHaveBeenCalled()
      verifyFailedTransaction(queryRunner)
    })
  })

  describe('Create synthetic Run', () => {
    it('should create a synthetic Run', async () => {
      const creationTime = new Date()
      const createWithTransactionSpy = jest
        .spyOn(service, 'createWithTransaction')
        .mockResolvedValue({
          ...run,
          id: 66,
          globalId: 4711,
          config: config(),
          status: RunStatus.Pending,
          creationTime,
          overallResult: undefined,
          argoId: undefined,
          argoName: undefined,
          argoNamespace: undefined,
          log: undefined,
          completionTime: undefined,
        } as Run)
      const completionTime = new Date()
      const updateWithTransactionSpy = jest
        .spyOn(service, 'updateWithTransaction')
        .mockResolvedValue({
          ...run,
          id: 66,
          globalId: 4711,
          config: config(),
          synthetic: true,
          status: RunStatus.Completed,
          creationTime,
          overallResult: RunResult.Failed,
          argoId: undefined,
          argoName: undefined,
          argoNamespace: undefined,
          log: undefined,
          completionTime,
        } as Run)

      const result = await service.createSynthetic(
        namespace.id,
        config().id,
        actor
      )

      expect(result.config).toEqual(config())
      expect(result.namespace).toEqual(namespace)
      expect(result.storagePath).toBeDefined()
      expect(result.status).toBe(RunStatus.Completed)
      expect(result.creationTime).toEqual(creationTime)
      expect(result.id).toBe(66)
      expect(result.globalId).toBe(4711)
      expect(result.overallResult).toEqual(RunResult.Failed)
      expect(result.argoNamespace).toBeUndefined()
      expect(result.argoName).toBeUndefined()
      expect(result.argoId).toBeUndefined()
      expect(result.log).toBeUndefined()
      expect(result.completionTime).toEqual(completionTime)
      expect(createWithTransactionSpy).toHaveBeenCalledWith(
        queryRunner,
        namespace.id,
        config().id,
        actor
      )
      expect(updateWithTransactionSpy).toHaveBeenCalled()
      verifySuccessfullTransaction(queryRunner)
    })

    it('should rollback the transaction if an error occurs', async () => {
      const createWithTransactionSpy = jest
        .spyOn(service, 'createWithTransaction')
        .mockRejectedValue(new Error())

      const result = service.createSynthetic(namespace.id, config().id, actor)

      await expect(result).rejects.toThrow()
      expect(createWithTransactionSpy).toHaveBeenCalled()
      verifyFailedTransaction(queryRunner)
    })
  })

  describe('createWithTransaction', () => {
    let configsService: ConfigsService
    let idService: NamespaceLocalIdService

    beforeEach(() => {
      configsService = module.get<ConfigsService>(ConfigsService)
      idService = module.get<NamespaceLocalIdService>(NamespaceLocalIdService)
    })

    afterEach(() => jest.restoreAllMocks())

    it('should create a Run and an audit entry', async () => {
      const runWithoutData = run.DeepCopy()
      delete runWithoutData['globalId']
      delete runWithoutData['id']
      delete runWithoutData['creationTime']
      delete runWithoutData['status']
      delete runWithoutData['argoId']
      delete runWithoutData['argoName']
      delete runWithoutData['argoNamespace']
      delete runWithoutData['completionTime']
      delete runWithoutData['log']
      delete runWithoutData['overallResult']
      const creationTime = new Date()
      const expectedRun = new Run()
      expectedRun.creationTime = creationTime
      expectedRun.config = config()
      expectedRun.status = RunStatus.Pending
      expectedRun.namespace = namespace
      expectedRun.storagePath = randomUUID()
      expectedRun.synthetic = false

      const configsServiceSpy = jest
        .spyOn(configsService, 'getConfig')
        .mockResolvedValue(config())
      const idServiceSpy = jest.spyOn(idService, 'nextId').mockResolvedValue(1)
      const auditServiceSpy = jest.spyOn(auditService, 'append')
      const createSpy = jest
        .spyOn(queryRunner.manager, 'create')
        .mockImplementation(((
          entityClass: EntityTarget<Run>,
          run: DeepPartial<Run>
        ) => {
          return { ...run, creationTime } as Run
        }) as typeof queryRunner.manager.create)
      const saveSpy = jest
        .spyOn(queryRunner.manager, 'save')
        .mockImplementation((entityClass: EntityTarget<Run>, run: Run) => {
          return new Promise((resolve) => resolve({ ...run, globalId: 4711 }))
        })

      const result = await service.createWithTransaction(
        queryRunner,
        namespace.id,
        config().id,
        actor
      )

      expect(result).toEqual({
        ...expectedRun,
        id: 1,
        namespace: { id: 1 },
        globalId: 4711,
        storagePath: expect.anything(),
      })
      expect(configsServiceSpy).toHaveBeenCalled()
      expect(idServiceSpy).toHaveBeenCalled()
      expect(createSpy).toHaveBeenCalledWith(Run, {
        ...runWithoutData,
        namespace: { id: 1 },
        id: 1,
        creationTime: expect.anything(),
        status: RunStatus.Pending,
        storagePath: expect.anything(),
      })
      expect(saveSpy).toHaveBeenCalledWith(Run, {
        ...runWithoutData,
        namespace: { id: 1 },
        id: 1,
        status: RunStatus.Pending,
        creationTime,
        storagePath: expect.anything(),
      })
      expect(auditServiceSpy).toHaveBeenCalledWith(
        namespace.id,
        run.id,
        {},
        {
          ...runWithoutData,
          id: 1,
          namespace: { id: 1 },
          globalId: 4711,
          status: RunStatus.Pending,
          creationTime,
          storagePath: expect.anything(),
        },
        AuditActor.convertFrom(actor),
        'create',
        expect.anything()
      )
    })

    it('should throw NotFound error on a non-existing config', async () => {
      const configsServiceSpy = jest
        .spyOn(configsService, 'getConfig')
        .mockRejectedValue(new NotFoundException())
      const idServiceSpy = jest.spyOn(idService, 'nextId')
      const auditServiceSpy = jest.spyOn(auditService, 'append')
      const createSpy = jest.spyOn(queryRunner.manager, 'create')
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')

      await expect(
        service.create(testingNamespaceId, 1, actor),
      ).rejects.toThrow(NotFoundException)

      expect(configsServiceSpy).toHaveBeenCalledWith(testingNamespaceId, 1)
      expect(idServiceSpy).not.toHaveBeenCalled()
      expect(createSpy).not.toHaveBeenCalled()
      expect(saveSpy).not.toHaveBeenCalled()
      expect(auditServiceSpy).not.toHaveBeenCalled()
    })

    it('should throw an error if saving the run fails', async () => {
      const createSpy = jest.spyOn(queryRunner.manager, 'create')
      const saveSpy = jest
        .spyOn(queryRunner.manager, 'save')
        .mockRejectedValue(new Error('save error'))
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      const result = service.createWithTransaction(
        queryRunner,
        namespace.id,
        config().id,
        actor
      )

      await expect(result).rejects.toThrow('save error')
      expect(createSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalled()
      expect(auditServiceSpy).not.toHaveBeenCalled()
    })

    it('should throw an error if saving the audit entry fails', async () => {
      const createSpy = jest.spyOn(queryRunner.manager, 'create')
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      const auditServiceSpy = jest
        .spyOn(auditService, 'append')
        .mockRejectedValueOnce(new Error('AuditService append error'))

      const result = service.createWithTransaction(
        queryRunner,
        namespace.id,
        config().id,
        actor
      )

      await expect(result).rejects.toThrow('AuditService append error')
      expect(createSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalled()
      expect(auditServiceSpy).toHaveBeenCalled()
    })
  })

  describe('updateWithTransaction', () => {
    it('should update a Run and create an audit entry', async () => {
      const currentRun = run
      const originalRun = currentRun.DeepCopy()
      const updatedRun = {
        ...currentRun,
        status: RunStatus.Failed,
        completionTime: new Date(),
      } as Run

      const getWithTransactionSpy = jest
        .spyOn(service, 'getWithTransaction')
        .mockResolvedValueOnce(currentRun.DeepCopy())
      const saveSpy = jest
        .spyOn(queryRunner.manager, 'save')
        .mockResolvedValueOnce(updatedRun)
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      const result = await service.updateWithTransaction(
        queryRunner,
        namespace.id,
        currentRun.id,
        updatedRun,
        actor
      )

      expect(getWithTransactionSpy).toHaveBeenCalledWith(
        queryRunner,
        namespace.id,
        currentRun.id
      )
      expect(saveSpy).toHaveBeenCalledWith(Run, updatedRun)
      expect(auditServiceSpy).toHaveBeenCalledWith(
        originalRun.namespace.id,
        originalRun.id,
        originalRun,
        updatedRun,
        AuditActor.convertFrom(actor),
        'update',
        expect.anything()
      )
      expect(result).toStrictEqual(updatedRun)
    })

    it('should throw NotFound error on non-existing Run', async () => {
      const currentRun = run
      const updatedRun = {
        ...currentRun,
        status: RunStatus.Failed,
        completionTime: new Date(),
      } as Run
      const getWithTransactionSpy = jest
        .spyOn(service, 'getWithTransaction')
        .mockRejectedValue(new NotFoundException())
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      const result = service.updateWithTransaction(
        queryRunner,
        namespace.id,
        updatedRun.id,
        updatedRun,
        actor
      )

      await expect(result).rejects.toThrow(new NotFoundException())
      expect(getWithTransactionSpy).toHaveBeenCalledWith(
        queryRunner,
        namespace.id,
        currentRun.id
      )
      expect(saveSpy).not.toHaveBeenCalled()
      expect(auditServiceSpy).not.toHaveBeenCalled()
    })

    it('should throw an error if updating the run fails', async () => {
      const currentRun = run
      const updatedRun = {
        ...currentRun,
        status: RunStatus.Failed,
        completionTime: new Date(),
      } as Run
      const getWithTransactionSpy = jest
        .spyOn(service, 'getWithTransaction')
        .mockResolvedValueOnce(currentRun.DeepCopy())
      const saveSpy = jest
        .spyOn(queryRunner.manager, 'save')
        .mockRejectedValue(new Error('save error'))
      const auditServiceSpy = jest.spyOn(auditService, 'append')

      const result = service.updateWithTransaction(
        queryRunner,
        namespace.id,
        config().id,
        updatedRun,
        actor
      )

      await expect(result).rejects.toThrow('save error')
      expect(getWithTransactionSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalled()
      expect(auditServiceSpy).not.toHaveBeenCalled()
    })

    it('should throw an error if saving the audit entry fails', async () => {
      const currentRun = run
      const updatedRun = {
        ...currentRun,
        status: RunStatus.Failed,
        completionTime: new Date(),
      } as Run
      const getWithTransactionSpy = jest
        .spyOn(service, 'getWithTransaction')
        .mockResolvedValueOnce(currentRun.DeepCopy())
      const saveSpy = jest.spyOn(queryRunner.manager, 'save')
      const auditServiceSpy = jest
        .spyOn(auditService, 'append')
        .mockRejectedValueOnce(new Error('AuditService append error'))

      const result = service.updateWithTransaction(
        queryRunner,
        namespace.id,
        config().id,
        updatedRun,
        actor
      )

      await expect(result).rejects.toThrow('AuditService append error')
      expect(getWithTransactionSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalled()
      expect(auditServiceSpy).toHaveBeenCalled()
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
      expect(service.get).toHaveBeenCalledWith(testingNamespaceId, run.id)
      expect(workflowManager.downloadResult).toHaveBeenCalledWith(
        run.storagePath,
        'qg-result.yaml',
      )
    })

    it('should return the evidence file as expected', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run)
      jest
        .spyOn(workflowManager, 'downloadResult')
        .mockResolvedValue(Readable.from(content))

      const result = await service.getEvidence(testingNamespaceId, run.id)

      expect(await streamToString(result)).toBe(content)
      expect(service.get).toHaveBeenCalledWith(testingNamespaceId, run.id)
      expect(workflowManager.downloadResult).toHaveBeenCalledWith(
        run.storagePath,
        'evidences.zip',
      )
    })

    it('should throw BadRequest, if run is not completed', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run2)

      await expect(
        service.getResult(testingNamespaceId, run2.id),
      ).rejects.toThrow(BadRequestException)

      expect(service.get).toHaveBeenCalledWith(testingNamespaceId, run2.id)
      expect(workflowManager.downloadResult).not.toHaveBeenCalled()
    })
  })

  describe('Delete run', () => {
    it('should delete a run', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run)

      await service.delete(testingNamespaceId, run.id, actor)

      expect(workflowManager.deleteWorkflowArtifacts).toHaveBeenCalledWith(run)
      expect(queryRunner.manager.remove).toHaveBeenCalledWith(run)
    })

    it('should not do anything on unknown run', async () => {
      jest.spyOn(service, 'get').mockRejectedValue(new NotFoundException())

      await service.delete(testingNamespaceId, run.id, actor)

      expect(workflowManager.deleteWorkflowArtifacts).not.toHaveBeenCalled()
      expect(queryRunner.manager.remove).not.toHaveBeenCalled()
    })

    it('should throw BadRequest, if run is in state Running', async () => {
      jest.spyOn(service, 'get').mockResolvedValue(run2)

      await expect(
        service.delete(testingNamespaceId, run.id, actor),
      ).rejects.toThrow(BadRequestException)

      expect(workflowManager.deleteWorkflowArtifacts).not.toHaveBeenCalled()
      expect(queryRunner.manager.remove).not.toHaveBeenCalled()
    })

    it('should pass unexpected errors', async () => {
      jest.spyOn(service, 'get').mockRejectedValue(new Error())

      await expect(
        service.delete(testingNamespaceId, run.id, actor),
      ).rejects.toThrow()

      expect(workflowManager.deleteWorkflowArtifacts).not.toHaveBeenCalled()
      expect(queryRunner.manager.remove).not.toHaveBeenCalled()
    })
  })

  describe('getNamespaceCreatedCallback', () => {
    it('should return a function', () => {
      const callback = service.getNamespaceCreatedCallback()
      expect(typeof callback).toEqual('function')
    })

    it('should call the idService', () => {
      const idService = module.get<NamespaceLocalIdService>(
        NamespaceLocalIdService,
      )
      const callback = service.getNamespaceCreatedCallback()
      callback(1)
      expect(idService.initializeIdCreation).toHaveBeenCalledTimes(1)
      expect(idService.initializeIdCreation).toHaveBeenCalledWith('Run', 1)
    })
  })
})

function verifySuccessfullTransaction(queryRunner: QueryRunner) {
  expect(queryRunner.startTransaction).toHaveBeenCalled()
  expect(queryRunner.commitTransaction).toHaveBeenCalled()
  expect(queryRunner.release).toHaveBeenCalled()
  expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled()
}

function verifyFailedTransaction(queryRunner: QueryRunner) {
  expect(queryRunner.startTransaction).toHaveBeenCalled()
  expect(queryRunner.commitTransaction).not.toHaveBeenCalled()
  expect(queryRunner.release).toHaveBeenCalled()
  expect(queryRunner.rollbackTransaction).toHaveBeenCalled()
}
