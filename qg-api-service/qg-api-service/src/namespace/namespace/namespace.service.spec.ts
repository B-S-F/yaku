import {
  KeyCloakNamespace,
  KeyCloakUser,
} from '@B-S-F/api-keycloak-auth-lib'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DeepPartial, In, Repository } from 'typeorm'
import { Namespace } from './namespace.entity'
import { NamespaceCallbacks, NamespaceService } from './namespace.service'
import {
  KEYCLOAK_ADMIN_ROLE,
  NAMESPACE_ACCESS_ROLE,
} from '../../guards/roles.guard'

describe('NamespaceService', () => {
  let service: NamespaceService
  let repository: Repository<Namespace>

  let module: TestingModule

  const callback = jest.fn()

  const testKeyCloakNamespace: KeyCloakNamespace = {
    id: 1,
    name: 'NS1',
    roles: [NAMESPACE_ACCESS_ROLE],
    users: [],
    type: 'type',
  }

  const testUser: KeyCloakUser = {
    id: 1,
    username: 'TestUser',
    email: 'testuser@example.com',
    displayName: 'Test User',
    roles: [],
    kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
    kc_iss: '1234567890',
    kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
    interactive_login: true,
    namespaces: [testKeyCloakNamespace],
  }

  const adminUser: KeyCloakUser = {
    id: 2,
    username: 'TestUser',
    email: 'testuser@example.com',
    displayName: 'Test User',
    roles: [KEYCLOAK_ADMIN_ROLE],
    kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
    kc_iss: '1234567890',
    kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
    interactive_login: true,
    namespaces: [testKeyCloakNamespace],
  }

  const testNamespace = new Namespace()
  testNamespace.id = 1
  testNamespace.name = 'NS1'

  const otherNamespace = new Namespace()
  otherNamespace.id = 2
  otherNamespace.name = 'NS2'

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        NamespaceService,
        {
          provide: getRepositoryToken(Namespace),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NamespaceCallbacks,
          useValue: new NamespaceCallbacks([callback]),
        },
      ],
    }).compile()

    service = module.get<NamespaceService>(NamespaceService)
    repository = module.get(getRepositoryToken(Namespace))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('GetList', () => {
    it('should return all relevant namespaces for an user', async () => {
      const repoSpy = jest
        .spyOn(repository, 'find')
        .mockResolvedValue([testNamespace])

      const namespaces = await service.getList(testUser)

      expect(namespaces.length).toBe(1)
      expect(namespaces[0]).toBe(testNamespace)
      expect(repoSpy).toBeCalledTimes(1)
      expect(repoSpy).toBeCalledWith({
        where: { id: In([1]) },
      })
    })

    it('should return all namespace for an admin user', async () => {
      const repoSpy = jest
        .spyOn(repository, 'find')
        .mockResolvedValue([testNamespace, otherNamespace])

      const namespaces = await service.getList(adminUser)

      expect(namespaces.length).toBe(2)
      expect(namespaces).toContain(testNamespace)
      expect(namespaces).toContain(otherNamespace)
      expect(repoSpy).toBeCalledWith()
    })

    it('should return an empty list for a user not belonging to a namespace', async () => {
      const repoSpy = jest.spyOn(repository, 'find').mockResolvedValue([])

      const namespaces = await service.getList(testUser)

      expect(namespaces.length).toBe(0)
      expect(repoSpy).toBeCalledTimes(1)
      expect(repoSpy).toBeCalledWith({
        where: { id: In([1]) },
      })
    })

    it('should return a namespace for a KeyCloakUser if the namespaceId exist', async () => {
      const testKeyCloakNamespace: KeyCloakNamespace = {
        id: 1,
        name: 'name',
        roles: [],
        users: [],
        type: 'type',
      }
      const testKeyCloakUser: KeyCloakUser = {
        id: 1,
        kc_id: '1234567890 04f48c06-e016-42fa-8b53-98a58a976e12',
        kc_iss: '1234567890',
        kc_sub: '04f48c06-e016-42fa-8b53-98a58a976e12',
        username: 'username',
        email: 'username@exmaple.com',
        displayName: 'Username',
        roles: [],
        interactive_login: true,
        namespaces: [testKeyCloakNamespace],
      }
      const repoSpy = jest
        .spyOn(repository, 'find')
        .mockResolvedValue([testNamespace])

      const namespaces = await service.getList(testKeyCloakUser)

      expect(namespaces.length).toBe(1)
      expect(namespaces[0]).toBe(testNamespace)
      expect(repoSpy).toBeCalledTimes(1)
      expect(repoSpy).toBeCalledWith({
        where: { id: In([1]) },
      })
    })

    it('should return an empty list for a KeyCloakUser if the namespaceId does not exist', async () => {
      const testKeyCloakNamespace: KeyCloakNamespace = {
        id: 2,
        name: 'name',
        roles: [],
        users: [],
        type: 'type',
      }
      const testKeyCloakUser: KeyCloakUser = {
        id: 1,
        kc_id: '1234567890 be7788cc-252a-4c2b-a3cc-6c4043c5def9',
        kc_iss: '1234567890',
        kc_sub: 'be7788cc-252a-4c2b-a3cc-6c4043c5def9',
        username: 'username',
        email: 'username@exmaple.com',
        displayName: 'Username',
        roles: [],
        interactive_login: true,
        namespaces: [testKeyCloakNamespace],
      }
      const repoSpy = jest.spyOn(repository, 'find').mockResolvedValue([])

      const namespaces = await service.getList(testKeyCloakUser)

      expect(namespaces.length).toBe(0)
      expect(repoSpy).toBeCalledTimes(1)
      expect(repoSpy).toBeCalledWith({
        where: { id: In([2]) },
      })
    })

    it('should return all namespaces for an admin KeyCloakUser', async () => {
      const testKeyCloakNamespace: KeyCloakNamespace = {
        id: 1,
        name: 'name',
        roles: [],
        users: [],
        type: 'type',
      }
      const testKeyCloakUser: KeyCloakUser = {
        id: 1,
        kc_id: '1234567890 be7788cc-252a-4c2b-a3cc-6c4043c5def9',
        kc_iss: '1234567890',
        kc_sub: 'be7788cc-252a-4c2b-a3cc-6c4043c5def9',
        username: 'username',
        email: 'username@exmaple.com',
        displayName: 'Username',
        roles: [KEYCLOAK_ADMIN_ROLE],
        interactive_login: true,
        namespaces: [testKeyCloakNamespace],
      }
      const repoSpy = jest
        .spyOn(repository, 'find')
        .mockResolvedValue([testNamespace, otherNamespace])

      const namespaces = await service.getList(testKeyCloakUser)

      expect(namespaces.length).toBe(2)
      expect(namespaces).toContain(testNamespace)
      expect(namespaces).toContain(otherNamespace)
      expect(repoSpy).toBeCalledWith()
    })
  })

  describe('Get', () => {
    it('should return the namespace, if an existing id is requested', async () => {
      const repoSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(testNamespace)
      const namespace = await service.get(testNamespace.id)

      expect(namespace).toBe(testNamespace)
      expect(repoSpy).toBeCalledWith({
        where: { id: testNamespace.id },
      })
    })

    it('should return NotFound, if the id does not exist', async () => {
      const repoSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(null)
      await expect(service.get(666)).rejects.toThrow(NotFoundException)

      expect(repoSpy).toBeCalledWith({
        where: { id: 666 },
      })
    })
  })

  describe('Create namespace', () => {
    let createSpy: any
    let saveSpy: any

    const namespaceName = 'New Namespace'

    beforeEach(() => {
      createSpy = jest
        .spyOn(repository, 'create')
        .mockImplementation((namespaceData: DeepPartial<Namespace>) => {
          return { ...namespaceData, id: 3 } as Namespace
        })
      saveSpy = jest
        .spyOn(repository, 'save')
        .mockImplementation((namespace: Namespace) =>
          Promise.resolve(namespace)
        )
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should create a namespace with proper data', async () => {
      const namespace = await service.create(namespaceName)

      expect(namespace).toBeDefined()
      expect(namespace.name).toBe(namespaceName)
      expect(createSpy).toBeCalledWith({ name: namespaceName })
      expect(saveSpy).toBeCalledWith(namespace)
      expect(callback).toBeCalledWith(namespace.id)
    })

    it.each([undefined, null, ''])(
      'should throw a BadRequest if !name is true',
      async (name: string) => {
        await expect(service.create(name)).rejects.toThrow(BadRequestException)

        expect(createSpy).not.toBeCalled()
        expect(saveSpy).not.toBeCalled()
        expect(callback).not.toBeCalled()
      }
    )
  })

  describe('Update namespace', () => {
    let saveSpy: any
    let getSpy: any

    const namespaceName = 'Changed Namespace'

    beforeEach(async () => {
      saveSpy = jest
        .spyOn(repository, 'save')
        .mockImplementation((namespace: Namespace) =>
          Promise.resolve(namespace)
        )
      getSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockImplementation(async (crit) => {
          if (crit['id'] === testNamespace.id) {
            return testNamespace
          } else {
            return null
          }
        })
    })

    it('should update the namespace with changing name', async () => {
      const namespace = await service.update(testNamespace.id, namespaceName)

      expect(namespace).toBeDefined()
      expect(namespace.name).toBe(namespaceName)
      expect(getSpy).toBeCalledWith({ id: testNamespace.id })
      expect(saveSpy).toBeCalledWith(namespace)
    })

    it('should throw a NotFound if namespace is unknown', async () => {
      await expect(service.update(666, namespaceName)).rejects.toThrow(
        NotFoundException
      )

      expect(getSpy).toBeCalledWith({ id: 666 })
      expect(saveSpy).not.toBeCalled()
    })
  })
})
