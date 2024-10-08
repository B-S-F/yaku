import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'crypto'
import { ArgoConfig, ArgoService } from './argo.service'

describe('ArgoService', () => {
  let service: ArgoService

  const fetchResult = {
    json: jest.fn(),
    text: jest.fn(),
  } as any

  const namespace = 'some test string'
  const server = 'http://localhost:2746'
  const baseUri = `${server}/api/v1/`
  const workflowUri = `${baseUri}workflows/`

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArgoService,
        {
          provide: ArgoConfig,
          useFactory: () => new ArgoConfig(namespace, server),
        },
      ],
    }).compile()

    service = module.get<ArgoService>(ArgoService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('Start a workflow', () => {
    const data = 'Workflow description'

    it('should start a workflow as expected', async () => {
      global.fetch = jest.fn().mockImplementation((url, config) => {
        return {
          ...fetchResult,
          json: jest.fn().mockResolvedValue({ metadata: { url, config } }),
          status: 201,
        } as any
      })

      const result = await service.startWorkflow(data)

      expect(result).toEqual({
        url: `${workflowUri}${namespace}`,
        config: {
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/json' },
        },
        namespace,
      })
      expect(fetchResult.json).not.toBeCalled()
    })

    it('should handle an error status received and throw an error', async () => {
      global.fetch = jest.fn().mockImplementation((url, config) => {
        return {
          ...fetchResult,
          text: jest.fn().mockResolvedValue('Test Error'),
          status: 400,
        } as any
      })

      await expect(service.startWorkflow(data)).rejects.toThrow(
        `Calling ${workflowUri}${namespace} resulted in 400 with message Test Error`
      )
      expect(fetchResult.json).not.toBeCalled()
    })

    it('should pass an error thrown by fetch', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'))

      await expect(service.startWorkflow(data)).rejects.toThrow('fetch failed')
    })

    it('should handle a non-existing fetch result with a thrown error', async () => {
      global.fetch = jest.fn().mockResolvedValue(null)

      await expect(service.startWorkflow(data)).rejects.toThrow(
        `Calling ${workflowUri}${namespace} did not return a result`
      )
    })
  })

  describe('Get workflow status', () => {
    const workflowName = 'foo'
    const workflowNamespace = 'bar'
    const workflowId = randomUUID()

    it('should return a valid status from active workflows', async () => {
      global.fetch = jest.fn().mockImplementation((url, config) => {
        return {
          ...fetchResult,
          json: jest.fn().mockResolvedValue({ status: { url, config } }),
          status: 200,
        } as any
      })

      const result = await service.getWorkflowStatus(
        workflowName,
        workflowNamespace
      )

      expect(result).toEqual({
        url: `${workflowUri}${workflowNamespace}/${workflowName}`,
        config: {
          method: 'GET',
        },
      })
      expect(fetchResult.text).not.toBeCalled()
    })

    it('should return a valid status from archived workflows', async () => {
      global.fetch = jest.fn().mockImplementation((url, config) => {
        return {
          ...fetchResult,
          json: jest.fn().mockResolvedValue({ status: { url, config } }),
          status: 200,
        } as any
      })

      const result = await service.getArchivedWorkflowStatus(workflowId)

      expect(result).toEqual({
        url: `${baseUri}archived-workflows/${workflowId}`,
        config: {
          method: 'GET',
        },
      })
      expect(fetchResult.text).not.toBeCalled()
    })

    it('should return null if status is not found', async () => {
      global.fetch = jest.fn().mockImplementation((url, config) => {
        return {
          ...fetchResult,
          status: 404,
        }
      })

      const result = await service.getArchivedWorkflowStatus(workflowId)

      expect(result).toEqual(null)
      expect(fetchResult.json).not.toBeCalled()
      expect(fetchResult.text).not.toBeCalled()
    })

    it('should handle an error status received and throw an error', async () => {
      global.fetch = jest.fn().mockImplementation((url, config) => {
        return {
          ...fetchResult,
          text: jest.fn().mockResolvedValue('Test Error'),
          status: 400,
        } as any
      })

      await expect(
        service.getWorkflowStatus(workflowName, workflowNamespace)
      ).rejects.toThrow(
        `Calling ${workflowUri}${workflowNamespace}/${workflowName} resulted in 400 with message Test Error`
      )
      expect(fetchResult.json).not.toBeCalled()
    })

    it('should pass an error thrown by fetch', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'))

      await expect(
        service.getArchivedWorkflowStatus(workflowId)
      ).rejects.toThrow('fetch failed')
    })

    it('should handle a non-existing fetch result with a thrown error', async () => {
      global.fetch = jest.fn().mockResolvedValue(null)

      await expect(
        service.getWorkflowStatus(workflowName, workflowNamespace)
      ).rejects.toThrow(
        `Calling ${workflowUri}${workflowNamespace}/${workflowName} did not return a result`
      )
    })
  })

  describe('Get workflow logs', () => {
    const workflowName = 'foo'
    const workflowNamespace = 'bar'

    it.each(['main', 'init', 'wait'])(
      'should return a log for a workflow',
      async (container: 'main' | 'init' | 'wait') => {
        const logString = 'Great log content to be received from call'
        const detailedFetchResult = {
          ...fetchResult,
          text: jest.fn().mockResolvedValue(logString),
          status: 200,
        } as any

        global.fetch = jest.fn().mockResolvedValue(detailedFetchResult)

        const result = await service.getWorkflowLogs(
          workflowName,
          workflowNamespace,
          container
        )

        expect(result).toBe(logString)
        expect(global.fetch).toBeCalledWith(
          `${workflowUri}${workflowNamespace}/${workflowName}/log?logOptions.container=${container}&logOptions.follow=true`,
          {
            method: 'GET',
          }
        )
        expect(fetchResult.json).not.toBeCalled()
      }
    )

    it('should return a null value in case no logs are found (404 return value)', async () => {
      global.fetch = jest.fn().mockImplementation((url, config) => {
        return {
          ...fetchResult,
          text: jest.fn().mockResolvedValue('Test Error'),
          status: 404,
        } as any
      })

      const result = await service.getWorkflowLogs(
        workflowName,
        workflowNamespace,
        'main'
      )

      expect(result).toBeNull()
      expect(fetchResult.json).not.toBeCalled()
      expect(fetchResult.text).not.toBeCalled()
    })

    it('should handle an error status received and throw an error', async () => {
      global.fetch = jest.fn().mockImplementation((url, config) => {
        return {
          ...fetchResult,
          text: jest.fn().mockResolvedValue('Test Error'),
          status: 400,
        } as any
      })

      await expect(
        service.getWorkflowLogs(workflowName, workflowNamespace)
      ).rejects.toThrow(
        `Calling ${workflowUri}${workflowNamespace}/${workflowName}/log?logOptions.container=main&logOptions.follow=true resulted in 400 with message Test Error`
      )
      expect(fetchResult.json).not.toBeCalled()
    })

    it('should pass an error thrown by fetch', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'))

      await expect(
        service.getWorkflowLogs(workflowName, workflowNamespace)
      ).rejects.toThrow('fetch failed')
    })

    it('should handle a non-existing fetch result with a thrown error', async () => {
      global.fetch = jest.fn().mockResolvedValue(null)

      await expect(
        service.getWorkflowLogs(workflowName, workflowNamespace)
      ).rejects.toThrow(
        `Calling ${workflowUri}${workflowNamespace}/${workflowName}/log?logOptions.container=main&logOptions.follow=true did not return a result`
      )
    })

    it('should handle an unknown container name', async () => {
      await expect(
        service.getWorkflowLogs(
          workflowName,
          workflowNamespace,
          'unknown' as any
        )
      ).rejects.toThrow('Unknown container name')
    })
  })
})
