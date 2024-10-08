import { Inject, Injectable } from '@nestjs/common'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

@Injectable()
export class EncryptionServiceConfig {
  constructor(readonly encryptionKey: string) {}
}

@Injectable()
export class EncryptionService {
  private readonly ivLength = 8

  // The encryption uses AES256, so the key has to be a 32 byte long string
  constructor(
    @Inject(EncryptionServiceConfig)
    private readonly serviceConfig: EncryptionServiceConfig
  ) {
    const iv = randomBytes(this.ivLength).toString('hex')
    createCipheriv('aes-256-cbc', this.serviceConfig.encryptionKey, iv) // let crypto check the validity of the key
  }

  encryptSecret(secret: string): string {
    if (!secret) {
      throw new Error('Parameter secret must contain valid data')
    }

    const iv = randomBytes(this.ivLength).toString('hex')
    const cipher = createCipheriv(
      'aes-256-cbc',
      this.serviceConfig.encryptionKey,
      iv
    )
    let encrypted = cipher.update(secret, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    encrypted = `${iv}${encrypted}`
    return encrypted
  }

  decryptSecret(secret: string): string {
    if (!secret) {
      throw new Error('Parameter secret must contain valid data')
    }

    const iv = secret.slice(0, this.ivLength * 2)
    const encrypted = secret.slice(this.ivLength * 2)
    const decipher = createDecipheriv(
      'aes-256-cbc',
      this.serviceConfig.encryptionKey,
      iv
    )
    const decrypted = decipher.update(encrypted, 'base64', 'utf8')
    return decrypted + decipher.final('utf8')
  }
}
