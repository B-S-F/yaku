import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LoggerModule, PinoLogger, Logger } from 'nestjs-pino'
import { ListQueryHandler, SortOrder } from '@B-S-F/api-commons-lib'
import { Metric } from './entity/metric.entity'
import { GetMetricDTO } from './dto/getMetric.dto'
import { ServiceType } from './utils/enums/serviceType.enum'
import { StatusType } from '../findings/utils/enums/statusType.enum'
import {
  createMetricDTOFixtures,
  getFindingsDTOFixtures,
  updateFindingDTOFixtures,
} from './utils/fixture/data.fixture'

import { MetricService } from './metric.service'

describe('MetricService', () => {
  let metricRepository: Repository<Metric>
  let metricService: MetricService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        MetricService,
        {
          provide: getRepositoryToken(Metric),
          useClass: Repository,
        },
        { provide: PinoLogger, useValue: { pinoHttp: jest.fn() } },
        { provide: Logger, useValue: { debug: jest.fn(), error: jest.fn() } },
      ],
    }).compile()

    metricRepository = moduleRef.get(getRepositoryToken(Metric))
    metricService = moduleRef.get<MetricService>(MetricService)
  })

  afterEach(() => jest.clearAllMocks())

  describe('create', () => {
    it('should insert metric into db', async () => {
      const createMetricDTO = createMetricDTOFixtures[0]
      const newMetric: Metric = {
        ...createMetricDTO,
        id: 'metric-uuid',
        creationTime: new Date('2023'),
      }
      const expected = new GetMetricDTO(newMetric)

      jest.spyOn(metricRepository, 'create').mockReturnValueOnce(newMetric)
      const repositorySaveSpy = jest
        .spyOn(metricRepository, 'save')
        .mockResolvedValueOnce(newMetric)

      const result = await metricService.create(createMetricDTO)

      expect(repositorySaveSpy).toHaveBeenCalledWith(newMetric)
      expect(result).toStrictEqual(expected)
    })
  })

  describe('getNrOfFindings', () => {
    it('should retrieve GetFindingsDTO and item count', async () => {
      const namespaceId = 1
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )

      jest
        .spyOn(metricRepository, 'query')
        .mockResolvedValue(getFindingsDTOFixtures)

      const result = await metricService.getNrOfFindings(
        namespaceId,
        StatusType.UNRESOLVED,
        queryOptions
      )

      expect(result.entities).toStrictEqual(getFindingsDTOFixtures)
      expect(result.itemCount).toStrictEqual(getFindingsDTOFixtures.length)
      expect(result).toStrictEqual({
        entities: getFindingsDTOFixtures,
        itemCount: getFindingsDTOFixtures.length,
      })
    })
  })

  describe('getLatestRunNrOfFindings', () => {
    it('should retrieve GetFindingsDTO with the latest runs and item count', async () => {
      const namespaceId = 1
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )
      const data = [getFindingsDTOFixtures[2], getFindingsDTOFixtures[5]]

      jest.spyOn(metricRepository, 'query').mockResolvedValue(data)

      const result = await metricService.getLatestRunNrOfFindings(
        namespaceId,
        StatusType.UNRESOLVED,
        queryOptions
      )

      expect(result.entities).toStrictEqual(data)
      expect(result.itemCount).toStrictEqual(data.length)
      expect(result).toStrictEqual({ entities: data, itemCount: data.length })
    })
  })

  describe('getNrOfFindingsByConfigId', () => {
    it('should retrieve GetFindingsDTO and item count', async () => {
      const namespaceId = 1
      const configId = 1
      const dataFixture = getFindingsDTOFixtures.filter(
        (item) => item.configId === configId
      )
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )

      jest.spyOn(metricRepository, 'query').mockResolvedValue(dataFixture)

      const result = await metricService.getNrOfFindingsByConfigId(
        namespaceId,
        StatusType.UNRESOLVED,
        configId,
        queryOptions
      )

      expect(result.entities).toStrictEqual(dataFixture)
      expect(result.itemCount).toStrictEqual(dataFixture.length)
      expect(result).toStrictEqual({
        entities: dataFixture,
        itemCount: dataFixture.length,
      })
    })
  })

  describe('getNrOfFindingsInRange', () => {
    it('should retrieve GetFindingsDTO and item count', async () => {
      const namespaceId = 1
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )
      const startRange = '2023'
      const endRange = '2023'

      jest
        .spyOn(metricRepository, 'query')
        .mockResolvedValue(getFindingsDTOFixtures)

      const result = await metricService.getNrOfFindingsInRange(
        namespaceId,
        StatusType.UNRESOLVED,
        startRange,
        endRange,
        queryOptions
      )

      expect(result.entities).toStrictEqual(getFindingsDTOFixtures)
      expect(result.itemCount).toStrictEqual(getFindingsDTOFixtures.length)
      expect(result).toStrictEqual({
        entities: getFindingsDTOFixtures,
        itemCount: getFindingsDTOFixtures.length,
      })
    })

    it('should throw error when range is not a valid date', async () => {
      const namespaceId = 1
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )
      const startRange = ''
      const endRange = '2023'

      const repositorySpy = jest
        .spyOn(metricRepository, 'query')
        .mockResolvedValue(getFindingsDTOFixtures)

      const result = metricService.getNrOfFindingsInRange(
        namespaceId,
        StatusType.UNRESOLVED,
        startRange,
        endRange,
        queryOptions
      )

      await expect(result).rejects.toThrow(new BadRequestException())
      expect(repositorySpy).not.toHaveBeenCalled()
    })
  })

  describe('getNrOfFindingsInRangeByConfigId', () => {
    it('should retrieve GetFindingsDTO and item count', async () => {
      const namespaceId = 1
      const configId = 1
      const dataFixture = getFindingsDTOFixtures.filter(
        (item) => item.configId === configId
      )
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )
      const startRange = '2023'
      const endRange = '2023'

      jest.spyOn(metricRepository, 'query').mockResolvedValue(dataFixture)

      const result = await metricService.getNrOfFindingsInRangeByConfigId(
        namespaceId,
        StatusType.UNRESOLVED,
        startRange,
        endRange,
        configId,
        queryOptions
      )

      expect(result.entities).toStrictEqual(dataFixture)
      expect(result.itemCount).toStrictEqual(dataFixture.length)
      expect(result).toStrictEqual({
        entities: dataFixture,
        itemCount: dataFixture.length,
      })
    })

    it('should throw an error when range is not a valid date', async () => {
      const namespaceId = 1
      const configId = 1
      const dataFixture = getFindingsDTOFixtures.filter(
        (item) => item.configId === configId
      )
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )
      const startRange = ''
      const endRange = '2023'

      const repositorySpy = jest
        .spyOn(metricRepository, 'query')
        .mockResolvedValue(dataFixture)

      const result = metricService.getNrOfFindingsInRangeByConfigId(
        namespaceId,
        StatusType.UNRESOLVED,
        startRange,
        endRange,
        configId,
        queryOptions
      )

      await expect(result).rejects.toThrow(new BadRequestException())
      expect(repositorySpy).not.toHaveBeenCalled()
    })
  })

  describe('getLatestRunNrOfFindingsInRange', () => {
    it('should retrieve GetFindingsDTO and item count', async () => {
      const namespaceId = 1
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )
      const data = [getFindingsDTOFixtures[2], getFindingsDTOFixtures[5]]
      const startRange = '2023'
      const endRange = '2023'

      jest.spyOn(metricRepository, 'query').mockResolvedValue(data)

      const result = await metricService.getLatestRunNrOfFindingsInRange(
        namespaceId,
        StatusType.UNRESOLVED,
        startRange,
        endRange,
        queryOptions
      )

      expect(result.entities).toStrictEqual(data)
      expect(result.itemCount).toStrictEqual(data.length)
      expect(result).toStrictEqual({
        entities: data,
        itemCount: data.length,
      })
    })

    it('should throw error when range is not a valid date', async () => {
      const namespaceId = 1
      const queryOptions = new ListQueryHandler(
        1,
        20,
        SortOrder.ASC,
        'configId'
      )
      const startRange = ''
      const endRange = '2023'

      const repositorySpy = jest
        .spyOn(metricRepository, 'query')
        .mockResolvedValue(getFindingsDTOFixtures)

      const result = metricService.getLatestRunNrOfFindingsInRange(
        namespaceId,
        StatusType.UNRESOLVED,
        startRange,
        endRange,
        queryOptions
      )

      await expect(result).rejects.toThrow(new BadRequestException())
      expect(repositorySpy).not.toHaveBeenCalled()
    })
  })

  describe('updateFindingMetric', () => {
    it('should update a Finding metric', async () => {
      const namespaceId = 1
      const findingId = '1'
      const updateFindingDTO = updateFindingDTOFixtures[0]
      const metric: Metric = {
        service: ServiceType.FINDINGS,
        metric: { id: findingId, ...updateFindingDTO },
        id: 'metric-uuid',
        creationTime: new Date('2023'),
      }
      const expected = new GetMetricDTO(metric)

      const repositorySpy = jest
        .spyOn(metricRepository, 'createQueryBuilder')
        .mockImplementation((): any => {
          const createQueryBuilder: any = {
            update: jest.fn().mockImplementation(() => {
              return createQueryBuilder
            }),
            set: jest.fn().mockImplementation(() => {
              return createQueryBuilder
            }),
            where: jest.fn().mockImplementation(() => {
              return createQueryBuilder
            }),
            andWhere: jest.fn().mockImplementation(() => {
              return createQueryBuilder
            }),
            execute: jest.fn().mockResolvedValue({ affected: 1 }),
          }
          return createQueryBuilder
        })
      jest.spyOn(metricRepository, 'findOneBy').mockResolvedValue(metric)

      const result = await metricService.updateFindingMetric(
        namespaceId,
        findingId,
        updateFindingDTO
      )
      expect(result).toStrictEqual(expected)
      expect(repositorySpy).toHaveBeenCalled()
    })

    it('should throw error when metric is not found', async () => {
      const namespaceId = 1
      const findingId = 'finding-uuid'
      const updateFindingDTO: any = {
        status: StatusType.RESOLVED,
        severity: 'severity?',
        namespaceId,
        configId: 1,
        runId: 1,
        updated: new Date(),
      }
      const repositorySpy = jest
        .spyOn(metricRepository, 'createQueryBuilder')
        .mockImplementation((): any => {
          const createQueryBuilder: any = {
            update: jest.fn().mockImplementation(() => {
              return createQueryBuilder
            }),
            set: jest.fn().mockImplementation(() => {
              return createQueryBuilder
            }),
            where: jest.fn().mockImplementation(() => {
              return createQueryBuilder
            }),
            andWhere: jest.fn().mockImplementation(() => {
              return createQueryBuilder
            }),
            execute: jest.fn().mockResolvedValue({ affected: 0 }),
          }
          return createQueryBuilder
        })

      const result = metricService.updateFindingMetric(
        namespaceId,
        findingId,
        updateFindingDTO
      )

      await expect(result).rejects.toThrow(
        new NotFoundException(
          `Metric of Finding with id: ${findingId} not found in run ${updateFindingDTO.runId}`
        )
      )
      expect(repositorySpy).toHaveBeenCalled
    })
  })
})
