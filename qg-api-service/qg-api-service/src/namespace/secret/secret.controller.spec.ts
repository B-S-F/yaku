import {
  UrlHandlerFactory,
  UrlProtocolConfig,
  queryOptionsSchema,
  toListQueryOptions,
  createMockResponse,
  namespaceUrl,
} from '@B-S-F/api-commons-lib'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Response } from 'express'
import { createRequest, createResponse } from 'node-mocks-http'
import { Namespace } from '../namespace/namespace.entity'
import { SecretController } from './secret.controller'
import { Secret } from './secret.entity'
import { SecretService } from './secret.service'
import { testUser, baseUrl } from '../../gp-services/test-services'

describe('SecretController', () => {
  let controller: SecretController
  let service: SecretService

  const mockRunsUrl = `${namespaceUrl}/secrets`

  const namespace: Namespace = { id: 1, name: 'NS1' }

  const name11 = 'Test11'
  const desc11 = 'Desc 11'
  const name12 = 'Test12'
  const name13 = 'Test13'
  const name14 = 'Test14'
  const desc14 = 'Desc 14'

  const secretValue = 'Yet another great secret'

  const secret1: Secret = {
    id: 1,
    namespace,
    name: name11,
    creationTime: new Date(),
    lastModificationTime: new Date(),
  }
  const secret2: Secret = {
    id: 2,
    namespace,
    name: name12,
    creationTime: new Date(),
    lastModificationTime: new Date(),
  }
  const secret3: Secret = {
    id: 3,
    namespace,
    name: name13,
    creationTime: new Date(),
    lastModificationTime: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretController],
      providers: [
        {
          provide: SecretService,
          useValue: {
            getSecrets: jest.fn(),
            addSecret: jest.fn(),
            updateSecret: jest.fn(),
            deleteSecret: jest.fn(),
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

    controller = module.get<SecretController>(SecretController)
    service = module.get<SecretService>(SecretService)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should return secrets of a namespace', async () => {
    const retrievedData = [secret1, secret2, secret3]
    const expectedData = retrievedData.map((s) => {
      return {
        name: s.name,
        description: s.description,
        creationTime: s.creationTime,
        lastModificationTime: s.lastModificationTime,
      }
    })
    const srvSpy = jest
      .spyOn(service, 'getSecrets')
      .mockResolvedValue({ itemCount: 3, entities: retrievedData })
    const response = createMockResponse(`${baseUrl}/secrets`, testUser)

    const retrieved = await controller.getSecrets(1, {}, response)

    expect(retrieved.pagination.pageNumber).toBe(1)
    expect(retrieved.pagination.pageSize).toBe(3)
    expect(retrieved.pagination.totalCount).toBe(3)
    expect(retrieved.data.length).toBe(3)
    expect(retrieved.data).toEqual(expectedData)
    expect(retrieved.links.first).toBe(`${mockRunsUrl}?page=1&items=20`)
    expect(retrieved.links.last).toBe(`${mockRunsUrl}?page=1&items=20`)
    expect(retrieved.links.prev).toBeUndefined()
    expect(retrieved.links.next).toBeUndefined()
    expect(srvSpy).toBeCalledWith(
      1,
      toListQueryOptions({}, queryOptionsSchema.strict(), [], 'id')
    )
  })

  it('should return empty secrets if an empty namespace is given', async () => {
    const srvSpy = jest
      .spyOn(service, 'getSecrets')
      .mockResolvedValue({ itemCount: 0, entities: [] })
    const response = createMockResponse(`${baseUrl}/secrets`, testUser)

    const retrieved = await controller.getSecrets(2, {}, response)
    expect(retrieved.pagination.pageNumber).toBe(1)
    expect(retrieved.pagination.pageSize).toBe(0)
    expect(retrieved.pagination.totalCount).toBe(0)
    expect(retrieved.data.length).toBe(0)
    expect(retrieved.data).toEqual([])
    expect(retrieved.links.first).toBe(`${mockRunsUrl}?page=1&items=20`)
    expect(retrieved.links.last).toBe(`${mockRunsUrl}?page=1&items=20`)
    expect(retrieved.links.prev).toBeUndefined()
    expect(retrieved.links.next).toBeUndefined()
    expect(srvSpy).toBeCalledWith(
      2,
      toListQueryOptions({}, queryOptionsSchema.strict(), [], 'id')
    )
  })

  it('should store a new secret properly', async () => {
    const newData = { name: name14, description: desc14, secret: secretValue }
    const request = createRequest({
      protocol: 'https',
      url: '/api/v1/namespaces/1/secrets',
      headers: {
        host: 'localhost:3000',
      },
    })
    const response: Partial<Response> = {
      req: request,
      header: jest.fn().mockImplementation(),
    }
    const srvSpy = jest.spyOn(service, 'addSecret').mockResolvedValue({
      id: 4,
      namespace,
      name: name14,
      creationTime: new Date(),
      lastModificationTime: new Date(),
    })

    const secret = await controller.create(1, newData, response as Response)

    expect(secret.name).toBe(name14)
    expect(response.header).toBeCalledWith(
      'Location',
      `https://localhost:3000/api/v1/namespaces/1/secrets/${name14}`
    )
    expect(srvSpy).toBeCalledWith(1, name14, desc14, secretValue)
    expect(Object.keys(secret)).toEqual([
      'name',
      'creationTime',
      'lastModificationTime',
    ])
  })

  it.each([undefined, null, '', ' \t\n'])(
    'should throw a BadRequestException if name is "%s"',
    async (current) => {
      const newData = { name: current, secret: secretValue }
      const response = createResponse()
      await expect(controller.create(1, newData, response)).rejects.toThrow(
        BadRequestException
      )
      expect(service.addSecret).not.toBeCalled()
    }
  )

  it.each([undefined, null, '', ' \t\n'])(
    'should throw a BadRequestException if secret data is "%s"',
    async (current) => {
      const newData = { name: name13, secret: current }
      const response = createResponse()
      await expect(controller.create(1, newData, response)).rejects.toThrow(
        BadRequestException
      )
      expect(service.addSecret).not.toBeCalled()
    }
  )

  it('should throw a BadRequestException if name is not given', async () => {
    const newData = { secret: secretValue } as any
    const response = createResponse()
    await expect(controller.create(1, newData, response)).rejects.toThrow(
      BadRequestException
    )
    expect(service.addSecret).not.toBeCalled()
  })

  it('should throw a BadRequestException if secret data is not given', async () => {
    const newData = { name: name14 } as any
    const response = createResponse()
    await expect(controller.create(1, newData, response)).rejects.toThrow(
      BadRequestException
    )
    expect(service.addSecret).not.toBeCalled()
  })

  it('should update a secret properly', async () => {
    const newData = {
      description: desc11,
      secret: secretValue,
    }
    const srvSpy = jest.spyOn(service, 'updateSecret').mockResolvedValue({
      id: 1,
      namespace,
      name: name11,
      description: desc11,
      creationTime: secret1.creationTime,
      lastModificationTime: new Date(),
    })
    const secret = await controller.update(1, name11, newData)
    expect(secret.name).toBe(name11)
    expect(secret.description).toBe(desc11)
    expect(srvSpy).toBeCalledWith(1, name11, desc11, secretValue)
    expect(Object.keys(secret)).toEqual([
      'name',
      'description',
      'creationTime',
      'lastModificationTime',
    ])
  })

  it('should throw a BadRequestException, if wrong data is given on update', async () => {
    const newData = { secret: secretValue }
    const srvSpy = jest
      .spyOn(service, 'updateSecret')
      .mockRejectedValue(new NotFoundException())
    await expect(controller.update(1, name12, newData)).rejects.toThrow(
      NotFoundException
    )
    expect(srvSpy).toBeCalledWith(1, name12, undefined, secretValue)
  })

  it('should throw a BadRequestException, if nothing is updated', async () => {
    const newData = {}
    await expect(controller.update(1, name12, newData)).rejects.toThrow(
      BadRequestException
    )
    expect(service.updateSecret).not.toBeCalled()
  })

  it('should return properly on delete with right data', async () => {
    await controller.delete(1, name11)
    expect(service.deleteSecret).toBeCalledWith(1, name11)
  })
})
