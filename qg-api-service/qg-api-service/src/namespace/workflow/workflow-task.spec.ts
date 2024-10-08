import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { setTimeout } from 'timers/promises'
import { Repository } from 'typeorm'
import { Run, RunStatus } from '../run/run.entity'
import { WorkflowFinishedService } from './workflow-finished-service'
import { FinishedWorkflowDetectionTask } from './workflow-task'
import { LoggerModule, PinoLogger, Logger } from 'nestjs-pino'

describe('Workflow Task', () => {
  let moduleRef: TestingModule

  let finishedWorkflowTask: FinishedWorkflowDetectionTask
  let runRepository: Repository<Run>
  let workflowFinishedService: WorkflowFinishedService

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        FinishedWorkflowDetectionTask,
        {
          provide: WorkflowFinishedService,
          useFactory: () => ({
            checkWorkflowHasFinished: jest.fn(),
            updateWorkflowData: jest.fn(),
          }),
        },
        {
          provide: getRepositoryToken(Run),
          useFactory: () => ({
            find: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          }),
        },
        {
          provide: PinoLogger,
          useValue: { pinoHttp: jest.fn() },
        },
        {
          provide: Logger,
          useValue: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile()

    finishedWorkflowTask = moduleRef.get<FinishedWorkflowDetectionTask>(
      FinishedWorkflowDetectionTask
    )
    workflowFinishedService = moduleRef.get<WorkflowFinishedService>(
      WorkflowFinishedService
    )
    runRepository = moduleRef.get(getRepositoryToken(Run))
  })

  describe('Check finished workflows', () => {
    let runs: Run[]

    const storagePath = '661d5e5b-d754-4f47-bf2e-9c53de6bfcb8'

    const argoStatusObject = { someStatus: 'status value' }

    beforeEach(() => {
      runs = []

      let currentRun = new Run()
      currentRun.globalId = 1000
      currentRun.id = 94
      currentRun.namespace = { id: 100, name: '' }
      currentRun.storagePath = storagePath
      currentRun.creationTime = new Date()
      currentRun.argoId = '5885cdc9-9f70-4c17-a276-27c1fa6980ae'
      currentRun.argoName = '6dd09162-a4af-415c-aec4-700258bfe5fe'
      currentRun.argoNamespace = 'argo'
      currentRun.status = RunStatus.Running

      runs.push(currentRun)

      currentRun = new Run()
      currentRun.globalId = 1001
      currentRun.id = 95
      currentRun.namespace = { id: 100, name: '' }
      currentRun.storagePath = storagePath
      currentRun.creationTime = new Date()
      currentRun.argoId = '48a31d2c-fe58-45fd-96d8-7c0412d9f2f6'
      currentRun.argoName = '4e05d5fa-0156-47d0-a25a-7b8900a5e247'
      currentRun.argoNamespace = 'argo'
      currentRun.status = RunStatus.Running

      runs.push(currentRun)
    })

    it('should process runs properly, if all are still running', async () => {
      jest.spyOn(runRepository, 'find').mockResolvedValue(runs)

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(workflowFinishedService.checkWorkflowHasFinished).toBeCalledTimes(
        2
      )
      expect(workflowFinishedService.updateWorkflowData).not.toBeCalled()
      expect(runRepository.save).not.toBeCalled()
      expect(runRepository.update).not.toBeCalled()
    })

    it('should process a finished workflow properly', async () => {
      jest.spyOn(runRepository, 'find').mockResolvedValue(runs)
      jest
        .spyOn(workflowFinishedService, 'checkWorkflowHasFinished')
        .mockImplementation(async (argoId) => {
          if (argoId === '5885cdc9-9f70-4c17-a276-27c1fa6980ae') {
            return {
              status: argoStatusObject,
              hasFinished: true,
            }
          } else {
            return { hasFinished: false }
          }
        })

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(workflowFinishedService.checkWorkflowHasFinished).toBeCalledTimes(
        2
      )
      expect(workflowFinishedService.updateWorkflowData).toBeCalledWith(
        { status: argoStatusObject, hasFinished: true },
        runs[0]
      )
      expect(runRepository.save).not.toBeCalled()
      expect(runRepository.update).not.toBeCalled()
    })

    it('should handle the case of no running runs properly', async () => {
      jest.spyOn(runRepository, 'find').mockResolvedValue([])

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(workflowFinishedService.checkWorkflowHasFinished).not.toBeCalled()
      expect(workflowFinishedService.updateWorkflowData).not.toBeCalled()
      expect(runRepository.save).not.toBeCalled()
      expect(runRepository.update).not.toBeCalled()
    })

    it('should do nothing, if no argo run is associated to run', async () => {
      runs[0].argoId = undefined
      const localRuns = [runs[0]]

      jest.spyOn(runRepository, 'find').mockResolvedValue(localRuns)

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(workflowFinishedService.checkWorkflowHasFinished).not.toBeCalled()
      expect(workflowFinishedService.updateWorkflowData).not.toBeCalled()
      expect(runRepository.save).not.toBeCalled()
      expect(runRepository.update).not.toBeCalled()
    })

    it('should set a run to failed, if the timeout has been reached', async () => {
      runs[0].creationTime = new Date(0)
      const localRuns = [runs[0]]

      jest.spyOn(runRepository, 'find').mockResolvedValue(localRuns)

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(workflowFinishedService.checkWorkflowHasFinished).not.toBeCalled()
      expect(workflowFinishedService.updateWorkflowData).not.toBeCalled()
      expect(runRepository.save).toBeCalled()
      expect(runRepository.update).toBeCalled()
      expect(runs[0].status).toBe(RunStatus.Failed)
      expect(runs[0].log[0]).toStrictEqual('Failed due to timeout')
    })

    it('should do nothing, if a pending run is given', async () => {
      runs[0].status = RunStatus.Pending
      runs[0].argoId = undefined
      const localRuns = [runs[0]]

      jest.spyOn(runRepository, 'find').mockResolvedValue(localRuns)

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(workflowFinishedService.checkWorkflowHasFinished).not.toBeCalled()
      expect(workflowFinishedService.updateWorkflowData).not.toBeCalled()
      expect(runRepository.save).not.toBeCalled()
      expect(runRepository.update).not.toBeCalled()
    })

    it('should ensure, that only one task execution happens at any time', async () => {
      let finished = false
      const waitForIt = async () => {
        while (!finished) {
          await setTimeout(5)
        }
        return []
      }
      jest.spyOn(runRepository, 'find').mockImplementation(waitForIt)
      finishedWorkflowTask['handleRun'] = jest.fn()

      const promise = finishedWorkflowTask.checkFinishedWorkflows()

      finishedWorkflowTask['logger']['debug'] = jest.fn()
      finishedWorkflowTask.checkFinishedWorkflows()

      expect(finishedWorkflowTask['logger']['debug']).toBeCalledWith({
        msg: 'Previous workflow still running',
      })
      finished = true

      await promise
      expect(runRepository.find).toBeCalledTimes(1)
      expect(finishedWorkflowTask['handleRun']).not.toBeCalled()
      expect(finishedWorkflowTask['isRunning']).toBeFalsy()
    })

    it('should catch an exception thrown by checkWorkflowHasFinished', async () => {
      jest.spyOn(runRepository, 'find').mockResolvedValue(runs)
      jest
        .spyOn(workflowFinishedService, 'checkWorkflowHasFinished')
        .mockImplementation(async (argoId) => {
          if (argoId === '5885cdc9-9f70-4c17-a276-27c1fa6980ae') {
            throw new Error('status retrieval failed')
          } else {
            return { hasFinished: false }
          }
        })
      finishedWorkflowTask['logger']['warn'] = jest.fn()

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(workflowFinishedService.checkWorkflowHasFinished).toBeCalledTimes(
        2
      )
      expect(workflowFinishedService.updateWorkflowData).not.toBeCalled()
      expect(finishedWorkflowTask['logger']['warn']).toBeCalledWith({
        msg: 'Check of run 1000 (100:94) failed due to Error: status retrieval failed',
      })
      expect(runRepository.save).not.toBeCalled()
      expect(runRepository.update).not.toBeCalled()
    })

    it('should catch an exception thrown by updateWorkflowData', async () => {
      jest.spyOn(runRepository, 'find').mockResolvedValue(runs)
      jest
        .spyOn(workflowFinishedService, 'checkWorkflowHasFinished')
        .mockImplementation(async (argoId) => {
          if (argoId === '5885cdc9-9f70-4c17-a276-27c1fa6980ae') {
            return {
              status: argoStatusObject,
              hasFinished: true,
            }
          } else {
            return { hasFinished: false }
          }
        })
      jest
        .spyOn(workflowFinishedService, 'updateWorkflowData')
        .mockRejectedValue(new Error('updating workflow failed'))
      finishedWorkflowTask['logger']['warn'] = jest.fn()

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(workflowFinishedService.checkWorkflowHasFinished).toBeCalledTimes(
        2
      )
      expect(workflowFinishedService.updateWorkflowData).toBeCalledWith(
        { status: argoStatusObject, hasFinished: true },
        runs[0]
      )
      expect(finishedWorkflowTask['logger']['warn']).toBeCalledWith({
        msg: 'Check of run 1000 (100:94) failed due to Error: updating workflow failed',
      })
      expect(runRepository.save).not.toBeCalled()
      expect(runRepository.update).not.toBeCalled()
    })

    it('should handle errors in the database call to find running workflows', async () => {
      jest.spyOn(runRepository, 'find').mockRejectedValue(new Error())
      finishedWorkflowTask['handleRun'] = jest.fn()

      const promises = await finishedWorkflowTask.checkFinishedWorkflows()
      await Promise.all(promises)

      expect(runRepository.find).toBeCalledTimes(1)
      expect(finishedWorkflowTask['handleRun']).not.toBeCalled()
      expect(finishedWorkflowTask['isRunning']).toBeFalsy()
    })
  })
})
