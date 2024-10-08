import { EntityList, ListQueryHandler } from '@B-S-F/api-commons-lib'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigEntity } from '../configs/config.entity'
import { ConfigsService } from '../configs/configs.service'
import { Namespace } from '../namespace/namespace.entity'
import { CleanTestDataConfig, CleanTestDataTask } from './clean-test-data'
import { Run, RunStatus } from './run.entity'
import { RunService } from './run.service'
import { SYSTEM_REQUEST_USER } from '../module.utils'

describe('RunController', () => {
  let task: CleanTestDataTask
  let module: TestingModule

  let runService: RunService
  let configService: ConfigsService

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CleanTestDataTask,
        {
          provide: RunService,
          useValue: {
            getList: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ConfigsService,
          useValue: {
            delete: jest.fn(),
          },
        },
        {
          provide: CleanTestDataConfig,
          useFactory: () => new CleanTestDataConfig(true, '2', '7'),
        },
      ],
    }).compile()

    task = module.get<CleanTestDataTask>(CleanTestDataTask)
    runService = module.get<RunService>(RunService)
    configService = module.get<ConfigsService>(ConfigsService)
  })

  it('should be defined', () => {
    expect(task).toBeDefined()
  })

  describe('Check for detection of obsolete Run and Config objects', () => {
    let testConfigs: ConfigEntity[]
    let testRuns: Run[]

    const namespace1: Namespace = { id: 1, name: '' }
    const namespace2: Namespace = { id: 2, name: '' }

    const oldDate = new Date(0)
    const yesterdayDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgoDate = new Date(new Date().getTime() - 48 * 60 * 60 * 1000)

    const testConfigData = [
      { namespace: namespace1, id: 1, lastModificationDate: oldDate },
      { namespace: namespace2, id: 1, lastModificationDate: twoDaysAgoDate },
      { namespace: namespace2, id: 2, lastModificationDate: twoDaysAgoDate },
      { namespace: namespace2, id: 3, lastModificationDate: yesterdayDate },
    ]

    const testRunData = [
      { namespace: namespace1, id: 1, creationTime: oldDate, configIndex: 0 },
      {
        namespace: namespace1,
        id: 2,
        creationTime: yesterdayDate,
        configIndex: 0,
      },
      { namespace: namespace1, id: 3, creationTime: oldDate, configIndex: 0 },
      { namespace: namespace2, id: 1, creationTime: oldDate, configIndex: 1 },
      {
        namespace: namespace2,
        id: 2,
        creationTime: yesterdayDate,
        configIndex: 3,
      },
      { namespace: namespace2, id: 3, creationTime: oldDate, configIndex: 1 },
      {
        namespace: namespace2,
        id: 4,
        creationTime: twoDaysAgoDate,
        configIndex: 3,
      },
      {
        namespace: namespace2,
        id: 5,
        creationTime: yesterdayDate,
        configIndex: 2,
      },
      { namespace: namespace2, id: 6, creationTime: oldDate, configIndex: 1 },
      { namespace: namespace2, id: 7, creationTime: oldDate, configIndex: 2 },
      { namespace: namespace2, id: 8, configIndex: 2 },
    ]

    function createConfigAndRunTestData() {
      testConfigs = []
      for (let i = 0; i < testConfigData.length; i++) {
        const config = new ConfigEntity()
        config.globalId = i + 1
        config.namespace = testConfigData[i].namespace
        config.id = testConfigData[i].id
        config.name = ''
        config.creationTime = oldDate
        config.lastModificationTime = testConfigData[i].lastModificationDate
        testConfigs.push(config)
      }

      testRuns = []
      for (let i = 0; i < testRunData.length; i++) {
        const run = new Run()
        run.globalId = i + 1
        run.creationTime = testRunData[i].creationTime ?? undefined
        run.config = testConfigs[testRunData[i].configIndex]
        run.id = testRunData[i].id
        run.namespace = testRunData[i].namespace
        run.status = RunStatus.Completed
        testRuns.push(run)
      }
    }

    beforeEach(() => {
      createConfigAndRunTestData()
      jest
        .spyOn(runService, 'getList')
        .mockImplementation(
          async (namespaceId: number, queryOptions: ListQueryHandler) => {
            if (queryOptions.page > 1) {
              const returnValue = new EntityList<Run>()
              returnValue.itemCount = 7
              returnValue.entities = []
              return returnValue
            }
            if (namespaceId === 2) {
              const returnValue = new EntityList<Run>()
              returnValue.itemCount = 7
              returnValue.entities = testRuns.slice(3)
              return returnValue
            }
            throw new Error('Wrong parameters')
          }
        )
    })

    it('should delete the expected runs and configs', async () => {
      await task.cleanUpTestData()

      expect(runService.getList).toBeCalledTimes(2)
      expect(runService.delete).toBeCalledTimes(5)
      expect(runService.delete).toBeCalledWith(2, 1, SYSTEM_REQUEST_USER)
      expect(runService.delete).toBeCalledWith(2, 3, SYSTEM_REQUEST_USER)
      expect(runService.delete).toBeCalledWith(2, 6, SYSTEM_REQUEST_USER)
      expect(runService.delete).toBeCalledWith(2, 7, SYSTEM_REQUEST_USER)
      expect(runService.delete).toBeCalledWith(2, 8, SYSTEM_REQUEST_USER)
      expect(configService.delete).toBeCalledTimes(1)
      expect(configService.delete).toBeCalledWith(2, 1)
    })

    type Mutable<T> = {
      -readonly [k in keyof T]: T[k]
    }

    it('should delete the expected runs, even if string contains unnecessary separator', async () => {
      const mutableTestee = task as Mutable<CleanTestDataTask>
      mutableTestee['config']['testdataNamespaceString'] = '2,'

      await task.cleanUpTestData()

      expect(runService.getList).toBeCalledTimes(2)
      expect(runService.delete).toBeCalledTimes(5)
      expect(runService.delete).toBeCalledWith(2, 1, SYSTEM_REQUEST_USER)
      expect(runService.delete).toBeCalledWith(2, 3, SYSTEM_REQUEST_USER)
      expect(runService.delete).toBeCalledWith(2, 6, SYSTEM_REQUEST_USER)
      expect(runService.delete).toBeCalledWith(2, 7, SYSTEM_REQUEST_USER)
      expect(runService.delete).toBeCalledWith(2, 8, SYSTEM_REQUEST_USER)
      expect(configService.delete).toBeCalledTimes(1)
      expect(configService.delete).toBeCalledWith(2, 1)
    })

    it('should do nothing, if config is disabled', async () => {
      const mutableTestee = task as Mutable<CleanTestDataTask>
      mutableTestee['config']['executeTestDataCleanup'] = false

      await task.cleanUpTestData()

      expect(runService.getList).not.toBeCalled()
      expect(runService.delete).not.toBeCalled()
      expect(configService.delete).not.toBeCalled()
    })

    it('should do nothing, if config contains not acceptable namespace list', async () => {
      const mutableTestee = task as Mutable<CleanTestDataTask>
      mutableTestee['config']['testdataNamespaceString'] = 'd4;5'

      await task.cleanUpTestData()

      expect(runService.getList).not.toBeCalled()
      expect(runService.delete).not.toBeCalled()
      expect(configService.delete).not.toBeCalled()
    })

    it('should do nothing, if config contains a namespace list with only a separator', async () => {
      const mutableTestee = task as Mutable<CleanTestDataTask>
      mutableTestee['config']['testdataNamespaceString'] = ','

      await task.cleanUpTestData()

      expect(runService.getList).not.toBeCalled()
      expect(runService.delete).not.toBeCalled()
      expect(configService.delete).not.toBeCalled()
    })
  })
})
