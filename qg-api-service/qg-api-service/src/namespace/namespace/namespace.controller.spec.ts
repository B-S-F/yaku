import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'
import { NamespaceController } from './namespace.controller'
import { Namespace } from './namespace.entity'
import { NamespaceService } from './namespace.service'
import { testUser } from '../../gp-services/test-services'

describe('NamespaceController', () => {
  let controller: NamespaceController
  let service: NamespaceService

  const testNamespace = new Namespace()
  testNamespace.id = 1
  testNamespace.name = 'NS1'

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NamespaceController],
      providers: [
        {
          provide: NamespaceService,
          useValue: {
            getList: jest.fn(),
            get: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<NamespaceController>(NamespaceController)
    service = module.get<NamespaceService>(NamespaceService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('GetList', () => {
    const testRequest = { user: testUser } as unknown as Request

    const otherNamespace = new Namespace()
    otherNamespace.id = 2
    otherNamespace.name = 'Other Namespace'

    it('should return the list of namespaces', async () => {
      const serviceSpy = jest
        .spyOn(service, 'getList')
        .mockResolvedValue([testNamespace, otherNamespace])

      const namespaces = await controller.getList(testRequest)

      expect(namespaces).toBeDefined()
      expect(namespaces.length).toBe(2)
      const testNamespaceDto = namespaces
        .filter((namespace) => namespace.id === 1)
        .pop()
      const otherNamespaceDto = namespaces
        .filter((namespace) => namespace.id === 2)
        .pop()
      expect(testNamespaceDto).toBeDefined()
      expect(testNamespaceDto.name).toBe(testNamespace.name)
      expect(testNamespaceDto.users).toEqual([])
      expect(otherNamespaceDto).toBeDefined()
      expect(otherNamespaceDto.name).toBe(otherNamespace.name)
      expect(otherNamespaceDto.users).toEqual([])
      expect(serviceSpy).toBeCalledWith(testUser)
    })

    it('should return the an empty list of namespaces if no namespace is known', async () => {
      const serviceSpy = jest.spyOn(service, 'getList').mockResolvedValue([])

      const namespaces = await controller.getList(testRequest)

      expect(namespaces).toBeDefined()
      expect(namespaces.length).toBe(0)
      expect(serviceSpy).toBeCalledWith(testUser)
    })
  })

  describe('Get namespace', () => {
    it('should return the namespace of the given id', async () => {
      const serviceSpy = jest
        .spyOn(service, 'get')
        .mockResolvedValue(testNamespace)

      const namespace = await controller.get(testNamespace.id)

      expect(namespace).toBeDefined()
      expect(namespace.name).toBe(testNamespace.name)
      expect(namespace.users).toEqual([])
      expect(serviceSpy).toBeCalledWith(testUser.id)
    })

    it('should throw the exception from the service if the given namespace does not exist', async () => {
      const serviceSpy = jest
        .spyOn(service, 'get')
        .mockRejectedValue(new NotFoundException())

      await expect(controller.get(666)).rejects.toThrow(NotFoundException)
      expect(serviceSpy).toBeCalledWith(666)
    })
  })

  describe('Create namespace', () => {
    it('should pass the create to the service properly and return the namespace information', async () => {
      const usernameList = [{ username: testUser.username }]
      const serviceSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(testNamespace)

      const namespace = await controller.create({
        name: testNamespace.name,
        users: usernameList,
      })

      expect(namespace).toBeDefined()
      expect(namespace.name).toBe(testNamespace.name)
      expect(namespace.users).toEqual([])
      expect(serviceSpy).toBeCalledWith(testNamespace.name)
    })

    it.each([undefined, null, '', ' \t\n'])(
      'should throw the exception from the service if name is empty',
      async (value) => {
        const usernameList = [{ username: testUser.username }]
        const serviceSpy = jest
          .spyOn(service, 'create')
          .mockRejectedValue(new BadRequestException())

        await expect(
          controller.create({ name: value, users: usernameList })
        ).rejects.toThrow(BadRequestException)
        expect(service.create).not.toBeCalled()
      }
    )

    it('should accept empty users array', async () => {
      const serviceSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(testNamespace)
      await expect(controller.create({ name: testNamespace.name, users: [] }))
      expect(serviceSpy).toBeCalled()
    })

    it('should accept missing users array', async () => {
      const serviceSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(testNamespace)
      await expect(controller.create({ name: testNamespace.name } as any))
      expect(serviceSpy).toBeCalled()
    })
  })

  describe('Update namespace', () => {
    it('should pass the update to the service properly and return the namespace information', async () => {
      const usernameList = [
        { username: testUser.username },
        { username: 'Kurt' },
      ]
      const newName = 'New Namespace Name'
      const serviceSpy = jest
        .spyOn(service, 'update')
        .mockImplementation(async () => {
          const changedNamespace = { ...testNamespace }
          changedNamespace.name = newName
          return changedNamespace
        })

      const namespace = await controller.update(testNamespace.id, {
        name: newName,
        users: usernameList,
      })

      expect(namespace).toBeDefined()
      expect(namespace.name).toBe(newName)
      expect(namespace.users).toEqual([])
      expect(serviceSpy).toBeCalledWith(testNamespace.id, newName)
    })

    it('should throw the exception from the service if the namespace is unknown', async () => {
      const usernameList = [{ username: testUser.username }]
      const serviceSpy = jest
        .spyOn(service, 'update')
        .mockRejectedValue(new NotFoundException())

      await expect(
        controller.update(666, { name: 'something', users: usernameList })
      ).rejects.toThrow(NotFoundException)
      expect(serviceSpy).toBeCalledWith(666, 'something')
    })

    it('should throw the exception from the service if the service has an issue', async () => {
      const usernameList = [{ username: testUser.username }]
      const serviceSpy = jest
        .spyOn(service, 'update')
        .mockRejectedValue(new BadRequestException())

      await expect(
        controller.update(testNamespace.id, {
          name: testNamespace.name,
          users: usernameList,
        })
      ).rejects.toThrow(BadRequestException)
      expect(service.update).toBeCalledWith(
        testNamespace.id,
        testNamespace.name
      )
    })
  })
})
