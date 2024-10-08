import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { randomBytes } from 'crypto'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { Namespace } from '../namespace/namespace.entity'
import { SecretStorage } from './secret-storage.service'
import { Secret } from './secret.entity'
import { SecretConfig, SecretService } from './secret.service'

describe('SecretService', () => {
  let service: SecretService
  let secretStorage: SecretStorage
  let repository: Repository<Secret>

  const namespace1: Namespace = { id: 1, name: 'NS1' }

  const name11 = 'TEST11'
  const description11 = 'Desc 11'
  const name12 = 'TEST12'
  const description12 = 'Desc 12'
  const name13 = 'TEST13'
  const description13 = 'Desc 13'
  const name21 = 'TEST21'

  const secretValue = 'GreatSecret'

  const secret1: Secret = {
    id: 1,
    namespace: namespace1,
    name: name11,
    description: description11,
    creationTime: new Date(),
    lastModificationTime: new Date(),
  }
  const secret2: Secret = {
    id: 2,
    namespace: namespace1,
    name: name12,
    creationTime: new Date(),
    lastModificationTime: new Date(),
  }

  const nextId = 4

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretService,
        {
          provide: getRepositoryToken(Secret),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: SecretStorage,
          useValue: {
            deleteSecret: jest.fn(),
            storeSecret: jest.fn(),
          },
        },
        {
          provide: SecretConfig,
          useFactory: () => new SecretConfig(128),
        },
      ],
    }).compile()

    service = module.get<SecretService>(SecretService)
    secretStorage = module.get<SecretStorage>(SecretStorage)
    repository = module.get(getRepositoryToken(Secret))
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('GetSecrets', () => {
    const queryBuilderMock = {
      leftJoinAndSelect() {
        return this
      },
      where() {
        return this
      },
      getCount: jest.fn(),
      getRawAndEntities: jest.fn(),
    }

    function mockQueryBuilder(itemCount: number, entities: Secret[]) {
      return jest
        .spyOn(repository, 'createQueryBuilder')
        .mockImplementation(() => {
          const mock = queryBuilderMock
          mock.getCount = jest.fn().mockResolvedValue(itemCount)
          mock.getRawAndEntities = jest.fn().mockImplementation(async () => {
            return { entities }
          })
          return mock as unknown as SelectQueryBuilder<Secret>
        })
    }

    it('should return all secrets for a namespace', async () => {
      const querySpy = mockQueryBuilder(10, [secret1, secret2])
      const listQueryHandler: any = {
        page: 1,
        items: 2,
        sortBy: 'name',
        additionalParams: {},
        addToQueryBuilder: jest.fn(),
      }

      const secrets = await service.getSecrets(namespace1.id, listQueryHandler)

      expect(secrets.itemCount).toBe(10)
      expect(secrets.entities).toEqual([secret1, secret2])
      expect(querySpy).toBeCalledWith('secrets')
      expect(queryBuilderMock.getCount).toBeCalledTimes(1)
      expect(queryBuilderMock.getRawAndEntities).toBeCalledTimes(1)
      expect(listQueryHandler.addToQueryBuilder).toBeCalledWith(
        queryBuilderMock,
        'secrets'
      )
    })
  })

  describe('AddSecrets', () => {
    it('should add a secret with proper data and name', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(null)
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockImplementation((data) => {
          return {
            namespace: namespace1,
            name: data.name,
            description: data.description,
            id: nextId,
            creationTime: data.creationTime as Date,
            lastModificationTime: data.lastModificationTime as Date,
          }
        })
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockImplementation((data) => Promise.resolve(data as Secret))

      const secretData = await service.addSecret(
        1,
        name13,
        description13,
        secretValue
      )

      expect(secretData.id).toBe(4)
      expect(secretData.name).toBe(name13)
      expect(secretData.description).toBe(description13)
      expect(secretData.namespace.id).toBe(1)
      expect(secretData.creationTime).toEqual(new Date())
      expect(secretData.lastModificationTime).toEqual(new Date())
      expect(findSpy).toBeCalledTimes(1)
      expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name13 })
      expect(secretStorage.storeSecret).toBeCalledTimes(1)
      expect(secretStorage.storeSecret).toBeCalledWith(1, name13, secretValue)
      expect(createSpy).toBeCalledTimes(1)
      expect(createSpy).toBeCalledWith({
        name: name13,
        namespace: { id: 1 },
        description: description13,
        creationTime: new Date(),
        lastModificationTime: new Date(),
      })
      expect(saveSpy).toBeCalledTimes(1)
      expect(saveSpy).toBeCalledWith({
        name: name13,
        namespace: namespace1,
        description: description13,
        id: nextId,
        creationTime: new Date(),
        lastModificationTime: new Date(),
      })
    })

    it('should add a secret with a value only', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(null)
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockImplementation((data) => {
          return {
            namespace: namespace1,
            name: data.name,
            description: data.description,
            id: nextId,
            creationTime: data.creationTime as Date,
            lastModificationTime: data.lastModificationTime as Date,
          }
        })
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockImplementation((data) => Promise.resolve(data as Secret))

      const secretData = await service.addSecret(
        1,
        name13,
        undefined,
        secretValue
      )

      expect(secretData.id).toBe(4)
      expect(secretData.name).toBe(name13)
      expect(secretData.description).toBeUndefined()
      expect(secretData.namespace.id).toBe(1)
      expect(secretData.creationTime).toEqual(new Date())
      expect(secretData.lastModificationTime).toEqual(new Date())
      expect(findSpy).toBeCalledTimes(1)
      expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name13 })
      expect(secretStorage.storeSecret).toBeCalledTimes(1)
      expect(secretStorage.storeSecret).toBeCalledWith(1, name13, secretValue)
      expect(createSpy).toBeCalledTimes(1)
      expect(createSpy).toBeCalledWith({
        name: name13,
        namespace: { id: 1 },
        creationTime: new Date(),
        lastModificationTime: new Date(),
      })
      expect(saveSpy).toBeCalledTimes(1)
      expect(saveSpy).toBeCalledWith({
        name: name13,
        namespace: namespace1,
        id: nextId,
        creationTime: new Date(),
        lastModificationTime: new Date(),
      })
    })

    it('should not be possible to add a secret again', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(secret2)

      await expect(
        service.addSecret(1, name12, undefined, secretValue)
      ).rejects.toThrow(BadRequestException)

      expect(findSpy).toBeCalledTimes(1)
      expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name12 })
      expect(secretStorage.storeSecret).not.toBeCalled()
      expect(repository.create).not.toBeCalled()
      expect(repository.save).not.toBeCalled()
    })

    it.each([
      undefined,
      null,
      '',
      ' \t\n',
      '1VAR',
      'SOMEVAR$',
      'EVEN-DASH',
      name13.toLowerCase(),
    ])(
      'should not be possible to add a secret with the name "%s"',
      async (current: any) => {
        await expect(
          service.addSecret(1, current, undefined, secretValue)
        ).rejects.toThrow(BadRequestException)

        expect(repository.findOneBy).not.toBeCalled()
        expect(secretStorage.storeSecret).not.toBeCalled()
        expect(repository.create).not.toBeCalled()
        expect(repository.save).not.toBeCalled()
      }
    )

    it.each([undefined, null, ''])(
      'should be possible to add a secret data "%s" for description resulting in an undefined description',
      async (current: any) => {
        const findSpy = jest
          .spyOn(repository, 'findOneBy')
          .mockResolvedValue(null)
        const createSpy = jest
          .spyOn(repository, 'create')
          .mockImplementation((data) => {
            return {
              namespace: namespace1,
              name: data.name,
              description: data.description,
              id: nextId,
              creationTime: data.creationTime as Date,
              lastModificationTime: data.lastModificationTime as Date,
            }
          })
        const saveSpy = jest
          .spyOn(repository, 'save')
          .mockImplementation((data) => Promise.resolve(data as Secret))

        const secretData = await service.addSecret(
          1,
          name13,
          current,
          secretValue
        )
        expect(secretData.description).toBeFalsy()

        expect(findSpy).toHaveBeenLastCalledWith({
          namespace: { id: 1 },
          name: name13,
        })
        expect(secretStorage.storeSecret).toHaveBeenLastCalledWith(
          1,
          name13,
          secretValue
        )
        expect(createSpy).toHaveBeenLastCalledWith({
          name: name13,
          namespace: { id: 1 },
          creationTime: new Date(),
          lastModificationTime: new Date(),
        })
        expect(saveSpy).toBeCalledWith({
          name: name13,
          namespace: namespace1,
          id: nextId,
          creationTime: new Date(),
          lastModificationTime: new Date(),
        })
      }
    )

    it('should not be possible to add a secret with a length > max size (set to 128 bytes for the test)', async () => {
      const secretValue = randomBytes(65).toString('hex')

      await expect(
        service.addSecret(1, name13, description13, secretValue)
      ).rejects.toThrow(BadRequestException)
      expect(repository.findOneBy).not.toBeCalled()
      expect(secretStorage.storeSecret).not.toBeCalled()
      expect(repository.create).not.toBeCalled()
      expect(repository.save).not.toBeCalled()
    })
  })

  describe('UpdateSecret', () => {
    it('should update a secret with proper data', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(secret2)
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockImplementation((data) => Promise.resolve(data as Secret))

      const secretData = await service.updateSecret(
        1,
        name12,
        description12,
        secretValue
      )
      expect(secretData.id).toBe(2)
      expect(secretData.name).toBe(name12)
      expect(secretData.description).toBe(description12)
      expect(secretData.namespace.id).toBe(1)
      expect(secretData.creationTime).toEqual(secret2.creationTime)
      expect(secretData.lastModificationTime).toEqual(new Date())
      expect(findSpy).toBeCalledTimes(1)
      expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name12 })
      expect(secretStorage.storeSecret).toBeCalledTimes(1)
      expect(secretStorage.storeSecret).toBeCalledWith(1, name12, secretValue)
      expect(repository.update).toBeCalledTimes(1)
      expect(repository.update).toBeCalledWith(
        { id: secret2.id },
        {
          name: name12,
          namespace: namespace1,
          description: description12,
          id: secret2.id,
          creationTime: secret2.creationTime,
          lastModificationTime: new Date(),
        }
      )
      expect(saveSpy).toBeCalledTimes(1)
      expect(saveSpy).toBeCalledWith({
        name: name12,
        namespace: namespace1,
        description: description12,
        id: secret2.id,
        creationTime: secret2.creationTime,
        lastModificationTime: new Date(),
      })
    })

    it('should update a secret value only', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(secret2)
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockImplementation((data) => Promise.resolve(data as Secret))

      const secretData = await service.updateSecret(
        1,
        name12,
        undefined,
        secretValue
      )

      expect(secretData.id).toBe(2)
      expect(secretData.name).toBe(name12)
      expect(secretData.description).toBeNull()
      expect(secretData.namespace.id).toBe(1)
      expect(secretData.creationTime).toEqual(secret2.creationTime)
      expect(secretData.lastModificationTime).toEqual(new Date())
      expect(findSpy).toBeCalledTimes(1)
      expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name12 })
      expect(secretStorage.storeSecret).toBeCalledTimes(1)
      expect(secretStorage.storeSecret).toBeCalledWith(1, name12, secretValue)
      expect(repository.update).toBeCalledTimes(1)
      expect(repository.update).toBeCalledWith(
        { id: secret2.id },
        {
          name: name12,
          namespace: namespace1,
          description: null,
          id: secret2.id,
          creationTime: secret2.creationTime,
          lastModificationTime: new Date(),
        }
      )
      expect(saveSpy).toBeCalledTimes(1)
      expect(saveSpy).toBeCalledWith({
        name: name12,
        namespace: namespace1,
        description: null,
        id: secret2.id,
        creationTime: secret2.creationTime,
        lastModificationTime: new Date(),
      })
    })

    it('should update a secret value only and keep description', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(secret1)
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockImplementation((data) => Promise.resolve(data as Secret))

      const secretData = await service.updateSecret(
        1,
        name11,
        undefined,
        secretValue
      )

      expect(secretData.id).toBe(1)
      expect(secretData.name).toBe(name11)
      expect(secretData.description).toBe(description11)
      expect(secretData.namespace.id).toBe(1)
      expect(secretData.creationTime).toEqual(secret1.creationTime)
      expect(secretData.lastModificationTime).toEqual(new Date())
      expect(findSpy).toBeCalledTimes(1)
      expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name11 })
      expect(secretStorage.storeSecret).toBeCalledTimes(1)
      expect(secretStorage.storeSecret).toBeCalledWith(1, name11, secretValue)
      expect(repository.update).toBeCalledTimes(1)
      expect(repository.update).toBeCalledWith(
        { id: secret1.id },
        {
          name: name11,
          namespace: namespace1,
          description: secret1.description,
          id: secret1.id,
          creationTime: secret1.creationTime,
          lastModificationTime: new Date(),
        }
      )
      expect(saveSpy).toBeCalledTimes(1)
      expect(saveSpy).toBeCalledWith({
        name: name11,
        namespace: namespace1,
        description: secret1.description,
        id: secret1.id,
        creationTime: secret1.creationTime,
        lastModificationTime: new Date(),
      })
    })

    it('should update a description only', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(secret2)
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockImplementation((data) => Promise.resolve(data as Secret))

      const secretData = await service.updateSecret(
        1,
        name12,
        description12,
        undefined
      )

      expect(secretData.id).toBe(2)
      expect(secretData.name).toBe(name12)
      expect(secretData.description).toBe(description12)
      expect(secretData.namespace.id).toBe(1)
      expect(secretData.creationTime).toEqual(secret2.creationTime)
      expect(secretData.lastModificationTime).toEqual(new Date())
      expect(findSpy).toBeCalledTimes(1)
      expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name12 })
      expect(secretStorage.storeSecret).not.toBeCalled()
      expect(repository.update).toBeCalledTimes(1)
      expect(repository.update).toBeCalledWith(
        { id: secret2.id },
        {
          name: name12,
          namespace: namespace1,
          description: description12,
          id: secret2.id,
          creationTime: secret2.creationTime,
          lastModificationTime: new Date(),
        }
      )
      expect(saveSpy).toBeCalledTimes(1)
      expect(saveSpy).toBeCalledWith({
        name: name12,
        namespace: namespace1,
        description: description12,
        id: secret2.id,
        creationTime: secret2.creationTime,
        lastModificationTime: new Date(),
      })
    })

    it.each([null, ''])(
      'should delete a description, if "%s" string is given',
      async (current) => {
        const findSpy = jest
          .spyOn(repository, 'findOneBy')
          .mockResolvedValue(secret1)
        const saveSpy = jest
          .spyOn(repository, 'save')
          .mockImplementation((data) => Promise.resolve(data as Secret))

        const secretData = await service.updateSecret(
          1,
          name11,
          current,
          undefined
        )

        expect(secretData.id).toBe(1)
        expect(secretData.name).toBe(name11)
        expect(secretData.description).toBeFalsy()
        expect(secretData.namespace.id).toBe(1)
        expect(secretData.creationTime).toEqual(secret1.creationTime)
        expect(secretData.lastModificationTime).toEqual(new Date())
        expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name11 })
        expect(secretStorage.storeSecret).not.toBeCalled()
        expect(repository.update).toBeCalledWith(
          { id: secret1.id },
          {
            name: name11,
            description: null,
            namespace: namespace1,
            id: secret1.id,
            creationTime: secret1.creationTime,
            lastModificationTime: new Date(),
          }
        )
        expect(saveSpy).toBeCalledWith({
          name: name11,
          namespace: namespace1,
          description: null,
          id: secret1.id,
          creationTime: secret1.creationTime,
          lastModificationTime: new Date(),
        })
      }
    )

    it.each([undefined, null, ''])(
      'should keep an undefined description if description "%s" is given',
      async (current: any) => {
        const findSpy = jest
          .spyOn(repository, 'findOneBy')
          .mockResolvedValue(secret2)
        const saveSpy = jest
          .spyOn(repository, 'save')
          .mockImplementation((data) => Promise.resolve(data as Secret))

        const secretData = await service.updateSecret(
          1,
          name12,
          current,
          undefined
        )
        expect(secretData.description).toBeNull()
        expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name12 })
        expect(secretStorage.storeSecret).not.toBeCalled()
        expect(repository.update).toBeCalledWith(
          { id: secret2.id },
          {
            name: name12,
            description: null,
            namespace: namespace1,
            id: secret2.id,
            creationTime: secret2.creationTime,
            lastModificationTime: new Date(),
          }
        )
        expect(saveSpy).toBeCalledWith({
          name: name12,
          description: null,
          namespace: namespace1,
          id: secret2.id,
          creationTime: secret2.creationTime,
          lastModificationTime: new Date(),
        })
      }
    )

    it('should throw an error if a wrong namespace is given', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(null)

      await expect(
        service.updateSecret(3, name11, '', undefined)
      ).rejects.toThrow(NotFoundException)
      expect(findSpy).toBeCalledWith({ namespace: { id: 3 }, name: name11 })
      expect(secretStorage.storeSecret).not.toBeCalled()
      expect(repository.update).not.toBeCalled()
      expect(repository.save).not.toBeCalled()
    })

    it('should throw an error, if a wrong name is given', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(null)

      await expect(
        service.updateSecret(1, name21, '', undefined)
      ).rejects.toThrow(NotFoundException)

      expect(findSpy).toBeCalledWith({ namespace: { id: 1 }, name: name21 })
      expect(secretStorage.storeSecret).not.toBeCalled()
      expect(repository.update).not.toBeCalled()
      expect(repository.save).not.toBeCalled()
    })

    it('should not be possible to update a secret value with a length > max size (set to 128 bytes for the test)', async () => {
      const secretValue = randomBytes(65).toString('hex')
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(secret2)

      await expect(
        service.updateSecret(1, secret2.name, undefined, secretValue)
      ).rejects.toThrow(BadRequestException)
      expect(findSpy).toBeCalledWith({
        namespace: { id: 1 },
        name: secret2.name,
      })
      expect(secretStorage.storeSecret).not.toBeCalled()
      expect(repository.create).not.toBeCalled()
      expect(repository.save).not.toBeCalled()
    })
  })

  describe('DeleteSecret', () => {
    it('should delete a secret propely', async () => {
      await service.deleteSecret(1, name11)

      expect(repository.delete).toBeCalledWith({
        namespace: { id: 1 },
        name: name11,
      })
      expect(secretStorage.deleteSecret).toBeCalledWith(1, name11)
    })

    it('should still only pass data, even if objects are unknown', async () => {
      await service.deleteSecret(3, 'unknown')

      expect(repository.delete).toBeCalledWith({
        namespace: { id: 3 },
        name: 'unknown',
      })
      expect(secretStorage.deleteSecret).toBeCalledWith(3, 'unknown')
    })
  })
})
