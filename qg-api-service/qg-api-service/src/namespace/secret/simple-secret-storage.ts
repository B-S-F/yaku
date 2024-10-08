import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, Repository } from 'typeorm'
import { EncryptionService } from '../../gp-services/encryption.service'
import { SecretStorage } from './secret-storage.service'
import { EncryptedSecret } from './simple-secret-storage.entity'

@Injectable()
export class SimpleSecretStorage extends SecretStorage {
  constructor(
    @InjectRepository(EncryptedSecret)
    readonly repository: Repository<EncryptedSecret>,
    @Inject(EncryptionService) readonly encryption: EncryptionService
  ) {
    super()
  }

  async getSecrets(namespaceId: number): Promise<{ [key: string]: string }> {
    const secretMap: { [key: string]: string } = (
      await this.repository.findBy({ namespaceId })
    ).reduce((map, secret) => {
      map[secret.name] = this.encryption.decryptSecret(secret.value)
      return map
    }, {})
    return secretMap
  }

  async storeSecret(
    namespaceId: number,
    name: string,
    secretValue: string
  ): Promise<void> {
    if (!name || !name.trim()) {
      throw new BadRequestException('Parameter name must contain valid data')
    }

    if (!secretValue || !secretValue.trim()) {
      throw new BadRequestException('Secret must contain valid data')
    }

    const dataObj = await this.repository.findOneBy({ namespaceId, name })
    let newObj: EncryptedSecret
    if (dataObj) {
      newObj = { ...dataObj, value: this.encryption.encryptSecret(secretValue) }
      await this.repository.update({ namespaceId, name }, newObj)
    } else {
      const newObjData: DeepPartial<EncryptedSecret> = {
        namespaceId,
        name,
        value: this.encryption.encryptSecret(secretValue),
      }
      newObj = this.repository.create(newObjData)
    }
    await this.repository.save(newObj)
  }

  async deleteSecret(namespaceId: number, name: string): Promise<void> {
    await this.repository.delete({ namespaceId, name })
  }
}
