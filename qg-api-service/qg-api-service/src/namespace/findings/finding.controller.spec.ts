import { Test, TestingModule } from '@nestjs/testing'
import { FindingController } from './finding.controller'
import { FindingService } from './finding.service'
import { Repository } from 'typeorm'
import { Finding } from './entity/finding.entity'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Metric } from '../metrics/entity/metric.entity'
import { MetricService } from '../metrics/metric.service'
import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { UsersService } from '../users/users.service'
describe('FindingController', () => {
  let findingController: FindingController
  let findingService: FindingService
  let findingRepository: Repository<any>
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [FindingController],
      providers: [
        FindingService,
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Finding),
          useClass: Repository,
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
        UrlHandlerFactory,
        {
          provide: UrlProtocolConfig,
          useValue: {
            serviceProtocol: 'https',
          },
        },
      ],
    }).compile()

    findingController = moduleRef.get<FindingController>(FindingController)
    findingService = moduleRef.get<FindingService>(FindingService)
    findingRepository = moduleRef.get(getRepositoryToken(Finding))
  })

  describe('deleteFinding', () => {
    it('should delete the finding', async () => {
      const namespaceId = 1
      const findingId = '123'
      const res = { locals: { namespaceIds: [1] } }
      jest
        .spyOn(findingRepository, 'delete')
        .mockResolvedValue({ affected: 1 } as any)
      jest.spyOn(Array.prototype, 'includes').mockReturnValueOnce(true)
      jest
        .spyOn(findingService, 'deleteFinding')
        .mockReturnValueOnce({ deleted: true } as any)
      const result = await findingController.deleteFinding(
        namespaceId,
        findingId
      )
      expect(result).toEqual({ deleted: true })
    })
  })
  describe('updateFinding', () => {
    it('should update the finding', async () => {
      const namespaceId = 1
      const findingId = '123'
      const res = { locals: { namespaceIds: [1] } }
      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any)
      jest.spyOn(Array.prototype, 'includes').mockReturnValueOnce(true)
      jest.spyOn(findingService, 'updateFinding').mockReturnValueOnce({} as any)
      const result = await findingController.updateFinding(
        namespaceId,
        findingId,
        {}
      )
      expect(result).toEqual({})
    })
  })

  describe('getFindingById', () => {
    it('should get the finding by id', async () => {
      const namespaceId = 1
      const findingId = '123'
      const res = { locals: { namespaceIds: [1] } }
      jest.spyOn(findingRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({}),
      } as any)
      jest.spyOn(Array.prototype, 'includes').mockReturnValueOnce(true)
      jest
        .spyOn(findingService, 'getFindingById')
        .mockReturnValueOnce({} as any)
      const result = await findingController.getFindingById(
        namespaceId,
        findingId
      )
      expect(result).toEqual({})
    })
  })
})
