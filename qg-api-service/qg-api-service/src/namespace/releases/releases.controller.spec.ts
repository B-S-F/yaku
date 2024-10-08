import {
  EntityList,
  PaginationQueryOptions,
  SortOrder,
  UrlHandlerFactory,
  UrlProtocolConfig,
  createMockResponse,
} from '@B-S-F/api-commons-lib'
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'
import { getUserFromRequest, RequestUser } from '../module.utils'
import { ApprovalState } from './approvals/approvals.util'
import { HistoryService } from './history.service'
import { ReleasesController } from './releases.controller'
import { ReleasesService } from './releases.service'
import { AddReleaseDto, ReleaseDto, UpdateReleaseDto } from './releases.utils'
import { testUser, baseUrl } from '../../gp-services/test-services'

describe('ReleasesController', () => {
  let controller: ReleasesController
  let service: ReleasesService

  const user1 = {
    kc_sub: 'user1_id',
    username: 'user1',
    email: 'user1@example.com',
    displayName: 'User 1',
  }
  const user1InNamespace = {
    id: 'user1_id',
    username: 'user1',
    email: 'user1@example.com',
    displayName: 'User 1',
    firstName: 'User',
    lastName: '1',
  }
  const user2 = {
    kc_sub: 'user2_id',
    username: 'user2',
    email: 'user2@example.com',
    displayName: 'User 2',
  }
  const user2InNamespace = {
    id: 'user2_id',
    username: 'user2',
    email: 'user2@example.com',
    displayName: 'User 2',
    firstName: 'User',
    lastName: '2',
  }

  let request: Request
  const requestUser = new RequestUser(
    user1.kc_sub,
    user1.username,
    user1.email,
    user1.displayName
  )

  const releaseDto1: ReleaseDto = {
    id: 1,
    name: 'release1',
    approvalMode: 'all',
    approvalState: ApprovalState.PENDING,
    qgConfigId: 1,
    createdBy: user1InNamespace,
    lastModifiedBy: user1InNamespace,
    plannedDate: new Date(),
    creationTime: new Date(),
    lastModificationTime: new Date(),
    closed: false,
    lastRunId: null,
  }

  const releaseDto2: ReleaseDto = {
    id: 2,
    name: 'release2',
    approvalMode: 'one',
    approvalState: ApprovalState.APPROVED,
    qgConfigId: 2,
    createdBy: user2InNamespace,
    lastModifiedBy: undefined,
    plannedDate: new Date(),
    creationTime: new Date(),
    lastModificationTime: new Date(),
    closed: false,
    lastRunId: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReleasesController],
      providers: [
        {
          provide: ReleasesService,
          useValue: {
            list: jest.fn(),
            get: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            close: jest.fn(),
          },
        },
        {
          provide: HistoryService,
          useValue: {
            getReleaseHistory: jest.fn(),
          },
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

    controller = module.get<ReleasesController>(ReleasesController)
    service = module.get<ReleasesService>(ReleasesService)

    request = { user: user1 } as any
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getReleases', () => {
    it('should return the paginated data of the releases', async () => {
      const namespaceId = 1
      const queryOptions = {}
      const response = createMockResponse(`${baseUrl}/releases`, testUser)
      const serviceResult = {
        itemCount: 0,
        entities: [],
      }
      jest.spyOn(service, 'list').mockResolvedValue(serviceResult)

      const result = await controller.getReleases(
        namespaceId,
        queryOptions,
        response
      )

      expect(result).toEqual({
        data: [],
        links: {
          first:
            'https://localhost:3000/api/v1/namespaces/1/releases?page=1&items=20',
          last: 'https://localhost:3000/api/v1/namespaces/1/releases?page=1&items=20',
        },
        pagination: {
          pageNumber: 1,
          pageSize: 0,
          totalCount: 0,
        },
      })
    })

    it('should provide releases that were returned by the service', async () => {
      const namespaceId = 1
      const queryOptions = {}
      const response = createMockResponse(`${baseUrl}/releases`, testUser)
      const serviceResult: EntityList<ReleaseDto> = {
        itemCount: 0,
        entities: [releaseDto1, releaseDto2],
      }
      jest.spyOn(service, 'list').mockResolvedValue(serviceResult)

      const result = await controller.getReleases(
        namespaceId,
        queryOptions,
        response
      )

      expect(result.data).toEqual([releaseDto1, releaseDto2])
    })

    it('should sort releases DESC by id', async () => {
      const namespaceId = 1
      const queryOptions: PaginationQueryOptions = {
        sortOrder: SortOrder.DESC,
        sortBy: 'id',
      }
      const response = createMockResponse(`${baseUrl}/releases`, testUser)
      const serviceResult: EntityList<ReleaseDto> = {
        itemCount: 0,
        entities: [releaseDto2, releaseDto1],
      }
      jest.spyOn(service, 'list').mockResolvedValue(serviceResult)

      const result = await controller.getReleases(
        namespaceId,
        queryOptions,
        response
      )

      expect(result.data).toEqual([releaseDto2, releaseDto1])
    })
  })

  describe('getRelease', () => {
    it('should return the release with the given id', async () => {
      const namespaceId = 1
      const releaseId = 1
      jest.spyOn(service, 'get').mockResolvedValue(releaseDto1)

      const result = await controller.getRelease(namespaceId, releaseId)

      expect(result).toEqual(releaseDto1)
    })

    it('should throw a NotFoundException if the release does not exist', async () => {
      const namespaceId = 1
      const releaseId = 1
      const entityNotFoundError = new Error('Entity not found')
      entityNotFoundError.name = 'EntityNotFoundError'
      jest.spyOn(service, 'get').mockImplementation(() => {
        throw entityNotFoundError
      })

      await expect(
        controller.getRelease(namespaceId, releaseId)
      ).rejects.toThrow('Release not found, id: 1')
    })
  })

  describe('createRelease', () => {
    it('should create a new release', async () => {
      const namespaceId = 1
      const releaseDto: AddReleaseDto = {
        name: 'release1',
        approvalMode: 'all',
        qgConfigId: 1,
        plannedDate: '2021-01-01T00:00:00.000Z',
      } as any
      const createSpy = jest.spyOn(service, 'create')
      createSpy.mockResolvedValue(releaseDto1)

      const result = await controller.create(namespaceId, releaseDto, request)

      expect(result).toEqual(releaseDto1)
      expect(createSpy).toHaveBeenCalledWith(
        namespaceId,
        releaseDto.name,
        releaseDto.approvalMode,
        releaseDto.qgConfigId,
        releaseDto.plannedDate,
        requestUser
      )
    })

    it.each([
      {
        case: 'invalid dto',
        dto: {
          name: 1337,
          approvalMode: 'none',
          qgConfigId: 'test',
          plannedDate: 'Peter',
        },
      },
      { case: 'missing values', dto: {} },
      {
        case: 'unexpected values',
        dto: {
          name: 'release1',
          approvalMode: 'all',
          qgConfigId: 1,
          plannedDate: '2021-01-01T00:00:00.000Z',
          unexpected: 'unexpected',
        },
      },
    ])(
      'should return an BadRequestException if the dto is %s',
      async ({ dto }) => {
        const namespaceId = 1
        jest.spyOn(service, 'create').mockResolvedValue(releaseDto1)

        await expect(
          controller.create(namespaceId, dto as any, request)
        ).rejects.toThrow(BadRequestException)
      }
    )
  })

  describe('updateRelease', () => {
    it('should update a release', async () => {
      const namespaceId = 1
      const releaseId = 1
      const releaseDto: UpdateReleaseDto = {
        name: 'release1',
        approvalMode: 'all',
        plannedDate: '2021-01-01T00:00:00.000Z',
      } as any
      const createSpy = jest.spyOn(service, 'update')
      createSpy.mockResolvedValue(releaseDto1)

      const result = await controller.update(
        namespaceId,
        releaseId,
        releaseDto,
        request
      )

      expect(result).toEqual(releaseDto1)
      expect(createSpy).toHaveBeenCalledWith(
        namespaceId,
        releaseId,
        requestUser,
        releaseDto.name,
        releaseDto.approvalMode,
        releaseDto.plannedDate
      )
    })

    it.each([
      [{ name: 'release1' }],
      [{ approvalMode: 'all' }],
      [{ plannedDate: '2021-01-01T00:00:00.000Z' }],
    ])(
      'should update a release if the dto does not contain all values',
      async (dto) => {
        const namespaceId = 1
        const releaseId = 1
        const createSpy = jest.spyOn(service, 'update')
        createSpy.mockResolvedValue(releaseDto1)

        const emptyDto = {
          name: undefined,
          approvalMode: undefined,
          plannedDate: undefined,
        }
        const usedDto = { ...emptyDto, ...dto } as UpdateReleaseDto

        const result = await controller.update(
          namespaceId,
          releaseId,
          usedDto,
          request
        )

        expect(result).toEqual(releaseDto1)
        expect(createSpy).toHaveBeenCalledWith(
          namespaceId,
          releaseId,
          requestUser,
          usedDto.name,
          usedDto.approvalMode,
          usedDto.plannedDate
        )
      }
    )

    it.each([
      {
        case: 'invalid dto',
        dto: {
          name: 1337,
          approvalMode: 'none',
          plannedDate: 'Peter',
        },
      },
      { case: 'missing values', dto: {} },
      {
        case: 'unexpected values',
        dto: {
          name: 'release1',
          approvalMode: 'all',
          plannedDate: '2021-01-01T00:00:00.000Z',
          unexpected: 'unexpected',
        },
      },
    ])(
      'should return an BadRequestException if the dto is %s',
      async ({ dto }) => {
        const namespaceId = 1
        const releaseId = 1
        jest.spyOn(service, 'update').mockResolvedValue(releaseDto1)

        await expect(
          controller.update(namespaceId, releaseId, dto as any, request)
        ).rejects.toThrow(BadRequestException)
      }
    )
  })

  describe('deleteRelease', () => {
    it('should delete a release', async () => {
      const namespaceId = 1
      const releaseId = 1
      const deleteSpy = jest.spyOn(service, 'remove')
      deleteSpy.mockResolvedValue()

      await controller.removeRelease(namespaceId, releaseId, request)

      expect(deleteSpy).toHaveBeenCalledWith(
        namespaceId,
        releaseId,
        requestUser
      )
    })
  })

  describe('getUserFromRequest', () => {
    it('should return the user from the request', () => {
      const result = getUserFromRequest(request)
      expect(result).toEqual(requestUser)
    })

    it('should throw an InternalServerErrorException if the user is not found', () => {
      const request = {}

      expect(() => getUserFromRequest(request as any)).toThrow(
        InternalServerErrorException
      )
    })

    it('should throw an InternalServerErrorException if the username is not found', () => {
      const request = { user: {} }

      expect(() => getUserFromRequest(request as any)).toThrow(
        InternalServerErrorException
      )
    })
  })

  describe('close a release', () => {
    it('should close a release', async () => {
      const namespaceId = 1
      const releaseId = 1
      const closeSpy = jest.spyOn(service, 'close')
      closeSpy.mockResolvedValue()

      await controller.close(namespaceId, releaseId, request)

      expect(closeSpy).toHaveBeenCalledWith(namespaceId, releaseId, requestUser)
    })
  })
})
