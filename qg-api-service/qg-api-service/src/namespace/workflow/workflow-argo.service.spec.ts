import { streamToString } from '@B-S-F/api-commons-lib'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import crypto from 'crypto'
import { LoggerModule, PinoLogger } from 'nestjs-pino'
import { Readable } from 'stream'
import { EntityManager, QueryRunner } from 'typeorm'
import { ConfigEntity, FileEntity } from '../configs/config.entity'
import { ConfigsService } from '../configs/configs.service'
import { Run, RunAuditService, RunStatus } from '../run/run.entity'
import { SecretStorage } from '../secret/secret-storage.service'
import { ArgoService } from './argo.service'
import { BlobStore } from './minio.service'
import {
  PrivateCloudConfig,
  WorkflowImageConfig,
  WorkflowManager,
} from './workflow-argo.service'
import { ConfigList } from './workflow-creator'
import { WorkflowFinishedService } from './workflow-finished-service'

describe('WorkflowManager', () => {
  let moduleRef: TestingModule
  let workflowManager: WorkflowManager
  let queryRunner: QueryRunner

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        WorkflowManager,
        {
          provide: ArgoService,
          useValue: {
            startWorkflow: jest.fn(),
          },
        },
        {
          provide: WorkflowFinishedService,
          useValue: {
            checkWorkflowHasFinished: jest.fn(),
            updateWorkflowData: jest.fn(),
          },
        },
        {
          provide: BlobStore,
          useValue: {
            uploadConfig: jest.fn(),
            downloadResult: jest.fn(),
            removePath: jest.fn(),
          },
        },
        {
          provide: ConfigsService,
          useValue: {
            getContentOfMultipleFiles: jest.fn(),
          },
        },
        {
          provide: SecretStorage,
          useValue: {
            getSecrets: jest.fn(),
          },
        },
        {
          provide: PrivateCloudConfig,
          useValue: new PrivateCloudConfig(
            true,
            'http://localhost:3128',
            'bosch.com',
            ''
          ),
        },
        {
          provide: WorkflowImageConfig,
          useValue: new WorkflowImageConfig(
            'workflow-image',
            { v1: 'latest', v2: 'latest' },
            'Never'
          ),
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
          provide: PinoLogger,
          useValue: { pinoHttp: jest.fn(), trace: jest.fn() },
        },
        {
          provide: RunAuditService,
          useValue: {
            append: jest.fn(),
          },
        },
      ],
    }).compile()

    workflowManager = moduleRef.get<WorkflowManager>(WorkflowManager)
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn() as any,
        update: jest.fn() as any,
      } as EntityManager,
    } as any
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Run Workflow', () => {
    let argoService: ArgoService
    let blobStore: BlobStore

    let currentRun: Run

    const argoName = 'ad41b004-7323-44a3-85dd-92d4bcb71bb5'
    const argoNamespace = 'argo'
    const argoUid = '400e0c1c-f522-4ef6-8c26-c7bbfeb154c6'
    const argoCreationTimestamp = new Date().toUTCString()
    const storagePath = '283d7124-415f-4aa2-9def-e96c1a723452'

    const configFiles = {
      'qg-config.yaml':
        'header:\n  name: Test\n  version: "1.1"\nmetadata:\n  version: "v1"\n',
      'additional-config.yaml': 'Cool Additional Config',
    }

    const expectedFiles = {
      '.secrets': { SECRET1: 'Really secret secret' },
      '.vars': { ENV_KEY1: 'ENV_VALUE1' },
      'environment-variables.json': {
        http_proxy: 'http://localhost:3128',
        https_proxy: 'http://localhost:3128',
        HTTP_PROXY: 'http://localhost:3128',
        HTTPS_PROXY: 'http://localhost:3128',
        no_proxy: 'bosch.com',
        NO_PROXY: 'bosch.com',
        REQUESTS_CA_BUNDLE: '/etc/ssl/certs/ca-certificates.crt',
        NODE_EXTRA_CA_CERTS: '/etc/ssl/certs/ca-certificates.crt',
        SSL_CERT_FILE: '/etc/ssl/certs/BOSCH-CA-DE_pem.pem',
        HTTPLIB2_CA_CERTS: '/etc/ssl/certs/ca-certificates.crt',
      },
    }

    const environment = { ENV_KEY1: 'ENV_VALUE1' }
    const environment2 = {
      ENV1: 'ENV_VALUE_1',
      ENV2: 'ENV_VALUE_2',
    }

    const secrets = { SECRET1: 'Really secret secret' }
    const testUUID = '283d7124-415f-4aa2-9def-e96c1a723456'

    const expectedWorkflow = {
      Workflow: {
        metadata: {
          generateName: 'qg-run-',
        },
        spec: {
          entrypoint: 'run',
          securityContext: {
            runAsUser: 1001,
            fsGroup: 1000,
          },
          imagePullSecrets: [{ name: '' }],
          templates: [
            {
              name: 'autopilot',
              script: {
                image: 'workflow-image:latest',
                imagePullPolicy: 'Never',
                command: ['bash'],
                env: [
                  { name: 'http_proxy', value: 'http://localhost:3128' },
                  { name: 'https_proxy', value: 'http://localhost:3128' },
                  { name: 'HTTP_PROXY', value: 'http://localhost:3128' },
                  { name: 'HTTPS_PROXY', value: 'http://localhost:3128' },
                  { name: 'no_proxy', value: 'bosch.com' },
                  { name: 'NO_PROXY', value: 'bosch.com' },
                  {
                    name: 'REQUESTS_CA_BUNDLE',
                    value: '/etc/ssl/certs/ca-certificates.crt',
                  },
                  {
                    name: 'NODE_EXTRA_CA_CERTS',
                    value: '/etc/ssl/certs/ca-certificates.crt',
                  },
                  {
                    name: 'SSL_CERT_FILE',
                    value: '/etc/ssl/certs/BOSCH-CA-DE_pem.pem',
                  },
                  {
                    name: 'HTTPLIB2_CA_CERTS',
                    value: '/etc/ssl/certs/ca-certificates.crt',
                  },
                ],
                source: 'onyx exec . --strict',
              },
              inputs: {
                artifacts: [
                  {
                    name: testUUID,
                    path: '/home/qguser/mnt/qg-config.yaml',
                    s3: {
                      key: '283d7124-415f-4aa2-9def-e96c1a723452/qg-config.yaml',
                    },
                  },
                  {
                    name: testUUID,
                    path: '/home/qguser/mnt/additional-config.yaml',
                    s3: {
                      key: '283d7124-415f-4aa2-9def-e96c1a723452/additional-config.yaml',
                    },
                  },
                  {
                    name: testUUID,
                    path: '/home/qguser/mnt/.vars',
                    s3: { key: '283d7124-415f-4aa2-9def-e96c1a723452/.vars' },
                  },
                  {
                    name: testUUID,
                    path: '/home/qguser/mnt/.secrets',
                    s3: {
                      key: '283d7124-415f-4aa2-9def-e96c1a723452/.secrets',
                    },
                  },
                  {
                    name: testUUID,
                    path: '/home/qguser/mnt/environment-variables.json',
                    s3: {
                      key: '283d7124-415f-4aa2-9def-e96c1a723452/environment-variables.json',
                    },
                  },
                ],
              },
              outputs: {
                artifacts: [
                  {
                    name: 'evidencezip',
                    path: '/home/qguser/mnt/evidence.zip',
                    s3: {
                      key: '283d7124-415f-4aa2-9def-e96c1a723452/evidences.zip',
                    },
                    archive: { none: {} },
                  },
                  {
                    name: 'qgresultyaml',
                    path: '/home/qguser/mnt/qg-result.yaml',
                    s3: {
                      key: '283d7124-415f-4aa2-9def-e96c1a723452/qg-result.yaml',
                    },
                    archive: { none: {} },
                  },
                ],
              },
              activeDeadlineSeconds: 30 * 60, // 30 minutes timeout for workflow
            },
            {
              name: 'run',
              dag: {
                tasks: [
                  {
                    name: 'cli',
                    template: 'autopilot',
                  },
                ],
              },
            },
          ],
        },
      },
    }

    let path: string
    let configs: ConfigList

    beforeEach(() => {
      argoService = moduleRef.get<ArgoService>(ArgoService)
      blobStore = moduleRef.get<BlobStore>(BlobStore)

      jest.spyOn(argoService, 'startWorkflow').mockResolvedValue({
        name: argoName,
        namespace: argoNamespace,
        uid: argoUid,
        creationTimestamp: argoCreationTimestamp,
      })

      jest
        .spyOn(
          moduleRef.get<ConfigsService>(ConfigsService),
          'getContentOfMultipleFiles'
        )
        .mockResolvedValue({ ...configFiles })

      jest
        .spyOn(moduleRef.get<SecretStorage>(SecretStorage), 'getSecrets')
        .mockResolvedValue(secrets)

      jest.spyOn(crypto, 'randomUUID').mockReturnValue(testUUID)

      const currentConfig = new ConfigEntity()
      currentConfig.namespace = { id: 100, name: '' }
      currentConfig.id = 15
      currentConfig.name = 'Strange name'
      currentConfig.files = []
      const file1 = new FileEntity()
      file1.config = currentConfig
      file1.filename = 'qg-config.yaml'
      file1.id = 100
      currentConfig.files.push(file1)
      const file2 = new FileEntity()
      file2.config = currentConfig
      file2.filename = 'additional-config.yaml'
      file2.id = 101
      currentConfig.files.push(file2)
      currentRun = new Run()
      currentRun.globalId = 1000
      currentRun.id = 94
      currentRun.namespace = { id: 100, name: '' }
      currentRun.storagePath = storagePath
      currentRun.creationTime = new Date(0)
      currentRun.config = currentConfig

      path = undefined
      configs = undefined
    })

    function checkUploadConfig(
      path: string,
      configs: { [filename: string]: string },
      expected: { [filename: string]: any }
    ): void {
      expect(path).toBe(storagePath)
      const files = Object.keys(configs)
      expect(files.length).toBe(5)
      expect(files).toContain('qg-config.yaml')
      expect(files).toContain('additional-config.yaml')
      expect(files).toContain('environment-variables.json')
      expect(files).toContain('.secrets')
      expect(files).toContain('.vars')
      expect(configs['qg-config.yaml']).toEqual(expected['qg-config.yaml'])
      expect(configs['additional-config.yaml']).toEqual(
        expected['additional-config.yaml']
      )
      expect(JSON.parse(configs['environment-variables.json'])).toEqual(
        expected['environment-variables.json']
      )
      expect(JSON.parse(configs['.secrets'])).toEqual(expected['.secrets'])
      expect(JSON.parse(configs['.vars'])).toEqual(expected['.vars'])
    }

    it('should create the workflow as expected with new config', async () => {
      jest
        .spyOn(blobStore, 'uploadConfig')
        .mockImplementation((p, c): Promise<void> => {
          path = p
          configs = c
          return Promise.resolve()
        })

      await workflowManager.run(currentRun, { environment })

      checkUploadConfig(path, configs, {
        ...configFiles,
        ...expectedFiles,
      })

      expect(argoService.startWorkflow).toBeCalledWith(
        JSON.stringify(expectedWorkflow)
      )

      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, {
        globalId: currentRun.globalId,
        id: currentRun.id,
        namespace: currentRun.namespace,
        creationTime: new Date(argoCreationTimestamp),
        status: RunStatus.Running,
        argoName: argoName,
        argoNamespace: argoNamespace,
        argoId: argoUid,
        config: expect.anything(),
        storagePath: expect.anything(),
      })
    })

    it('should call the WorkflowGenerationService.generateWorkflow with empty environment variables and secrets', async () => {
      jest
        .spyOn(moduleRef.get<BlobStore>(BlobStore), 'uploadConfig')
        .mockImplementation((p, c): Promise<void> => {
          path = p
          configs = c
          return Promise.resolve()
        })

      jest
        .spyOn(moduleRef.get<SecretStorage>(SecretStorage), 'getSecrets')
        .mockResolvedValue({})

      await workflowManager.run(currentRun, { environment: {} })

      checkUploadConfig(path, configs, {
        ...configFiles,
        ...expectedFiles,
        '.secrets': {},
        '.vars': {},
      })

      expect(argoService.startWorkflow).toBeCalledWith(
        JSON.stringify(expectedWorkflow)
      )

      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, {
        globalId: currentRun.globalId,
        id: currentRun.id,
        namespace: currentRun.namespace,
        creationTime: new Date(argoCreationTimestamp),
        status: RunStatus.Running,
        argoName: argoName,
        argoNamespace: argoNamespace,
        argoId: argoUid,
        config: expect.anything(),
        storagePath: expect.anything(),
      })
    })

    it('should create the workflow as expected and handle multiple environment variables', async () => {
      jest
        .spyOn(moduleRef.get<BlobStore>(BlobStore), 'uploadConfig')
        .mockImplementation((p, c): Promise<void> => {
          path = p
          configs = c
          return Promise.resolve()
        })

      await workflowManager.run(currentRun, { environment: environment2 })

      checkUploadConfig(path, configs, {
        ...configFiles,
        ...expectedFiles,
        '.vars': environment2,
      })

      expect(argoService.startWorkflow).toBeCalledWith(
        JSON.stringify(expectedWorkflow)
      )

      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, {
        globalId: currentRun.globalId,
        id: currentRun.id,
        namespace: currentRun.namespace,
        creationTime: new Date(argoCreationTimestamp),
        status: RunStatus.Running,
        argoName: argoName,
        argoNamespace: argoNamespace,
        argoId: argoUid,
        config: expect.anything(),
        storagePath: expect.anything(),
      })
    })

    it('should handle the usage of the single check option', async () => {
      jest
        .spyOn(moduleRef.get<BlobStore>(BlobStore), 'uploadConfig')
        .mockImplementation((p, c): Promise<void> => {
          path = p
          configs = c
          return Promise.resolve()
        })

      jest
        .spyOn(moduleRef.get<SecretStorage>(SecretStorage), 'getSecrets')
        .mockResolvedValue({})

      await workflowManager.run(currentRun, {
        environment: {},
        singleCheck: { chapter: '1', requirement: '1', check: '1' },
      })

      checkUploadConfig(path, configs, {
        ...configFiles,
        ...expectedFiles,
        '.secrets': {},
        '.vars': {},
      })

      const changedExpected = { ...expectedWorkflow }
      changedExpected.Workflow.spec.templates[0].script.source += ' -c 1_1_1'
      expect(argoService.startWorkflow).toBeCalledWith(
        JSON.stringify(changedExpected)
      )

      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, {
        globalId: currentRun.globalId,
        id: currentRun.id,
        namespace: currentRun.namespace,
        creationTime: new Date(argoCreationTimestamp),
        status: RunStatus.Running,
        argoName: argoName,
        argoNamespace: argoNamespace,
        argoId: argoUid,
        config: expect.anything(),
        storagePath: expect.anything(),
      })
    })

    it('should handle thrown errors graciously', async () => {
      jest.spyOn(blobStore, 'uploadConfig').mockRejectedValue(new Error())

      await workflowManager.run(currentRun, { environment })

      expect(argoService.startWorkflow).not.toBeCalled()

      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, {
        globalId: currentRun.globalId,
        id: currentRun.id,
        namespace: currentRun.namespace,
        status: RunStatus.Failed,
        log: ['Error while starting the workflow'],
        creationTime: expect.anything(),
        config: expect.anything(),
        storagePath: expect.anything(),
      })
    })

    it('should fail a workflow if the provided config has no qg-config.yaml', async () => {
      jest
        .spyOn(
          moduleRef.get<ConfigsService>(ConfigsService),
          'getContentOfMultipleFiles'
        )
        .mockResolvedValue({})

      const currentConfig = new ConfigEntity()
      currentConfig.namespace = { id: 100, name: '' }
      currentConfig.id = 333
      currentConfig.name = 'Incomplete'
      currentConfig.files = []
      currentRun = new Run()
      currentRun.globalId = 2000
      currentRun.id = 95
      currentRun.namespace = { id: 100, name: '' }
      currentRun.storagePath = storagePath
      currentRun.creationTime = new Date(0)
      currentRun.config = currentConfig

      await workflowManager.run(currentRun, { environment })

      expect(queryRunner.manager.update).toBeCalled()
      expect(queryRunner.manager.save).toBeCalledWith(Run, {
        globalId: currentRun.globalId,
        id: currentRun.id,
        namespace: currentRun.namespace,
        status: RunStatus.Failed,
        log: [
          'Error while starting the workflow',
          'No qg-config.yaml defined for config',
        ],
        creationTime: expect.anything(),
        config: currentConfig,
        storagePath: expect.anything(),
      })
    })
  })

  describe('Download results', () => {
    const resultContent = 'bcbb27e5-450d-40b8-bb1e-4e33805d5a27'
    const storagePath = 'b838d7ed-448e-4d4e-84da-40bc73f90e03'
    const filename = '4103f427-0408-47e8-ac44-b876821ae7f2'

    let blobStore: BlobStore

    beforeEach(() => {
      blobStore = moduleRef.get<BlobStore>(BlobStore)
    })

    it('should forward the download call to the blob store', async () => {
      jest
        .spyOn(blobStore, 'downloadResult')
        .mockResolvedValue(Readable.from(resultContent))

      const returnValue = await workflowManager.downloadResult(
        storagePath,
        filename
      )

      expect(blobStore.downloadResult).toBeCalledWith(storagePath, filename)
      expect(await streamToString(returnValue)).toBe(resultContent)
    })
  })

  describe('Update run if finished', () => {
    let currentRun: Run

    let finishedService: WorkflowFinishedService

    const storagePath = '7514ec97-6b4d-4e34-ab8e-0c019b9e76d4'
    const argoId = 'e7d935fc-cbab-4949-8c8c-1add5e1cd385'
    const argoName = 'a312e694-ef55-48b2-aa5e-445f252c8626'
    const argoNamespace = '9a0f2496-2b1c-4ca3-aa27-e9856f5c29f5'
    const status = { dummy: 1 }

    beforeEach(() => {
      finishedService = moduleRef.get<WorkflowFinishedService>(
        WorkflowFinishedService
      )

      currentRun = new Run()
      currentRun.globalId = 1000
      currentRun.id = 94
      currentRun.namespace = { id: 100, name: '' }
      currentRun.storagePath = storagePath
      currentRun.status = RunStatus.Running
      currentRun.creationTime = new Date(0)
      currentRun.argoId = argoId
      currentRun.argoName = argoName
      currentRun.argoNamespace = argoNamespace
    })

    it('should update the workflow if it has been finished', async () => {
      jest
        .spyOn(finishedService, 'checkWorkflowHasFinished')
        .mockResolvedValue({ status, hasFinished: true })
      jest
        .spyOn(finishedService, 'updateWorkflowData')
        .mockImplementation(async (retrievedStatus, run) => {
          expect(retrievedStatus).toStrictEqual({
            status,
            hasFinished: true,
          })
          run.status = RunStatus.Completed
          return run
        })

      const returnValue = await workflowManager.updateRunIfFinished(currentRun)

      expect(finishedService.checkWorkflowHasFinished).toBeCalledWith(
        argoId,
        argoName,
        argoNamespace
      )
      expect(finishedService.updateWorkflowData).toBeCalled()
      expect(returnValue.status).toBe(RunStatus.Completed)
    })

    it('should do nothing if the workflow has not been finished', async () => {
      jest
        .spyOn(finishedService, 'checkWorkflowHasFinished')
        .mockResolvedValue({ hasFinished: false })

      const returnValue = await workflowManager.updateRunIfFinished(currentRun)

      expect(finishedService.checkWorkflowHasFinished).toBeCalledWith(
        argoId,
        argoName,
        argoNamespace
      )
      expect(finishedService.updateWorkflowData).not.toBeCalled()
      expect(returnValue.status).toBe(RunStatus.Running)
    })

    it('should pass any error happening in a called method', async () => {
      jest
        .spyOn(finishedService, 'checkWorkflowHasFinished')
        .mockResolvedValue({ status, hasFinished: true })
      jest
        .spyOn(finishedService, 'updateWorkflowData')
        .mockRejectedValue(new Error('Test Error'))

      workflowManager['logger']['error'] = jest.fn()

      const run = await workflowManager.updateRunIfFinished(currentRun)
      expect(run).toBe(currentRun)
      expect(workflowManager['logger']['error']).toBeCalledWith({
        msg: 'Severe error happened while checking whether workflow has finished: Error: Test Error',
      })
    })
  })

  describe('Delete workflow artifacts from blob store properly', () => {
    let currentRun: Run

    let blobStore: BlobStore

    const storagePath = '0cecd218-f713-471f-a83d-ce5e877e04c8'
    const argoName = '55b0e3a5-d450-4fc6-9b9f-6691f91fed31'

    beforeEach(() => {
      blobStore = moduleRef.get<BlobStore>(BlobStore)

      currentRun = new Run()
      currentRun.globalId = 1000
      currentRun.id = 94
      currentRun.namespace = { id: 100, name: '' }
      currentRun.storagePath = storagePath
      currentRun.status = RunStatus.Running
      currentRun.creationTime = new Date(0)
      currentRun.argoName = argoName
    })

    it('should delete both storage path and argo name folders', async () => {
      await workflowManager.deleteWorkflowArtifacts(currentRun)

      expect(blobStore.removePath).toBeCalledTimes(2)
      expect(blobStore.removePath).toBeCalledWith(currentRun.storagePath)
      expect(blobStore.removePath).toBeCalledWith(currentRun.argoName)
    })

    it('should delete only storage path if argo name is undefined', async () => {
      currentRun.argoName = undefined
      await workflowManager.deleteWorkflowArtifacts(currentRun)

      expect(blobStore.removePath).toBeCalledTimes(1)
      expect(blobStore.removePath).toBeCalledWith(currentRun.storagePath)
    })

    it('should not delete anything, if run has neither storage path nor argo name', async () => {
      currentRun.argoName = undefined
      currentRun.storagePath = undefined
      await workflowManager.deleteWorkflowArtifacts(currentRun)

      expect(blobStore.removePath).not.toBeCalled()
    })
  })
})
