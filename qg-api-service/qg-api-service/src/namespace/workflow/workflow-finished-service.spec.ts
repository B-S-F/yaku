import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { LoggerModule, PinoLogger } from 'nestjs-pino'
import { Readable } from 'stream'
import { EntityManager, QueryRunner, Repository } from 'typeorm'
import { stringify } from 'yaml'
import { Finding } from '../findings/entity/finding.entity'
import { FindingService } from '../findings/finding.service'
import { Metric } from '../metrics/entity/metric.entity'
import { MetricService } from '../metrics/metric.service'
import { Run, RunAuditService, RunResult, RunStatus } from '../run/run.entity'
import { EVIDENCEFILE, RESULTFILE } from '../run/run.service'
import { SecretStorage } from '../secret/secret-storage.service'
import { ArgoService } from './argo.service'
import { BlobStore } from './minio.service'
import {
  WorkflowFinishConfig,
  WorkflowFinishedService,
} from './workflow-finished-service'
import { UsersService } from '../users/users.service'
jest.mock('timers/promises')

describe('WorkflowFinishedService', () => {
  let moduleRef: TestingModule

  let testee: WorkflowFinishedService
  let workflowFinishConfig: WorkflowFinishConfig
  let findingService: FindingService
  let runRepository: Repository<Run>
  let findingRepository: Repository<Finding>
  let metricRepository: Repository<Metric>
  let argoService: ArgoService
  let blobStore: BlobStore
  let secretStorage: SecretStorage
  let queryRunner: QueryRunner

  let currentRun: Run
  let savedRun: Run

  const workflowId = 'fb9e9b17-a8c6-4668-a97e-3ea09d4637af'
  const workflowName = 'a9e23689-3822-41c6-a330-14c43a8fd73e'
  const workflowNamespace = 'b8c5fdbf-caa4-4285-ba24-f6f45bc2a387'

  const runningStatus = { phase: 'Running' }
  const pendingStatus = { phase: 'Pending' }
  const succeededStatus = {
    phase: 'Succeeded',
    finishedAt: '2023-01-23 17:28:22.000Z',
  }
  const failedStatus = {
    phase: 'Failed',
    finishedAt: '2023-01-23 17:29:22.000Z',
  }
  const errorStatus = { phase: 'Error' }

  const loggedRun =
    'Nice log line\nOverall QG assessment status: YELLOW\nAnother end line'
  const loggedArgoRun =
    '{"result":{"content":"Nice log line","podName":"dummy"}}\n{"result":{"content":"Overall QG assessment status: YELLOW","podName":"dummy"}}\n{"result":{"content":"Another end line","podName":"bla"}}'

  const loggedArgoNotMain =
    '{"result":{"content":"time="2023-06-20T09:09:47.269Z" level=info msg="Starting deadline monitor"","podName":"qg-run-qjs42-autopilot-1885314906"}}'
  const loggedArgoNotMainError =
    '{"result":{"content":"time="2023-06-20T09:09:47.269Z" level=error msg="Starting deadline monitor"","podName":"qg-run-qjs42-autopilot-1885314906"}}'
  const loggedArgoKnownError =
    '{"result":{"content":"time="2023-06-20T09:09:47.269Z" level=fatal msg="exec /bin/argoexec: argument list too long"","podName":"qg-run-qjs42-autopilot-1885314906"}}'

  const loggedRunWithSecrets =
    'Nice log line\nOverall QG assessment status: YELLOW\nAnother end line\nSecret1: secret1\nSecret2: secret2'
  const loggedRunWithSecretsHidden =
    'Nice log line\nOverall QG assessment status: YELLOW\nAnother end line\nSecret1: ***Secret1***\nSecret2: ***Secret2***'

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        WorkflowFinishedService,
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
          provide: ArgoService,
          useValue: {
            getWorkflowStatus: jest.fn(),
            getArchivedWorkflowStatus: jest.fn(),
            getWorkflowLogs: jest.fn(),
          },
        },
        {
          provide: WorkflowFinishConfig,
          useFactory: () => new WorkflowFinishConfig(100, false),
        },
        {
          provide: BlobStore,
          useValue: {
            downloadLogs: jest.fn(),
            downloadResult: jest.fn(),
            fileExists: jest.fn(),
            streamToString: jest.fn(),
          },
        },
        {
          provide: SecretStorage,
          useValue: {
            getSecrets: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Run),
          useValue: {
            manager: {
              connection: {
                createQueryRunner: jest.fn(() => queryRunner),
              },
            },
          },
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

    testee = moduleRef.get<WorkflowFinishedService>(WorkflowFinishedService)
    workflowFinishConfig =
      moduleRef.get<WorkflowFinishConfig>(WorkflowFinishConfig)
    findingService = moduleRef.get<FindingService>(FindingService)
    findingRepository = moduleRef.get(getRepositoryToken(Finding))
    metricRepository = moduleRef.get(getRepositoryToken(Metric))
    argoService = moduleRef.get<ArgoService>(ArgoService)
    blobStore = moduleRef.get<BlobStore>(BlobStore)
    secretStorage = moduleRef.get<SecretStorage>(SecretStorage)
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOneOrFail: jest.fn() as any,
        findOne: jest.fn() as any,
        save: jest
          .fn()
          .mockImplementation(async (entity: Run): Promise<Run> => {
            savedRun = entity
            return entity
          }) as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        getRepository: jest.fn() as any,
      } as EntityManager,
    } as any
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Check finish status of workflow', () => {
    it('should work for a running workflow', async () => {
      jest
        .spyOn(argoService, 'getWorkflowStatus')
        .mockResolvedValue(runningStatus)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getWorkflowStatus).toBeCalledWith(
        workflowName,
        workflowNamespace
      )
      expect(received.hasFinished).toBeFalsy()
      expect(received.status).toBeUndefined()
    })

    it('should work for a pending workflow', async () => {
      jest
        .spyOn(argoService, 'getWorkflowStatus')
        .mockResolvedValue(pendingStatus)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getWorkflowStatus).toBeCalledWith(
        workflowName,
        workflowNamespace
      )
      expect(received.hasFinished).toBeFalsy()
      expect(received.status).toBeUndefined()
    })

    it('should work for a succeeded workflow not archived', async () => {
      jest
        .spyOn(argoService, 'getWorkflowStatus')
        .mockResolvedValue(succeededStatus)
      jest.spyOn(blobStore, 'downloadLogs').mockResolvedValue(undefined)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getWorkflowStatus).toBeCalledWith(
        workflowName,
        workflowNamespace
      )
      expect(received.hasFinished).toBeTruthy()
      expect(received.status).toBe(succeededStatus)
    })

    it('should work for a succeeded workflow not archived', async () => {
      jest
        .spyOn(argoService, 'getWorkflowStatus')
        .mockResolvedValue(succeededStatus)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getWorkflowStatus).toBeCalledWith(
        workflowName,
        workflowNamespace
      )
      expect(received.hasFinished).toBeTruthy()
      expect(received.status).toBe(succeededStatus)
    })

    it('should work a failed workflow already archived', async () => {
      jest.spyOn(argoService, 'getWorkflowStatus').mockResolvedValue(null)
      jest
        .spyOn(argoService, 'getArchivedWorkflowStatus')
        .mockResolvedValue(failedStatus)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getArchivedWorkflowStatus).toBeCalledWith(workflowId)
      expect(received.hasFinished).toBeTruthy()
      expect(received.status).toBe(failedStatus)
    })

    it('should work for a failed workflow without logs', async () => {
      jest.spyOn(argoService, 'getWorkflowStatus').mockResolvedValue(null)
      jest
        .spyOn(argoService, 'getArchivedWorkflowStatus')
        .mockResolvedValue(failedStatus)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getWorkflowStatus).toBeCalledWith(
        workflowName,
        workflowNamespace
      )
      expect(argoService.getArchivedWorkflowStatus).toBeCalledWith(workflowId)
      expect(received.hasFinished).toBeTruthy()
      expect(received.status).toBe(failedStatus)
    })

    it('should work for a erroneous workflow', async () => {
      jest.spyOn(argoService, 'getWorkflowStatus').mockResolvedValue(undefined)
      jest
        .spyOn(argoService, 'getArchivedWorkflowStatus')
        .mockResolvedValue(errorStatus)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getWorkflowStatus).toBeCalledWith(
        workflowName,
        workflowNamespace
      )
      expect(argoService.getArchivedWorkflowStatus).toBeCalledWith(workflowId)
      expect(received.hasFinished).toBeTruthy()
      expect(received.status).toBe(errorStatus)
    })

    it('should work if an error happens during getWorkflowStatus', async () => {
      jest
        .spyOn(argoService, 'getWorkflowStatus')
        .mockRejectedValue(new TypeError('fetch failed'))
      jest
        .spyOn(argoService, 'getArchivedWorkflowStatus')
        .mockResolvedValue(undefined)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getWorkflowStatus).toBeCalledWith(
        workflowName,
        workflowNamespace
      )
      expect(argoService.getArchivedWorkflowStatus).toBeCalled()
      expect(received.hasFinished).toBeFalsy()
      expect(received.status).toBeUndefined()
    })

    it('should work if an error happens during getArchivedWorkflowStatus', async () => {
      jest.spyOn(argoService, 'getWorkflowStatus').mockResolvedValue(undefined)
      jest
        .spyOn(argoService, 'getArchivedWorkflowStatus')
        .mockRejectedValue(new TypeError('fetch failed'))

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getWorkflowStatus).toBeCalledWith(
        workflowName,
        workflowNamespace
      )
      expect(argoService.getArchivedWorkflowStatus).toBeCalledWith(workflowId)
      expect(received.hasFinished).toBeFalsy()
      expect(received.status).toBeUndefined()
    })

    it.each([undefined, null, ''])(
      'should throw an error when called with undefined values',
      async (undefValue: any) => {
        await expect(() =>
          testee.checkWorkflowHasFinished(undefValue, undefValue, undefValue)
        ).rejects.toThrow()
      }
    )
  })

  describe('Update workflow data', () => {
    const resultFileContent = stringify({
      metadata: { version: 'v1' },
      header: {
        name: 'Test Spec',
        version: '1.0',
        date: '2023-07-06 07:27',
        toolVersion: '0.1.0',
      },
      overallStatus: 'YELLOW',
    })

    beforeEach(() => {
      currentRun = new Run()
      currentRun.globalId = 1000
      currentRun.id = 94
      currentRun.namespace = { id: 100, name: '' }
      currentRun.storagePath = ''
      currentRun.creationTime = new Date('2023-01-23 17:27:22.000Z')
      currentRun.argoName = '7f703d1f-0735-4063-b7b2-5b5cea818cac'
      currentRun.argoNamespace = '3d642da4-6adf-48e7-847e-a6bed8a91972'
      savedRun = undefined
    })

    it('should update the workflow data properly for a succeeded run', async () => {
      jest
        .spyOn(argoService, 'getWorkflowLogs')
        .mockImplementation(
          async (n: string, ns: string, c: any): Promise<string> => {
            if (c === 'main') {
              return loggedArgoRun
            } else if (c === 'init') {
              return loggedArgoNotMain
            } else if (c === 'wait') {
              return loggedArgoNotMain
            }
            throw new Error()
          }
        )
      jest.spyOn(blobStore, 'fileExists').mockResolvedValue(true)
      jest
        .spyOn(blobStore, 'downloadResult')
        .mockResolvedValue(Readable.from(resultFileContent))

      const result = await testee.updateWorkflowData(
        {
          status: succeededStatus,
          hasFinished: true,
        },
        currentRun
      )

      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'main'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'init'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'wait'
      )
      expect(blobStore.downloadLogs).not.toBeCalled()
      expect(blobStore.fileExists).toBeCalledTimes(1)
      expect(blobStore.downloadResult).toBeCalledTimes(2)
      expect(blobStore.downloadResult).toBeCalledWith(
        currentRun.storagePath,
        RESULTFILE
      )
      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalled()
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.namespace).toBe(currentRun.namespace)
      expect(savedRun.completionTime.toUTCString()).toBe(
        new Date(succeededStatus.finishedAt).toUTCString()
      )
      expect(savedRun.status).toBe(RunStatus.Completed)
      expect(savedRun.log.join('\n')).toBe(loggedRun)
      expect(savedRun.overallResult).toBe(RunResult.Yellow)
      expect(result).toBe(savedRun)
      expect(testee['processedRunList']).toContain(savedRun.globalId)
    })

    it('should update the workflow data properly for a failed argo run which has a result', async () => {
      jest
        .spyOn(argoService, 'getWorkflowLogs')
        .mockImplementation(
          async (n: string, ns: string, c: any): Promise<string> => {
            if (c === 'main') {
              return ''
            } else if (c === 'init') {
              return loggedArgoNotMainError
            } else if (c === 'wait') {
              return loggedArgoNotMain
            }
            throw new Error()
          }
        )
      jest
        .spyOn(blobStore, 'downloadResult')
        .mockResolvedValue(Readable.from(resultFileContent))
      jest.spyOn(blobStore, 'fileExists').mockResolvedValue(true)

      const result = await testee.updateWorkflowData(
        { status: failedStatus, hasFinished: true },
        currentRun
      )
      expect(blobStore.downloadResult).toBeCalledTimes(2)
      expect(blobStore.downloadResult).toBeCalledWith(
        currentRun.storagePath,
        RESULTFILE
      )
      expect(blobStore.fileExists).toBeCalledWith(
        currentRun.storagePath,
        EVIDENCEFILE
      )

      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalled()
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.namespace).toBe(currentRun.namespace)
      expect(savedRun.completionTime.toUTCString()).toBe(
        new Date(failedStatus.finishedAt).toUTCString()
      )
      expect(savedRun.status).toBe(RunStatus.Completed)
      expect(savedRun.log).toContain('Logs not available, but result exists')
      expect(savedRun.log).not.toContain('==========')
      expect(savedRun.log).not.toContain(
        'Errors identified during initialization or shutdown of workflow pod:'
      )
      expect(savedRun.overallResult).toBe(RunResult.Yellow)
      expect(result).toBe(savedRun)
    })

    it('should check twice for results, if the first request fails', async () => {
      jest
        .spyOn(argoService, 'getWorkflowLogs')
        .mockImplementation(
          async (n: string, ns: string, c: any): Promise<string> => {
            if (c === 'main') {
              return loggedArgoRun
            } else if (c === 'init') {
              return loggedArgoNotMain
            } else if (c === 'wait') {
              return loggedArgoNotMain
            }
            throw new Error()
          }
        )
      jest.spyOn(blobStore, 'fileExists').mockResolvedValueOnce(false)
      jest.spyOn(blobStore, 'fileExists').mockResolvedValueOnce(true)
      jest
        .spyOn(blobStore, 'downloadResult')
        .mockResolvedValue(Readable.from(resultFileContent))

      const result = await testee.updateWorkflowData(
        {
          status: succeededStatus,
          hasFinished: true,
        },
        currentRun
      )

      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'main'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'init'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'wait'
      )
      expect(blobStore.downloadLogs).not.toBeCalled()
      expect(blobStore.fileExists).toBeCalledTimes(2)
      expect(blobStore.downloadResult).toBeCalledTimes(2)

      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalled()
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.namespace).toBe(currentRun.namespace)
      expect(savedRun.completionTime.toUTCString()).toBe(
        new Date(succeededStatus.finishedAt).toUTCString()
      )
      expect(savedRun.status).toBe(RunStatus.Completed)
      expect(savedRun.log.join('\n')).toBe(loggedRun)
      expect(savedRun.overallResult).toBe(RunResult.Yellow)
      expect(result).toBe(savedRun)
      expect(testee['processedRunList']).toContain(savedRun.globalId)
    })

    it('should update the workflow data properly for a erroneous run without finishedAt and no logs or results', async () => {
      jest.spyOn(argoService, 'getWorkflowLogs').mockResolvedValue(undefined)
      jest.spyOn(blobStore, 'downloadLogs').mockResolvedValue(undefined)
      jest.spyOn(blobStore, 'fileExists').mockResolvedValue(false)
      jest.useFakeTimers()

      const result = await testee.updateWorkflowData(
        { status: errorStatus, hasFinished: true },
        currentRun
      )

      expect(blobStore.downloadResult).not.toBeCalled()
      expect(blobStore.fileExists).toBeCalledTimes(3)
      expect(blobStore.fileExists).toBeCalledWith(
        currentRun.storagePath,
        EVIDENCEFILE
      )
      expect(blobStore.downloadResult).not.toBeCalled()
      expect(queryRunner.manager.save).toBeCalled()
      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalled()
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.namespace).toBe(currentRun.namespace)
      expect(savedRun.completionTime.toUTCString()).toBe(
        new Date().toUTCString()
      )
      expect(savedRun.status).toBe(RunStatus.Failed)
      expect(savedRun.log.join('\n')).toBe(
        'Workflow has not finished properly, no result found or result corrupted'
      )
      expect(savedRun.overallResult).toBeFalsy()
      expect(result).toBe(savedRun)
    })

    it('should update the workflow data properly for a erroneous run without result but logs', async () => {
      jest
        .spyOn(argoService, 'getWorkflowLogs')
        .mockImplementation(
          async (n: string, ns: string, c: any): Promise<string> => {
            if (c === 'main') {
              return loggedArgoRun
            } else if (c === 'init') {
              return loggedArgoNotMain
            } else if (c === 'wait') {
              return loggedArgoNotMain
            }
            throw new Error()
          }
        )
      jest.spyOn(blobStore, 'fileExists').mockResolvedValue(true)
      jest.spyOn(blobStore, 'downloadResult').mockRejectedValue(new Error())

      const result = await testee.updateWorkflowData(
        {
          status: succeededStatus,
          hasFinished: true,
        },
        currentRun
      )

      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'main'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'init'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'wait'
      )
      expect(blobStore.downloadLogs).not.toBeCalled()
      expect(blobStore.fileExists).toBeCalledTimes(3)
      expect(blobStore.downloadResult).toBeCalledTimes(3)
      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalled()
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.namespace).toBe(currentRun.namespace)
      expect(savedRun.completionTime.toUTCString()).toBe(
        new Date(succeededStatus.finishedAt).toUTCString()
      )
      expect(savedRun.status).toBe(RunStatus.Failed)
      expect(savedRun.log).toEqual([
        'Workflow has not finished properly, no result found or result corrupted',
        '==========',
        'Nice log line',
        'Overall QG assessment status: YELLOW',
        'Another end line',
      ])
      expect(savedRun.overallResult).toBeUndefined()
      expect(result).toBe(savedRun)
    })

    it('should update the workflow data properly for a run without logs and a corrupted result', async () => {
      jest.spyOn(argoService, 'getWorkflowLogs').mockResolvedValue(undefined)
      jest.spyOn(blobStore, 'downloadLogs').mockResolvedValue(undefined)
      jest
        .spyOn(blobStore, 'downloadResult')
        .mockResolvedValue(Readable.from('Arrrgl'))
      jest.spyOn(blobStore, 'fileExists').mockResolvedValue(true)
      jest.useFakeTimers()

      const result = await testee.updateWorkflowData(
        { status: errorStatus, hasFinished: true },
        currentRun
      )

      expect(blobStore.downloadResult).toBeCalledTimes(1)
      expect(blobStore.downloadResult).toBeCalledWith(
        currentRun.storagePath,
        RESULTFILE
      )
      expect(blobStore.fileExists).toBeCalledWith(
        currentRun.storagePath,
        EVIDENCEFILE
      )
      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalled()
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.namespace).toBe(currentRun.namespace)
      expect(savedRun.completionTime.toUTCString()).toBe(
        new Date().toUTCString()
      )
      expect(savedRun.status).toBe(RunStatus.Failed)
      expect(savedRun.log.join('\n')).toBe(
        'Workflow has not finished properly, no result found or result corrupted'
      )
      expect(savedRun.overallResult).toBeFalsy()
      expect(result).toBe(savedRun)
    })

    it('should immediately return, if a run is already processed', async () => {
      testee['processedRunList'].push(currentRun.globalId)
      testee['logger']['debug'] = jest.fn()

      const result = await testee.updateWorkflowData(
        {
          status: succeededStatus,
          hasFinished: true,
        },
        currentRun
      )

      expect(result).toBe(currentRun)
      expect(testee['logger']['debug']).toBeCalledWith(
        `Run ${currentRun.namespace.id}:${currentRun.id} is processed`
      )
    })

    it('should hide the secret values in the logs', async () => {
      jest.spyOn(argoService, 'getWorkflowLogs').mockResolvedValue(undefined)
      jest
        .spyOn(blobStore, 'downloadLogs')
        .mockResolvedValue(loggedRunWithSecrets)
      jest.spyOn(blobStore, 'fileExists').mockResolvedValue(true)
      jest
        .spyOn(blobStore, 'downloadResult')
        .mockResolvedValue(Readable.from(resultFileContent))
      jest
        .spyOn(secretStorage, 'getSecrets')
        .mockResolvedValue({ ['Secret1']: 'secret1', ['Secret2']: 'secret2' })

      const result = await testee.updateWorkflowData(
        {
          status: succeededStatus,
          hasFinished: true,
        },
        currentRun
      )

      expect(queryRunner.manager.update).toBeCalled()
      expect(blobStore.fileExists).toBeCalledTimes(1)
      expect(blobStore.downloadResult).toBeCalledTimes(2)
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.namespace).toBe(currentRun.namespace)
      expect(savedRun.completionTime.toUTCString()).toBe(
        new Date(succeededStatus.finishedAt).toUTCString()
      )
      expect(savedRun.status).toBe(RunStatus.Completed)
      expect(savedRun.log.join('\n')).toBe(loggedRunWithSecretsHidden)
      expect(savedRun.overallResult).toBe(RunResult.Yellow)
      expect(result).toBe(savedRun)
    })

    it('should handle log message in init and wait container', async () => {
      jest
        .spyOn(argoService, 'getWorkflowLogs')
        .mockImplementation(
          async (n: string, ns: string, c: any): Promise<string> => {
            if (c === 'main') {
              return loggedArgoRun
            } else if (c === 'init') {
              return `${loggedArgoNotMain}\n${loggedArgoKnownError}`
            } else if (c === 'wait') {
              return loggedArgoNotMainError
            }
            throw new Error()
          }
        )
      jest.spyOn(blobStore, 'fileExists').mockResolvedValue(true)
      jest
        .spyOn(blobStore, 'downloadResult')
        .mockResolvedValue(Readable.from(resultFileContent))

      const result = await testee.updateWorkflowData(
        {
          status: errorStatus,
          hasFinished: true,
        },
        currentRun
      )
      const logAsString = result.log.join('\n')
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'main'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'init'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'wait'
      )
      expect(blobStore.downloadLogs).not.toBeCalled()
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.status).toBe(RunStatus.Completed)
      expect(result).toBe(savedRun)

      expect(logAsString).toContain(loggedRun)
      expect(logAsString).toContain(
        '==========\nErrors identified during initialization or shutdown of workflow pod:'
      )
      expect(logAsString).toContain(
        'Workflow failed, due to the environment variable section of the workflow exceeds the maximum size'
      )
    })

    it('should handle combine logs in init and wait container with downloaded logs', async () => {
      jest
        .spyOn(argoService, 'getWorkflowLogs')
        .mockImplementation(
          async (n: string, ns: string, c: any): Promise<string> => {
            if (c === 'main') {
              return ''
            } else if (c === 'init') {
              return `${loggedArgoNotMain}\n${loggedArgoKnownError}`
            } else if (c === 'wait') {
              return loggedArgoNotMainError
            }
            throw new Error()
          }
        )
      jest.spyOn(blobStore, 'fileExists').mockResolvedValue(true)
      jest
        .spyOn(blobStore, 'downloadResult')
        .mockResolvedValue(Readable.from(resultFileContent))
      jest.spyOn(blobStore, 'downloadLogs').mockResolvedValue(loggedRun)

      const result = await testee.updateWorkflowData(
        {
          status: errorStatus,
          hasFinished: true,
        },
        currentRun
      )
      const logAsString = result.log.join('\n')
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'main'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'init'
      )
      expect(argoService.getWorkflowLogs).toBeCalledWith(
        currentRun.argoName,
        currentRun.argoNamespace,
        'wait'
      )
      expect(blobStore.downloadLogs).toBeCalledWith(currentRun.argoName)
      expect(savedRun.globalId).toBe(currentRun.globalId)
      expect(savedRun.id).toBe(currentRun.id)
      expect(savedRun.status).toBe(RunStatus.Completed)
      expect(result).toBe(savedRun)

      expect(logAsString).toContain(loggedRun)
      expect(logAsString).toContain(
        '==========\nErrors identified during initialization or shutdown of workflow pod:'
      )
      expect(logAsString).toContain(
        'Workflow failed, due to the environment variable section of the workflow exceeds the maximum size'
      )
    })
  })

  describe('Hide secrets in logs', () => {
    it('should hide the secret values in the logs', async () => {
      const secrets = {
        test1: 'secret01',
        test2: 'secret02',
      }
      const log = [
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam secret01',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam secret02',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy secret01 eirmod secret02 tempor invidunt ut labore et dolore magna aliquyam',
      ]
      const expectedLog = [
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ***test1***',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ***test2***',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy ***test1*** eirmod ***test2*** tempor invidunt ut labore et dolore magna aliquyam',
      ]
      const logsWithoutSecrets = testee['hideSecrets'](log, secrets)
      expect(logsWithoutSecrets).toEqual(expectedLog)
    })

    it('should work with special strings in secrets', async () => {
      const secrets = {
        test1: '-9223372036854775808/-1',
        test2:
          'ЁЂЃЄЅІЇЈЉЊЋЌЍЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
        test3: '<foo val=`bar" />',
        test4: '¡“¶¢[]|{}≠¿|?`@()/w+w+. ,-_#',
      }
      const log = [
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam -9223372036854775808/-1',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ЁЂЃЄЅІЇЈЉЊЋЌЍЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam <foo val=`bar" />',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ¡“¶¢[]|{}≠¿|?`@()/w+w+. ,-_#',
      ]
      const expectedLog = [
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ***test1***',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ***test2***',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ***test3***',
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ***test4***',
      ]
      const logsWithoutSecrets = testee['hideSecrets'](log, secrets)
      expect(logsWithoutSecrets).toEqual(expectedLog)
    })

    it('can replace secrets in a very long log', async () => {
      const secrets = {
        secretNumber: '1',
      }
      const N_SECRETS = 100
      const N_LINES = 10000
      const line = '01'.repeat(N_SECRETS)
      const replacedLine = '0***secretNumber***'.repeat(N_SECRETS)
      const log = Array(N_LINES).fill(line)
      const expectedLog = Array(N_LINES).fill(replacedLine)
      const logsWithoutSecrets = testee['hideSecrets'](log, secrets)
      expect(logsWithoutSecrets).toEqual(expectedLog)
    })

    it('can replace a secret with value same to its name', async () => {
      const secrets = {
        same: 'same',
      }
      const log = ['same again']
      const expectedLog = ['***same*** again']
      const logsWithoutSecrets = testee['hideSecrets'](log, secrets)
      expect(logsWithoutSecrets).toEqual(expectedLog)
    })
  })

  describe('replaceAll', () => {
    it('should replace all occurrences of a substring with another substring', () => {
      const testCases = [
        { input: 'abcd', search: 'x', replacement: 'X', expected: 'abcd' },
        { input: 'abcd', search: 'a', replacement: 'X', expected: 'Xbcd' },
        { input: 'abcd', search: 'd', replacement: 'X', expected: 'abcX' },
        { input: 'abcd', search: 'c', replacement: 'X', expected: 'abXd' },
        { input: 'abcd', search: 'a', replacement: 'a', expected: 'abcd' },
        {
          input: 'babcabcb',
          search: 'b',
          replacement: 'X',
          expected: 'XaXcaXcX',
        },
      ]
      for (const { input, search, replacement, expected } of testCases) {
        const actual = testee['replaceAll'](input, search, replacement)
        expect(actual).toEqual(expected)
      }
    })
  })

  describe('Archive skipping', () => {
    it('should skip checking the argo archive', async () => {
      jest
        .spyOn(workflowFinishConfig, 'shouldSkipCheckArgoArchive')
        .mockReturnValue(true)
      jest.spyOn(argoService, 'getWorkflowStatus').mockResolvedValue(null)
      jest.spyOn(argoService, 'getArchivedWorkflowStatus').mockReturnValue(null)

      const received = await testee.checkWorkflowHasFinished(
        workflowId,
        workflowName,
        workflowNamespace
      )

      expect(argoService.getArchivedWorkflowStatus).not.toHaveBeenCalled()
      expect(received.hasFinished).toBeFalsy()
    })
  })
})
