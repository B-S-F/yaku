import { Test, TestingModule } from '@nestjs/testing'
import { Logger, PinoLogger, LoggerModule } from 'nestjs-pino'
import {
  UrlHandlerFactory,
  UrlProtocolConfig,
  createMockResponse,
} from '@B-S-F/api-commons-lib'
import { MetricService } from './metric.service'
import { getFindingsDTOFixtures } from './utils/fixture/data.fixture'

import { MetricController } from './metric.controller'
import { testUser, baseUrl } from '../../gp-services/test-services'

describe('MetricController', () => {
  let controller: MetricController
  let service: MetricService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      controllers: [MetricController],
      providers: [
        UrlHandlerFactory,
        {
          provide: UrlProtocolConfig,
          useValue: {
            serviceProtocol: 'https',
          },
        },
        {
          provide: MetricService,
          useValue: {
            getNrOfFindings: jest.fn(),
            getNrOfFindingsByConfigId: jest.fn(),
            getLatestRunNrOfFindings: jest.fn(),
            getNrOfFindingsInRange: jest.fn(),
            getNrOfFindingsInRangeByConfigId: jest.fn(),
            getLatestRunNrOfFindingsInRange: jest.fn(),
          },
        },
        { provide: PinoLogger, useValue: { pinoHttp: jest.fn() } },
        { provide: Logger, useValue: { debug: jest.fn(), error: jest.fn() } },
      ],
    }).compile()

    controller = moduleRef.get<MetricController>(MetricController)
    service = moduleRef.get<MetricService>(MetricService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findings', () => {
    it('should get findings', async () => {
      const namespaceId = 1
      const queryOptions = {}
      const response = createMockResponse(
        `${baseUrl}/metrics/findings`,
        testUser
      )
      const links = {
        first: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/findings?page=1&items=20`,
        last: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/findings?page=1&items=20`,
      }
      const pagination = {
        pageNumber: 1,
        pageSize: getFindingsDTOFixtures.length,
        totalCount: getFindingsDTOFixtures.length,
      }
      const expected = { data: getFindingsDTOFixtures, links, pagination }

      jest.spyOn(service, 'getNrOfFindings').mockResolvedValueOnce({
        entities: getFindingsDTOFixtures,
        itemCount: getFindingsDTOFixtures.length,
      })

      const result = await controller.getFindings(
        namespaceId,
        queryOptions,
        response
      )

      expect(result).toStrictEqual(expected)
    })

    it('should get findings based on configId query option', async () => {
      const dataFixtures = getFindingsDTOFixtures.slice(3)
      const namespaceId = 1
      const queryOptions = { configId: 2 }
      const response = createMockResponse(
        `${baseUrl}/metrics/findings`,
        testUser
      )
      const links = {
        first: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/findings?page=1&items=20`,
        last: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/findings?page=1&items=20`,
      }
      const pagination = {
        pageNumber: 1,
        pageSize: dataFixtures.length,
        totalCount: dataFixtures.length,
      }
      const expected = { data: dataFixtures, links, pagination }

      jest.spyOn(service, 'getNrOfFindingsByConfigId').mockResolvedValueOnce({
        entities: dataFixtures,
        itemCount: dataFixtures.length,
      })

      const result = await controller.getFindings(
        namespaceId,
        queryOptions,
        response
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when sortBy query parameter is not a valid property', async () => {
      const namespaceId = 1
      const queryOptions = { sortBy: 'invalidProperty' }
      const response = createMockResponse(
        `${baseUrl}/metrics/findings`,
        testUser
      )

      const result = controller.getFindings(namespaceId, queryOptions, response)

      await expect(result).rejects.toThrow()
    })
  })

  describe('findingsInRange', () => {
    it('should get findings in range', async () => {
      const namespaceId = 1
      const queryOptions = {
        startRange: '1970-01-01 00:00:00',
        endRange: '2038-01-19 03:14:07',
      }
      const response = createMockResponse(
        `${baseUrl}/metrics/findingsInRange`,
        testUser
      )
      const links = {
        first: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/findingsInRange?page=1&items=20`,
        last: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/findingsInRange?page=1&items=20`,
      }
      const pagination = {
        pageNumber: 1,
        pageSize: getFindingsDTOFixtures.length,
        totalCount: getFindingsDTOFixtures.length,
      }
      const expected = { data: getFindingsDTOFixtures, links, pagination }

      jest.spyOn(service, 'getNrOfFindingsInRange').mockResolvedValueOnce({
        entities: getFindingsDTOFixtures,
        itemCount: getFindingsDTOFixtures.length,
      })

      const result = await controller.getFindingsInRange(
        namespaceId,
        queryOptions,
        response
      )

      expect(result).toStrictEqual(expected)
    })

    it('should get findings in range based on configId query option', async () => {
      const dataFixtures = getFindingsDTOFixtures.slice(3)
      const namespaceId = 1
      const queryOptions = {
        configId: 2,
        startRange: '1970-01-01 00:00:00',
        endRange: '2038-01-19 03:14:07',
      }
      const response = createMockResponse(
        `${baseUrl}/metrics/findingsInRange`,
        testUser
      )
      const links = {
        first: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/findingsInRange?page=1&items=20`,
        last: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/findingsInRange?page=1&items=20`,
      }
      const pagination = {
        pageNumber: 1,
        pageSize: dataFixtures.length,
        totalCount: dataFixtures.length,
      }
      const expected = { data: dataFixtures, links, pagination }

      jest
        .spyOn(service, 'getNrOfFindingsInRangeByConfigId')
        .mockResolvedValueOnce({
          entities: dataFixtures,
          itemCount: dataFixtures.length,
        })

      const result = await controller.getFindingsInRange(
        namespaceId,
        queryOptions,
        response
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when startRange is not a valid date', async () => {
      const namespaceId = 1
      const queryOptions = {
        startRange: 'invalid startRange',
        endRange: '2038-01-19 03:14:07',
      }
      const response = createMockResponse(
        `${baseUrl}/metrics/findingsInRange`,
        testUser
      )

      const result = controller.getFindingsInRange(
        namespaceId,
        queryOptions,
        response
      )

      await expect(result).rejects.toThrow()
    })
  })

  describe('latestRunFindings', () => {
    it('should get findings of latest run', async () => {
      const dataFixtures = [
        getFindingsDTOFixtures[2],
        getFindingsDTOFixtures[5],
      ]
      const namespaceId = 1
      const queryOptions = {}
      const response = createMockResponse(
        `${baseUrl}/metrics/latestRunFindings`,
        testUser
      )
      const links = {
        first: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/latestRunFindings?page=1&items=20`,
        last: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/latestRunFindings?page=1&items=20`,
      }
      const pagination = {
        pageNumber: 1,
        pageSize: dataFixtures.length,
        totalCount: dataFixtures.length,
      }
      const expected = { data: dataFixtures, links, pagination }

      jest.spyOn(service, 'getLatestRunNrOfFindings').mockResolvedValueOnce({
        entities: dataFixtures,
        itemCount: dataFixtures.length,
      })

      const result = await controller.getLatestRunFindings(
        namespaceId,
        queryOptions,
        response
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when sortBy query parameter is not a valid property', async () => {
      const namespaceId = 1
      const queryOptions = {
        sortBy: 'invalidProperty',
        startRange: '1970-01-01 00:00:00',
        endRange: '2038-01-19 03:14:07',
      }
      const response = createMockResponse(
        `${baseUrl}/metrics/latestRunFindings`,
        testUser
      )

      const result = controller.getLatestRunFindings(
        namespaceId,
        queryOptions,
        response
      )

      await expect(result).rejects.toThrow()
    })
  })

  describe('latestRunFindingsInRange', () => {
    it('should get findings of latest run', async () => {
      const dataFixtures = [
        getFindingsDTOFixtures[2],
        getFindingsDTOFixtures[5],
      ]
      const namespaceId = 1
      const queryOptions = {
        startRange: '1970-01-01 00:00:00',
        endRange: '2038-01-19 03:14:07',
      }
      const response = createMockResponse(
        `${baseUrl}/metrics/latestRunFindingsInRange`,
        testUser
      )
      const links = {
        first: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/latestRunFindingsInRange?page=1&items=20`,
        last: `https://localhost:3000/api/v1/namespaces/${namespaceId}/metrics/latestRunFindingsInRange?page=1&items=20`,
      }
      const pagination = {
        pageNumber: 1,
        pageSize: dataFixtures.length,
        totalCount: dataFixtures.length,
      }
      const expected = { data: dataFixtures, links, pagination }

      jest
        .spyOn(service, 'getLatestRunNrOfFindingsInRange')
        .mockResolvedValueOnce({
          entities: dataFixtures,
          itemCount: dataFixtures.length,
        })

      const result = await controller.getLatestRunFindingsInRange(
        namespaceId,
        queryOptions,
        response
      )

      expect(result).toStrictEqual(expected)
    })

    it('should throw an error when endRange is not a valid date', async () => {
      const namespaceId = 1
      const queryOptions = {
        startRange: '1970-01-01 00:00:00',
        endRange: 'invalid endRange',
      }
      const response = createMockResponse(
        `${baseUrl}/metrics/latestRunFindingsInRange`,
        testUser
      )

      const result = controller.getLatestRunFindingsInRange(
        namespaceId,
        queryOptions,
        response
      )

      await expect(result).rejects.toThrow()
    })
  })
})
