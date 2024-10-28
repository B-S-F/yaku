import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, In, Repository } from 'typeorm'

import { Namespace } from './namespace.entity'
import { ADMIN_ROLE, rolesOf } from '../../guards/roles.guard'

export type NamespaceCreated = (namespaceId: number) => Promise<void>

export class NamespaceCallbacks {
  constructor(readonly callbacks: NamespaceCreated[]) {}
}

@Injectable()
export class NamespaceService {
  constructor(
    @InjectRepository(Namespace)
    private readonly repository: Repository<Namespace>,
    @Inject(NamespaceCallbacks)
    private readonly creationListener: NamespaceCallbacks
  ) {}

  async getList(user: KeyCloakUser): Promise<Namespace[]> {
    if (rolesOf(user).includes(ADMIN_ROLE)) {
      return this.repository.find()
    }
    const namespaceIds = user.namespaces.map((ns) => ns.id)
    return user.namespaces.length > 0
      ? await this.repository.find({
          where: {
            id: In(namespaceIds),
          },
        })
      : []
  }

  async get(id: number): Promise<Namespace> {
    const namespace = await this.repository.findOne({
      where: { id },
    })
    if (!namespace) {
      throw new NotFoundException(`Namespace with id ${id} not found`)
    }
    return namespace
  }

  async create(name: string): Promise<Namespace> {
    if (!name) {
      throw new BadRequestException(
        'An empty name is not allowed for a namespace'
      )
    }

    const namespace: DeepPartial<Namespace> = {
      name,
    }

    const createdNamespace = this.repository.create(namespace)
    const storedNamespace = await this.repository.save(createdNamespace)
    for (const callback of this.creationListener.callbacks) {
      await callback(storedNamespace.id)
    }
    return storedNamespace
  }

  async update(id: number, name: string): Promise<Namespace> {
    const namespace = await this.repository.findOneBy({ id })
    if (!namespace) {
      throw new NotFoundException(`Namespace with id ${id} not found`)
    }

    if (name) {
      namespace.name = name
    }

    return this.repository.save(namespace)
  }
}
