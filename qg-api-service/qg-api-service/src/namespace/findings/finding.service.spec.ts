import { Test, TestingModule } from '@nestjs/testing'
import { FindingService } from './finding.service'
import { Repository } from 'typeorm'
import { GetFindingDTO } from './dto/get-finding.dto'
import { CreateFindingDTO } from './dto/create-finding.dto'
import { UpdateFindingDTO } from './dto/update-finding.dto'
import {
  NotFoundException,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { RunOverallStatusType } from './utils/enums/runOverallStatusType.enum'
import { StatusType } from './utils/enums/statusType.enum'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Finding } from './entity/finding.entity'
import { FindingQgResult, Run } from './utils/interfaces/qgRunMessageInterfaces'
import { HashFields } from './utils/interfaces/findingsInterfaces'

import * as functions from './utils/functions'
import { Metric } from '../metrics/entity/metric.entity'
import { MetricService } from '../metrics/metric.service'
import { EntityList } from '@B-S-F/api-commons-lib'
import { RunStatus } from '../run/run.entity'
import { SYSTEM_USER, UsersService } from '../users/users.service'
import { UserInNamespaceDto } from '../users/users.utils'

describe('FindingService', () => {
  let findingService: FindingService
  let findingRepository: Repository<any>
  let usersService: UsersService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FindingService,
        {
          provide: getRepositoryToken(Finding),
          useClass: Repository,
        },
        {
          provide: MetricService,
          useValue: {
            create: jest.fn(),
            updateFindingMetric: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Metric),
          useClass: Repository,
        },
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn(),
          },
        },
      ],
    }).compile()

    findingService = moduleRef.get<FindingService>(FindingService)
    findingRepository = moduleRef.get(getRepositoryToken(Finding))
    usersService = moduleRef.get<UsersService>(UsersService)
  })

  describe('getFindingById', () => {
    it('should return a finding by ID', async () => {
      const namespaceId = 1
      const findingId = '123'
      const expectedFinding: GetFindingDTO = {
        id: '123',
        namespaceId: 1,
        configId: 1,
        runId: 16,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'PDF signature',
        justification: 'PDF document: XC_CC.pdf was not signed by Michael',
        chapter: '1',
        requirement: '1',
        check: '1',
        uniqueIdHash: '',
        metadata: undefined,
        occurrenceCount: 1,
      }

      jest.spyOn(findingRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(expectedFinding),
      } as any)

      const result = await findingService.getFindingById(namespaceId, findingId)

      expect(result).toEqual(expectedFinding)
    })

    it('should throw a NotFoundException if finding is not found', async () => {
      const namespaceId = 1
      const findingId = '123'

      jest.spyOn(findingRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(undefined),
      } as any)

      await expect(
        findingService.getFindingById(namespaceId, findingId)
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('createFinding', () => {
    it('should create a new finding', async () => {
      const namespaceId = 1
      const createFindingDto: CreateFindingDTO = {
        configId: 1,
        runId: 16,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        metadata: {},
      }

      const existingFinding: GetFindingDTO = {
        id: 'existing_id',
        namespaceId: 1,
        configId: 1,
        runId: 16,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        uniqueIdHash: '',
        metadata: {},
        occurrenceCount: 1,
        resolver: undefined,
      }
      const hashData: HashFields = { ...createFindingDto, namespaceId }
      const hash = functions.generateHash(hashData)

      jest
        .spyOn(findingRepository, 'createQueryBuilder')
        .mockReturnValueOnce({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(undefined),
        } as any)
        .mockReturnValueOnce({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(existingFinding),
        } as any)

      jest.spyOn(findingRepository, 'create').mockReturnValue(createFindingDto)
      jest
        .spyOn(findingRepository, 'save')
        .mockResolvedValue({ ...createFindingDto, id: 'new_id' })

      const result = await findingService.createFinding(
        namespaceId,
        createFindingDto,
        hash
      )

      expect(result).toEqual({ ...createFindingDto, id: 'new_id' })
    })

    it('should identify already existing finding and skip creation', async () => {
      const namespaceId = 1
      const createFindingDto: CreateFindingDTO = {
        configId: 1,
        runId: 17,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        metadata: {},
      }

      const existingFinding: GetFindingDTO = {
        id: 'existing_id',
        namespaceId: 1,
        configId: 1,
        runId: 16,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        uniqueIdHash: '',
        metadata: {},
        occurrenceCount: 1,
        resolver: undefined,
      }

      jest.spyOn(findingRepository, 'createQueryBuilder').mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingFinding),
      } as any)

      jest.spyOn(findingService, 'handleFindingOccurrence').mockResolvedValue({
        id: 'existing_id',
        namespaceId: 1,
        configId: 1,
        runId: 17,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        uniqueIdHash: '',
        metadata: {},
        occurrenceCount: 2,
        resolver: undefined,
      })
      const hashData: HashFields = { ...createFindingDto, namespaceId }
      const hash = functions.generateHash(hashData)

      const result = await findingService.createFinding(
        namespaceId,
        createFindingDto,
        hash
      )

      expect(result).toEqual({
        id: 'existing_id',
        namespaceId: 1,
        configId: 1,
        runId: 17,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        uniqueIdHash: '',
        metadata: {},
        occurrenceCount: 2,
        resolver: undefined,
      })
    })

    it('should throw an error if it fails to handle existing findings', async () => {
      const namespaceId = 1
      const createFindingDto: CreateFindingDTO = {
        configId: 1,
        runId: 17,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        metadata: {},
      }
      const hashData: HashFields = { ...createFindingDto, namespaceId }
      const hash = functions.generateHash(hashData)

      jest.spyOn(findingRepository, 'createQueryBuilder').mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'test' }),
      } as any)
      jest
        .spyOn(findingService, 'handleFindingOccurrence')
        .mockImplementationOnce(() => {
          throw new Error('some error message')
        })

      await expect(
        findingService.createFinding(namespaceId, createFindingDto, hash)
      ).rejects.toThrow(Error)
    })
  })

  describe('updateFinding', () => {
    it.each([
      [
        SYSTEM_USER.displayName,
        SYSTEM_USER.username,
        SYSTEM_USER.id,
        SYSTEM_USER.email,
        false,
      ],
      [
        SYSTEM_USER.displayName,
        SYSTEM_USER.username,
        SYSTEM_USER.id,
        SYSTEM_USER.email,
        false,
      ],
      [
        'Domain User',
        'user@domain.com',
        'dd971090-c29e-4102-999b-d843afad603b',
        'user@domain.com',
        true,
      ],
    ])(
      'should update a finding with id',
      async (displayName, username, id, email, resolvedManually) => {
        const namespaceId = 1
        const findingId = '123'
        const updateFindingDto: UpdateFindingDTO = {
          status: 'resolved' as StatusType,
          resolver: id,
          occurrenceCount: 2,
          runId: 17,
        }
        const updatedFinding: Finding = {
          id: '123',
          namespaceId: 1,
          configId: 1,
          runId: 17,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-13T12:44:44.000Z',
          status: 'resolved' as StatusType,
          resolvedComment: null,
          criterion: 'Trivy found security breaches',
          justification:
            'CVE 332211 of package nodejs needs to be solved asap.',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          resolver: id,
          uniqueIdHash: '',
          metadata: undefined,
          occurrenceCount: 2,
          createdAt: new Date('2023-08-22T00:00:00Z'),
          updatedAt: new Date('2023-08-22T00:00:00Z'),
        }
        const user = new UserInNamespaceDto()
        user.id = id
        user.username = username
        user.displayName = displayName
        user.email = email
        const returnedDto: GetFindingDTO = {
          id: '123',
          namespaceId: 1,
          configId: 1,
          runId: 17,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-13T12:44:44.000Z',
          status: 'resolved' as StatusType,
          resolvedComment: null,
          criterion: 'Trivy found security breaches',
          justification:
            'CVE 332211 of package nodejs needs to be solved asap.',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          resolvedDate: undefined,
          resolvedManually: resolvedManually,
          resolver: user,
          uniqueIdHash: '',
          metadata: undefined,
          occurrenceCount: 2,
          createdAt: new Date('2023-08-22T00:00:00Z'),
          updatedAt: new Date('2023-08-22T00:00:00Z'),
        }

        jest
          .spyOn(findingRepository, 'update')
          .mockResolvedValue({ affected: 1 } as any)
        jest.spyOn(findingRepository, 'createQueryBuilder').mockReturnValue({
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(updatedFinding),
        } as any)
        jest
          .spyOn(findingRepository, 'findOneBy')
          .mockResolvedValue(updatedFinding)
        jest.spyOn(usersService, 'getUser').mockResolvedValue(user)

        const result = await findingService.updateFinding(
          namespaceId,
          findingId,
          updateFindingDto
        )

        expect(result).toEqual(returnedDto)
      }
    )

    it.each([
      [
        SYSTEM_USER.displayName,
        SYSTEM_USER.username,
        SYSTEM_USER.id,
        SYSTEM_USER.email,
        false,
      ],
      [
        SYSTEM_USER.displayName,
        SYSTEM_USER.username,
        SYSTEM_USER.id,
        SYSTEM_USER.email,
        false,
      ],
      [
        'User Domain',
        'user@domain.com',
        'user@domain.com',
        'dd971090-c29e-4102-999b-d843afad603b',
        true,
      ],
    ])(
      'should update a finding with username',
      async (displayName, username, id, email, resolvedManually) => {
        const namespaceId = 1
        const findingId = '123'
        const updateFindingDto: UpdateFindingDTO = {
          status: 'resolved' as StatusType,
          resolver: username,
          occurrenceCount: 2,
          runId: 17,
        }
        const updatedFinding: Finding = {
          id: '123',
          namespaceId: 1,
          configId: 1,
          runId: 17,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-13T12:44:44.000Z',
          status: 'resolved' as StatusType,
          resolvedComment: null,
          criterion: 'Trivy found security breaches',
          justification:
            'CVE 332211 of package nodejs needs to be solved asap.',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          resolver: id,
          uniqueIdHash: '',
          metadata: undefined,
          occurrenceCount: 2,
          createdAt: new Date('2023-08-22T00:00:00Z'),
          updatedAt: new Date('2023-08-22T00:00:00Z'),
        }

        const user = new UserInNamespaceDto()
        user.id = id
        user.username = username
        user.displayName = displayName
        user.email = email
        const returnedDto: GetFindingDTO = {
          id: '123',
          namespaceId: 1,
          configId: 1,
          runId: 17,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-13T12:44:44.000Z',
          status: 'resolved' as StatusType,
          resolvedComment: null,
          criterion: 'Trivy found security breaches',
          justification:
            'CVE 332211 of package nodejs needs to be solved asap.',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          resolvedDate: undefined,
          resolvedManually: resolvedManually,
          resolver: user,
          uniqueIdHash: '',
          metadata: undefined,
          occurrenceCount: 2,
          createdAt: new Date('2023-08-22T00:00:00Z'),
          updatedAt: new Date('2023-08-22T00:00:00Z'),
        }

        jest
          .spyOn(findingRepository, 'update')
          .mockResolvedValue({ affected: 1 } as any)
        jest.spyOn(findingRepository, 'createQueryBuilder').mockReturnValue({
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(updatedFinding),
        } as any)
        jest
          .spyOn(findingRepository, 'findOneBy')
          .mockResolvedValue(updatedFinding)
        jest.spyOn(usersService, 'getUser').mockResolvedValue(user)

        const result = await findingService.updateFinding(
          namespaceId,
          findingId,
          updateFindingDto
        )

        expect(result).toEqual(returnedDto)
      }
    )

    it('should throw a NotFoundException if finding is not found', async () => {
      const namespaceId = 1
      const findingId = '123'
      const updateFindingDto: UpdateFindingDTO = {
        status: 'resolved' as StatusType,
        resolver: '5db057be-def3-4e05-b691-2a8b91e8b761',
      }

      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 0 } as any)

      jest
        .spyOn(usersService, 'getUser')
        .mockImplementation(async (id: string) => {
          const user = new UserInNamespaceDto()
          user.id = '5db057be-def3-4e05-b691-2a8b91e8b761'
          user.email = 'user@domain.com'
          user.username = 'user@domain.com'
          user.displayName = 'User Domain'
          return user
        })

      await expect(
        findingService.updateFinding(namespaceId, findingId, updateFindingDto)
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw a BadRequestException if no resolver is specified for update', async () => {
      const namespaceId = 1
      const findingId = '123'
      const updateFindingDto: UpdateFindingDTO = {
        status: 'resolved' as StatusType,
      }

      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 0 } as any)

      await expect(
        findingService.updateFinding(namespaceId, findingId, updateFindingDto)
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('deleteFinding', () => {
    it('should delete a finding', async () => {
      const namespaceId = 1
      const findingId = '123'
      const deletedFinding: any = { affected: 1 }

      jest.spyOn(findingRepository, 'delete').mockResolvedValue(deletedFinding)

      const result = await findingService.deleteFinding(namespaceId, findingId)

      expect(result).toEqual({ deleted: true })
    })

    it('should throw a NotFoundException if finding is not found', async () => {
      const namespaceId = 1
      const findingId = '123'
      const deletedFinding: any = { affected: 0 }

      jest.spyOn(findingRepository, 'delete').mockResolvedValue(deletedFinding)

      await expect(
        findingService.deleteFinding(namespaceId, findingId)
      ).rejects.toThrow(
        new HttpException(
          `Finding with id: ${findingId} was not found in namespace ${namespaceId}`,
          HttpStatus.NOT_FOUND
        )
      )
    })
  })

  describe('handleFindingOccurrence', () => {
    it('should handle finding occurrence and return updated finding', async () => {
      const existingFinding: Finding = {
        id: '2',
        namespaceId: 1,
        uniqueIdHash: 'hash2',
        metadata: { key3: 'value3', key4: 'value4' },
        configId: 7,
        runId: 13,
        runStatus: 'failed' as RunStatus,
        runOverallResult: 'GREEN' as RunOverallStatusType,
        runCompletionTime: '2023-06-03T14:28:13.000Z',
        chapter: '2',
        requirement: '2.1',
        check: '2.1',
        criterion: 'Performance analysis of qg-apps-typescript',
        justification:
          'High CPU usage detected during load testing on production server.',
        occurrenceCount: 3,
        status: 'resolved' as StatusType,
        resolvedComment: 'Performance issue addressed and optimized.',
        resolver: 'perform@team.com',
        createdAt: new Date('2023-08-22T00:00:00Z'),
        updatedAt: new Date('2023-08-22T00:00:00Z'),
      }
      const incomingFinding: CreateFindingDTO = {
        metadata: {
          key3: 'updatedValue3',
          key4: 'updatedValue4',
          key5: 'newValue5',
        },
        runId: 14,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'GREEN' as RunOverallStatusType,
        runCompletionTime: '2023-06-03T14:28:13.000Z',
        occurrenceCount: 3,
      } as unknown as CreateFindingDTO

      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any)

      jest.spyOn(findingRepository, 'findOneBy').mockResolvedValueOnce({
        ...existingFinding,
        ...incomingFinding,
      } as GetFindingDTO)

      jest.spyOn(usersService, 'getUser').mockImplementation(async (_id) => {
        const user = new UserInNamespaceDto()
        user.displayName = 'Performance Team'
        user.username = 'perform@team.com'
        return user
      })

      const result = await findingService.handleFindingOccurrence(
        1,
        incomingFinding,
        existingFinding
      )

      const user = new UserInNamespaceDto()
      user.displayName = 'Performance Team'
      user.username = 'perform@team.com'

      const expectedFinding: GetFindingDTO = {
        ...existingFinding,
        ...incomingFinding,
        occurrenceCount: 3,
        resolvedDate: undefined,
        resolvedManually: true,
        resolver: user,
      }

      expect(result).toEqual(expectedFinding)
      expect(findingRepository.update).toHaveBeenCalledWith(
        { id: '2', namespaceId: 1 },
        {
          ...incomingFinding,
          occurrenceCount: 4,
        }
      )
    })

    it('should handle finding occurrence in case of resolved finding by Yaku and return updated finding', async () => {
      const existingFinding: Finding = {
        id: '2',
        namespaceId: 1,
        uniqueIdHash: 'hash2',
        metadata: { key3: 'value3', key4: 'value4' },
        configId: 7,
        runId: 13,
        runStatus: 'failed' as RunStatus,
        runOverallResult: 'GREEN' as RunOverallStatusType,
        runCompletionTime: '2023-06-03T14:28:13.000Z',
        chapter: '2',
        requirement: '2.1',
        check: '2.1',
        criterion: 'Performance analysis of qg-apps-typescript',
        justification:
          'High CPU usage detected during load testing on production server.',
        occurrenceCount: 3,
        status: 'resolved' as StatusType,
        resolvedComment: 'Performance issue addressed and optimized.',
        resolver: SYSTEM_USER.id,
        createdAt: new Date('2023-08-22T00:00:00Z'),
        updatedAt: new Date('2023-08-22T00:00:00Z'),
      }
      const incomingFinding: CreateFindingDTO = {
        metadata: {
          key3: 'updatedValue3',
          key4: 'updatedValue4',
          key5: 'newValue5',
        },
        runId: 14,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'GREEN' as RunOverallStatusType,
        runCompletionTime: '2023-06-03T14:28:13.000Z',
      } as unknown as CreateFindingDTO

      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any)

      jest.spyOn(findingRepository, 'findOneBy').mockResolvedValue({
        ...existingFinding,
        ...incomingFinding,
        occurrenceCount: 4,
        resolver: undefined,
        resolvedDate: undefined,
      } as GetFindingDTO)

      const result = await findingService.handleFindingOccurrence(
        1,
        incomingFinding,
        existingFinding
      )

      const expectedFinding: GetFindingDTO = {
        ...existingFinding,
        ...incomingFinding,
        occurrenceCount: 4,
        resolver: undefined,
        resolvedDate: undefined,
      }

      expect(findingRepository.update).toHaveBeenCalledWith(
        { id: '2', namespaceId: 1 },
        {
          ...incomingFinding,
          occurrenceCount: 4,
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          resolvedDate: null,
          resolver: null,
        }
      )
      expect(result).toEqual(expectedFinding)
    })

    it('should throw NotFoundException if update fails', async () => {
      const existingFinding: Finding = {
        id: '70903405-2044-48c8-8ad1-339fdd07c9a7',
        uniqueIdHash:
          'b211b8ae7565391d2c525f492e4bb47fc6c8d29800e25720523ab18b33b090aa',
        metadata: {},
        namespaceId: 1,
        configId: 348,
        runId: 3113,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'GREEN' as RunOverallStatusType,
        runCompletionTime: '2023-08-16T14:32:45.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        chapter: '1',
        requirement: '1',
        check: '1',
        criterion: 'I am a criterion 2',
        justification: 'I am another reason',
        resolver: null,
        occurrenceCount: 4,
        createdAt: new Date('2023-08-22T00:00:00Z'),
        updatedAt: new Date('2023-08-22T00:00:00Z'),
      }
      const incomingFinding: CreateFindingDTO = {
        metadata: { key3: 'value3', key4: 'value4' },
        configId: 7,
        runId: 123,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'GREEN' as RunOverallStatusType,
        runCompletionTime: '2023-08-17T12:00:00.000Z',
        chapter: '2',
        requirement: '2.1',
        check: '2.1',
        criterion: 'Performance analysis of qg-apps-typescript',
        justification:
          'High CPU usage detected during load testing on production server.',
        occurrenceCount: 3,
        status: 'resolved' as StatusType,
        resolvedComment: 'Performance issue addressed and optimized.',
        resolver: 'Performance Team',
      }

      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 0 } as any)

      await expect(
        findingService.handleFindingOccurrence(
          1,
          incomingFinding,
          existingFinding
        )
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('resolveFindings', () => {
    it('should resolve findings', async () => {
      const lastRunData = {
        globalId: 1,
        namespaceId: 1,
        id: 17,
        configId: 1,
        creationTime: '023-06-12T12:44:44.000Z',
        completionTime: '2023-06-12T12:44:44.000Z',
        status: 'completed',
        overallResult: 'RED',
      }
      const findingsDictionaryBefore = {
        hash1: {
          id: 'existing_id1',
          namespaceId: 1,
          configId: 1,
          runId: 16,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash1',
          metadata: {},
          occurrenceCount: 1,
          resolver: undefined,
        },
        hash2: {
          id: 'existing_id2',
          namespaceId: 1,
          configId: 1,
          runId: 16,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash2',
          metadata: {},
          occurrenceCount: 1,
          resolver: undefined,
        },
      }
      const findingsDictionaryAfter = {
        hash1: {
          id: 'existing_id1',
          namespaceId: 1,
          configId: 1,
          runId: 16,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash1',
          metadata: {},
          occurrenceCount: 1,
          resolver: undefined,
        },
        hash2: {
          id: 'existing_id2',
          namespaceId: 1,
          configId: 1,
          runId: 17,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash2',
          metadata: {},
          occurrenceCount: 2,
          resolver: undefined,
        },
      }

      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any)

      jest.spyOn(findingRepository, 'findOneBy').mockResolvedValue({
        id: 'existing_id1',
        namespaceId: 1,
        configId: 1,
        runId: 16,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        uniqueIdHash: 'hash1',
        metadata: {},
        occurrenceCount: 1,
        resolver: undefined,
        createdAt: new Date('2023-08-22T00:00:00Z'),
        updatedAt: new Date('2023-08-22T00:00:00Z'),
      })
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
      await findingService.resolveFindings(
        findingsDictionaryBefore,
        findingsDictionaryAfter,
        lastRunData
      )
      expect(findingRepository.update).toHaveBeenCalledWith(
        { id: 'existing_id1', namespaceId: 1 },
        {
          status: 'resolved' as StatusType,
          resolvedComment: `This finding was automatically resolved by run ${lastRunData.id}`,
          resolvedDate: new Date('2020-01-01').toISOString(),
          resolver: SYSTEM_USER.id,
          runId: lastRunData.id,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          runOverallResult: 'RED' as RunOverallStatusType,
          runStatus: 'completed' as RunStatus,
        }
      )
    })

    it('should resolve findings when overallResult ERROR occures', async () => {
      const lastRunData = {
        globalId: 1,
        namespaceId: 1,
        id: 17,
        configId: 1,
        creationTime: '023-06-12T12:44:44.000Z',
        completionTime: '2023-06-12T12:44:44.000Z',
        status: 'completed',
        overallResult: 'ERROR',
      }
      const findingsDictionaryBefore = {
        hash1: {
          id: 'existing_id1',
          namespaceId: 1,
          configId: 1,
          runId: 16,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash1',
          metadata: {},
          occurrenceCount: 1,
          resolver: undefined,
        },
        hash2: {
          id: 'existing_id2',
          namespaceId: 1,
          configId: 1,
          runId: 16,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash2',
          metadata: {},
          occurrenceCount: 1,
          resolver: undefined,
        },
      }
      const findingsDictionaryAfter = {
        hash1: {
          id: 'existing_id1',
          namespaceId: 1,
          configId: 1,
          runId: 16,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash1',
          metadata: {},
          occurrenceCount: 1,
          resolver: undefined,
        },
        hash2: {
          id: 'existing_id2',
          namespaceId: 1,
          configId: 1,
          runId: 17,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash2',
          metadata: {},
          occurrenceCount: 2,
          resolver: undefined,
        },
      }

      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any)

      jest.spyOn(findingRepository, 'findOneBy').mockResolvedValue({
        id: 'existing_id1',
        namespaceId: 1,
        configId: 1,
        runId: 16,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        uniqueIdHash: 'hash1',
        metadata: {},
        occurrenceCount: 1,
        resolver: undefined,
        createdAt: new Date('2023-08-22T00:00:00Z'),
        updatedAt: new Date('2023-08-22T00:00:00Z'),
      })
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
      await findingService.resolveFindings(
        findingsDictionaryBefore,
        findingsDictionaryAfter,
        lastRunData
      )
      expect(findingRepository.update).toHaveBeenCalledWith(
        { id: 'existing_id1', namespaceId: 1 },
        {
          status: 'resolved' as StatusType,
          resolvedComment: `This finding was automatically resolved by run ${lastRunData.id}`,
          resolvedDate: new Date('2020-01-01').toISOString(),
          resolver: SYSTEM_USER.id,
          runId: lastRunData.id,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          runOverallResult: 'ERROR' as RunOverallStatusType,
          runStatus: 'completed' as RunStatus,
        }
      )
    })

    it('should throw while resolving findings', async () => {
      const runData = {
        globalId: 1,
        namespaceId: 1,
        id: 16,
        configId: 1,
        creationTime: '023-06-12T12:44:44.000Z',
        completionTime: '2023-06-12T12:44:44.000Z',
        status: 'completed',
        overallResult: 'RED',
      }
      const findingsDictionaryBefore = {
        hash1: {
          id: 'existing_id1',
          namespaceId: 1,
          configId: 1,
          runId: 16,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash1',
          metadata: {},
          occurrenceCount: 1,
          resolver: undefined,
        },
      }
      const findingsDictionaryAfter = {
        hash1: {
          id: 'existing_id1',
          namespaceId: 1,
          configId: 1,
          runId: 16,
          runStatus: 'completed' as RunStatus,
          runOverallResult: 'RED' as RunOverallStatusType,
          runCompletionTime: '2023-06-12T12:44:44.000Z',
          status: 'unresolved' as StatusType,
          resolvedComment: null,
          criterion: 'Sandbox On the Production',
          chapter: '1',
          requirement: '1.1',
          check: '1.1',
          justification: 'Secret revealed on production',
          uniqueIdHash: 'hash1',
          metadata: {},
          occurrenceCount: 1,
          resolver: undefined,
        },
      }

      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 0 } as any)

      jest.spyOn(findingRepository, 'findOneBy').mockResolvedValue({
        id: 'existing_id1',
        namespaceId: 1,
        configId: 1,
        runId: 16,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'RED' as RunOverallStatusType,
        runCompletionTime: '2023-06-12T12:44:44.000Z',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'Sandbox On the Production',
        chapter: '1',
        requirement: '1.1',
        check: '1.1',
        justification: 'Secret revealed on production',
        uniqueIdHash: 'hash1',
        metadata: {},
        occurrenceCount: 1,
        resolver: undefined,
      })

      await expect(
        findingService.resolveFindings(
          findingsDictionaryBefore,
          findingsDictionaryAfter,
          runData
        )
      ).rejects.toThrow(Error)
    })
  })

  describe('checkFindingsForOccurrences', () => {
    it('should get findings before and after trying to create new ones', async () => {
      const lastRunData: Run = {
        globalId: 123,
        namespaceId: 1,
        id: 16,
        configId: 1,
        creationTime: 'some time',
        completionTime: 'some time2',
        status: 'completed',
        overallResult: 'GREEN',
      }

      const resultData: FindingQgResult[] = [
        {
          chapter: 'chatper',
          requirement: 'requirement',
          check: 'check',
          criterion: 'criterion',
          justification: 'justification',
          metadata: {},
        },
        {
          chapter: 'chatper2',
          requirement: 'requirement2',
          check: 'check2',
          criterion: 'criterion2',
          justification: 'justification2',
          metadata: {},
        },
      ]

      jest.spyOn(findingRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockReturnValueOnce([]),
      } as any)

      jest
        .spyOn(findingService, 'getAllFindings')
        .mockResolvedValueOnce({
          itemCount: 2,
          entities: [
            {
              id: '123',
              namespaceId: 1,
              configId: 1,
              runId: 16,
              runStatus: 'completed' as RunStatus,
              runOverallResult: 'RED' as RunOverallStatusType,
              runCompletionTime: '2023-06-12T12:44:44.000Z',
              status: 'unresolved' as StatusType,
              resolvedComment: null,
              criterion: 'PDF signature',
              justification:
                'PDF document: XC_CC.pdf was not signed by Michael',
              chapter: '1',
              requirement: '1',
              check: '1',
              uniqueIdHash: 'hash1',
              metadata: undefined,
              occurrenceCount: 1,
            },
            {
              id: '1234',
              namespaceId: 1,
              configId: 1,
              runId: 16,
              runStatus: 'completed' as RunStatus,
              runOverallResult: 'RED' as RunOverallStatusType,
              runCompletionTime: '2023-06-12T12:44:44.000Z',
              status: 'unresolved' as StatusType,
              resolvedComment: null,
              criterion: 'PDF signature',
              justification:
                'PDF document: XC_CC.pdf was not signed by Michael',
              chapter: '1',
              requirement: '1',
              check: '1',
              uniqueIdHash: 'hash2',
              metadata: undefined,
              occurrenceCount: 1,
            },
          ],
        } as EntityList<GetFindingDTO>)
        .mockResolvedValueOnce({
          itemCount: 4,
          entities: [
            {
              id: '123',
              namespaceId: 1,
              configId: 1,
              runId: 16,
              runStatus: 'completed' as RunStatus,
              runOverallResult: 'RED' as RunOverallStatusType,
              runCompletionTime: '2023-06-12T12:44:44.000Z',
              status: 'unresolved' as StatusType,
              resolvedComment: null,
              criterion: 'PDF signature',
              justification:
                'PDF document: XC_CC.pdf was not signed by Michael',
              chapter: '1',
              requirement: '1',
              check: '1',
              uniqueIdHash: 'hash1',
              metadata: undefined,
              occurrenceCount: 1,
            },
            {
              id: '1234',
              namespaceId: 1,
              configId: 1,
              runId: 16,
              runStatus: 'completed' as RunStatus,
              runOverallResult: 'RED' as RunOverallStatusType,
              runCompletionTime: '2023-06-12T12:44:44.000Z',
              status: 'unresolved' as StatusType,
              resolvedComment: null,
              criterion: 'PDF signature',
              justification:
                'PDF document: XC_CC.pdf was not signed by Michael',
              chapter: '1',
              requirement: '1',
              check: '1',
              uniqueIdHash: 'hash2',
              metadata: undefined,
              occurrenceCount: 1,
            },
            {
              id: '12345',
              namespaceId: 1,
              configId: 1,
              runId: 17,
              runStatus: 'completed' as RunStatus,
              runOverallResult: 'GREEN' as RunOverallStatusType,
              runCompletionTime: 'some time2',
              status: 'unresolved' as StatusType,
              resolvedComment: null,
              criterion: 'criterion',
              justification: 'justification',
              chapter: 'chapter',
              requirement: 'requirement',
              check: 'check',
              uniqueIdHash: 'hash3',
              metadata: undefined,
              occurrenceCount: 1,
            },

            {
              id: '123456',
              namespaceId: 1,
              configId: 1,
              runId: 17,
              runStatus: 'completed' as RunStatus,
              runOverallResult: 'GREEN' as RunOverallStatusType,
              runCompletionTime: 'some time2',
              status: 'unresolved' as StatusType,
              resolvedComment: null,
              criterion: 'criterion2',
              justification: 'justification2',
              chapter: 'chapter2',
              requirement: 'requirement2',
              check: 'check2',
              uniqueIdHash: 'hash4',
              metadata: undefined,
              occurrenceCount: 1,
            },
          ],
        } as EntityList<GetFindingDTO>)

      const findingDTO1: CreateFindingDTO = {
        configId: 1,
        runId: 17,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'GREEN' as RunOverallStatusType,
        runCompletionTime: 'some time2',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'criterion',
        chapter: 'chapter',
        requirement: 'requirement',
        check: 'check',
        justification: 'justification',
        metadata: {},
      }

      const findingDTO2: CreateFindingDTO = {
        configId: 1,
        runId: 17,
        runStatus: 'completed' as RunStatus,
        runOverallResult: 'GREEN' as RunOverallStatusType,
        runCompletionTime: 'some time2',
        status: 'unresolved' as StatusType,
        resolvedComment: null,
        criterion: 'criterion2',
        chapter: 'chapter2',
        requirement: 'requirement2',
        check: 'check2',
        justification: 'justification2',
        metadata: {},
      }
      jest.spyOn(functions, 'createFindingDto').mockReturnValueOnce(findingDTO1)
      jest.spyOn(functions, 'createFindingDto').mockReturnValueOnce(findingDTO2)
      jest
        .spyOn(findingRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any)
      jest.spyOn(findingRepository, 'findOneBy').mockResolvedValue({})
      jest.spyOn(findingService, 'createFinding').mockReturnValue({} as any)
      jest.spyOn(findingService, 'resolveFindings').mockReturnThis()

      await findingService.checkFindingsForOccurrences(lastRunData, resultData)
      expect(functions.createFindingDto).toHaveBeenCalledTimes(2)
      expect(findingService.createFinding).toHaveBeenCalledTimes(2)
    })

    it('should throw errors because failure of creation', async () => {
      const runData: Run = {
        globalId: 123,
        namespaceId: 1,
        id: 16,
        configId: 1,
        creationTime: 'some time',
        completionTime: 'some time2',
        status: 'completed',
        overallResult: 'GREEN',
      }

      const resultData: FindingQgResult[] = [
        {
          chapter: 'chatper',
          requirement: 'requirement',
          check: 'check',
          criterion: 'criterion',
          justification: 'justification',
          metadata: {},
        },
        {
          chapter: 'chatper2',
          requirement: 'requirement2',
          check: 'check2',
          criterion: 'criterion2',
          justification: 'justification2',
          metadata: {},
        },
      ]

      jest.spyOn(findingService, 'getAllFindings').mockResolvedValue({
        itemCount: 0,
        entities: [],
      } as EntityList<GetFindingDTO>)

      jest.spyOn(findingService, 'createFinding').mockImplementationOnce(() => {
        throw new NotFoundException('message')
      })
      jest.spyOn(findingService, 'createFinding').mockImplementationOnce(() => {
        throw new Error('message2')
      })
      const loggerSpy = jest.spyOn(Logger.prototype as any, 'error')
      await findingService.checkFindingsForOccurrences(runData, resultData)
      expect(loggerSpy).toHaveBeenCalledWith('Error updating finding: message')
      expect(loggerSpy).toHaveBeenCalledWith('Error creating finding: message2')
    })
  })

  describe('deleteAssociatedFindings', () => {
    it('should throw error while deleting a finding', async () => {
      jest.spyOn(findingService, 'deleteFinding').mockImplementationOnce(() => {
        throw new Error('message')
      })
      jest.spyOn(findingService, 'getAllFindings').mockResolvedValue({
        itemCount: 2,
        entities: [
          {
            id: '123',
            namespaceId: 1,
            configId: 1,
            runId: 16,
            runStatus: 'completed' as RunStatus,
            runOverallResult: 'RED' as RunOverallStatusType,
            runCompletionTime: '2023-06-12T12:44:44.000Z',
            status: 'unresolved' as StatusType,
            resolvedComment: null,
            criterion: 'PDF signature',
            justification: 'PDF document: XC_CC.pdf was not signed by Michael',
            chapter: '1',
            requirement: '1',
            check: '1',
            uniqueIdHash: 'hash1',
            metadata: undefined,
            occurrenceCount: 1,
          },
          {
            id: '1234',
            namespaceId: 1,
            configId: 1,
            runId: 16,
            runStatus: 'completed' as RunStatus,
            runOverallResult: 'RED' as RunOverallStatusType,
            runCompletionTime: '2023-06-12T12:44:44.000Z',
            status: 'unresolved' as StatusType,
            resolvedComment: null,
            criterion: 'PDF signature',
            justification: 'PDF document: XC_CC.pdf was not signed by Michael',
            chapter: '1',
            requirement: '1',
            check: '1',
            uniqueIdHash: 'hash2',
            metadata: undefined,
            occurrenceCount: 1,
          },
        ],
      } as EntityList<GetFindingDTO>)

      expect(findingService.deleteAssociatedFindings(1, 1)).rejects.toThrow(
        Error
      )
    })
  })
})
