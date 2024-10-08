import { Test, TestingModule } from '@nestjs/testing'
import { randomBytes } from 'crypto'
import {
  EncryptionService,
  EncryptionServiceConfig,
} from './encryption.service'

const ENCRYPTION_KEY = randomBytes(16).toString('hex')

describe('EncryptionService', () => {
  let service: EncryptionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: EncryptionServiceConfig,
          useFactory: () => new EncryptionServiceConfig(ENCRYPTION_KEY),
        },
      ],
    }).compile()

    service = module.get<EncryptionService>(EncryptionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should be able to decrypt an encrypted piece of data', () => {
    const mySecretData =
      'Once upon a time, something happened to bad code that did not encrypt and decrypt properly'
    const encrypted = service.encryptSecret(mySecretData)
    expect(encrypted).not.toEqual(mySecretData)
    const decrypted = service.decryptSecret(encrypted)
    expect(decrypted).toEqual(mySecretData)
  })

  it('should allow to encrypt pure whitespace piece of data', () => {
    const whitespaceData = ' \t\n'
    const encrypted = service.encryptSecret(whitespaceData)
    const decrypted = service.decryptSecret(encrypted)
    expect(decrypted).toEqual(whitespaceData)
  })

  it('should not allow to encrypt or decrypt with invalid strings', () => {
    for (const current of [undefined, null, '']) {
      expect(() => service.encryptSecret(current)).toThrow(
        'Parameter secret must contain valid data'
      )
      expect(() => service.decryptSecret(current)).toThrow(
        'Parameter secret must contain valid data'
      )
    }
  })

  it('should be possible to instantiate the service with a key of appropriate length', () => {
    expect(
      new EncryptionService({
        encryptionKey: randomBytes(16).toString('hex'),
      } as EncryptionServiceConfig)
    ).toBeDefined()
  })

  it('should not be possible to instantiate the service with a key of unmatching length', () => {
    for (const length of [15, 17]) {
      expect(
        () =>
          new EncryptionService({
            encryptionKey: randomBytes(length).toString('hex'),
          } as EncryptionServiceConfig)
      ).toThrow('Invalid key length')
    }
  })
})
