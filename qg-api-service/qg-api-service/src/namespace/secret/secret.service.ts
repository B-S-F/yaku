import { EntityList, ListQueryHandler } from '@B-S-F/api-commons-lib'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, Repository } from 'typeorm'
import { SecretStorage } from './secret-storage.service'
import { Secret } from './secret.entity'

@Injectable()
export class SecretConfig {
  constructor(readonly maxLength: number) {}
}

@Injectable()
export class SecretService {
  private readonly envVariableNameChecker = new RegExp('^[A-Z_][A-Z_0-9]*$')

  constructor(
    @InjectRepository(Secret) private readonly repository: Repository<Secret>,
    @Inject(SecretStorage) private readonly storage: SecretStorage,
    @Inject(SecretConfig) private readonly config: SecretConfig
  ) {}

  async getSecrets(
    namespaceId: number,
    listQueryHandler: ListQueryHandler
  ): Promise<EntityList<Secret>> {
    const queryBuilder = this.repository
      .createQueryBuilder('secrets')
      .leftJoinAndSelect('secrets.namespace', 'Secret')
      .where('secrets.namespace.id = :namespaceId', { namespaceId })

    listQueryHandler.addToQueryBuilder<Secret>(queryBuilder, 'secrets')

    const itemCount = await queryBuilder.getCount()
    const { entities } = await queryBuilder.getRawAndEntities()

    return { itemCount, entities }
  }

  async addSecret(
    namespaceId: number,
    name: string,
    description: string | undefined,
    secret: string
  ): Promise<Secret> {
    if (!this.envVariableNameChecker.test(name)) {
      throw new BadRequestException(
        'The name of a secret can only contain upper case letters, numbers and underscore. It has to start with a letter or an underscore.'
      )
    }
    if (this.config.maxLength > 0 && secret.length > this.config.maxLength) {
      throw new BadRequestException(
        `A secret must not exceed ${this.config.maxLength} bytes`
      )
    }
    if (
      await this.repository.findOneBy({
        namespace: { id: namespaceId },
        name,
      })
    ) {
      throw new BadRequestException(
        'Secret with this name already exists, use PATCH to change'
      )
    }
    const nowDate = new Date()
    const secretData: DeepPartial<Secret> = {
      name,
      namespace: { id: namespaceId },
      creationTime: nowDate,
      lastModificationTime: nowDate,
    }
    if (description) {
      secretData.description = description
    }

    await this.storage.storeSecret(namespaceId, secretData.name, secret)
    const newItem = this.repository.create(secretData)
    return this.repository.save(newItem)
  }

  async updateSecret(
    namespaceId: number,
    name: string,
    description: string | null | undefined,
    secret: string | undefined
  ): Promise<Secret> {
    const secretData = await this.repository.findOneBy({
      namespace: { id: namespaceId },
      name,
    })
    if (!secretData) {
      throw new NotFoundException(`Secret ${name} not found`)
    }
    if (
      secret?.length &&
      this.config.maxLength > 0 &&
      secret.length > this.config.maxLength
    ) {
      throw new BadRequestException(
        `A secret must not exceed ${this.config.maxLength} bytes`
      )
    }

    const changedData: DeepPartial<Secret> = {
      id: secretData.id,
      name: secretData.name,
      namespace: secretData.namespace,
      creationTime: secretData.creationTime,
      lastModificationTime: new Date(),
    }
    if (description?.length > 0) {
      changedData.description = description
    } else if (description === undefined && secretData.description) {
      changedData.description = secretData.description
    } else {
      changedData.description = null
    }

    if (secret?.length > 0) {
      await this.storage.storeSecret(namespaceId, name, secret)
    }
    await this.repository.update({ id: secretData.id }, changedData)
    return this.repository.save(changedData)
  }

  async deleteSecret(namespaceId: number, name: string): Promise<void> {
    await this.storage.deleteSecret(namespaceId, name) // Delete Secret from storage
    await this.repository.delete({ namespace: { id: namespaceId }, name })
  }
}
