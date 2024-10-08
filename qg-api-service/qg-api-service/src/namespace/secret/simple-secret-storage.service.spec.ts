import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EncryptionService } from '../../gp-services/encryption.service'
import { SecretStorage } from './secret-storage.service'
import { SimpleSecretStorage } from './simple-secret-storage'
import { EncryptedSecret } from './simple-secret-storage.entity'

describe('SecretStorageService', () => {
  let service: SecretStorage
  let encSrv: EncryptionService
  let repository: Repository<EncryptedSecret>

  const name11 = 'Test11'
  const value11 = 'Secret1'
  const name12 = 'Test12'
  const value12 = 'Secret2'
  const name21 = 'Test21'
  const name13 = 'Test13'
  const value13 = 'Secret4'

  const encryptedSecret1: EncryptedSecret = {
    namespaceId: 1,
    name: name11,
    value: value11,
  }
  const encryptedSecret2: EncryptedSecret = {
    namespaceId: 1,
    name: name12,
    value: value12,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimpleSecretStorage,
        {
          provide: EncryptionService,
          useValue: {
            encryptSecret: jest.fn().mockImplementation((value) => value),
            decryptSecret: jest.fn().mockImplementation((value) => value),
          },
        },
        {
          provide: getRepositoryToken(EncryptedSecret),
          useValue: {
            findBy: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<SimpleSecretStorage>(SimpleSecretStorage)
    encSrv = module.get<EncryptionService>(EncryptionService)
    repository = module.get(getRepositoryToken(EncryptedSecret))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('Get secrets', () => {
    it('should return the mock values as given', async () => {
      const repoSpy = jest
        .spyOn(repository, 'findBy')
        .mockResolvedValue([encryptedSecret1, encryptedSecret2])

      const returnedValues = await service.getSecrets(1)

      expect(Object.keys(returnedValues).length).toBe(2)
      expect(returnedValues[name11]).toBe(value11)
      expect(returnedValues[name12]).toBe(value12)
      expect(returnedValues[name21]).toBeUndefined()
      expect(repoSpy).toBeCalledWith({ namespaceId: 1 })
      expect(encSrv.decryptSecret).toBeCalledTimes(2)
      expect(encSrv.decryptSecret).toBeCalledWith(value11)
      expect(encSrv.decryptSecret).toBeCalledWith(value12)
    })

    it('should handle the case of an empty list properly', async () => {
      const repoSpy = jest.spyOn(repository, 'findBy').mockResolvedValue([])

      const returnedValues = await service.getSecrets(2)

      expect(Object.keys(returnedValues).length).toBe(0)
      expect(repoSpy).toBeCalledWith({ namespaceId: 2 })
      expect(encSrv.decryptSecret).not.toBeCalled()
    })
  })

  describe('Store secret', () => {
    it('should properly save a new secret', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(null)
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockImplementation((data) => data as EncryptedSecret)

      await service.storeSecret(1, name13, value13)

      expect(findSpy).toBeCalledWith({ namespaceId: 1, name: name13 })
      expect(encSrv.encryptSecret).toBeCalledTimes(1)
      expect(encSrv.encryptSecret).toBeCalledWith(value13)
      expect(createSpy).toBeCalledWith({
        namespaceId: 1,
        name: name13,
        value: value13,
      })
      expect(repository.save).toBeCalledWith({
        namespaceId: 1,
        name: name13,
        value: value13,
      })
      expect(repository.update).not.toBeCalled()
    })

    it('should properly update an existing secret', async () => {
      const findSpy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(encryptedSecret1)

      await service.storeSecret(1, name11, value13)

      expect(findSpy).toBeCalledWith({ namespaceId: 1, name: name11 })
      expect(encSrv.encryptSecret).toBeCalledTimes(1)
      expect(encSrv.encryptSecret).toBeCalledWith(value13)
      expect(repository.update).toBeCalledWith(
        { namespaceId: 1, name: name11 },
        { namespaceId: 1, name: name11, value: value13 }
      )
      expect(repository.save).toBeCalledWith({
        namespaceId: 1,
        name: name11,
        value: value13,
      })
      expect(repository.create).not.toBeCalled()
    })

    it('should throw error, if bad names are given on store', async () => {
      for (const current of [undefined, null, '', ' \t\n']) {
        await expect(service.storeSecret(1, current, value11)).rejects.toThrow(
          BadRequestException
        )

        expect(repository.findOneBy).not.toBeCalled()
        expect(encSrv.encryptSecret).not.toBeCalled()
        expect(repository.create).not.toBeCalled()
        expect(repository.update).not.toBeCalled()
        expect(repository.save).not.toBeCalled()
      }
    })

    it('should throw error, if bad secret values are given on store', async () => {
      for (const current of [undefined, null, '', ' \t\n']) {
        await expect(service.storeSecret(1, name11, current)).rejects.toThrow(
          BadRequestException
        )

        expect(repository.findOneBy).not.toBeCalled()
        expect(encSrv.encryptSecret).not.toBeCalled()
        expect(repository.create).not.toBeCalled()
        expect(repository.update).not.toBeCalled()
        expect(repository.save).not.toBeCalled()
      }
    })
  })

  describe('Delete secret', () => {
    it('should delete an item properly', async () => {
      await service.deleteSecret(2, name21)

      expect(repository.delete).toBeCalledWith({ namespaceId: 2, name: name21 })
    })
  })
})
