import { ListQueryHandler } from '@B-S-F/api-commons-lib'
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isUUID } from 'class-validator'
import { RequestUser } from '../../namespace/module.utils'
import { QueryRunner, Repository } from 'typeorm'
import { Action } from './audit/audit.entity'
import { LongRunningToken } from './long.running.token'
import { AuthCache } from './long.running.token.cache'
import {
  LongRunningTokenAuditService,
  LongRunningTokenEntity,
  STATUS,
} from './long.running.token.entity'
import {
  CreateTokenResponseDto,
  GetTokenResponseDto,
  toCreateTokenResponseDto,
  toGetTokenResponseDto,
} from './long.running.token.utils'
import { AuditActor } from '../../namespace/audit/audit.entity'

@Injectable()
export class LongRunningTokenService {
  constructor(
    @InjectRepository(LongRunningTokenEntity)
    private readonly repository: Repository<LongRunningTokenEntity>,
    @Inject(AuthCache)
    private readonly authCache: AuthCache,
    @Inject(LongRunningTokenAuditService)
    private readonly auditService: LongRunningTokenAuditService
  ) {}

  async list(
    actor: RequestUser,
    listQueryHandler: ListQueryHandler
  ): Promise<{ dtos: GetTokenResponseDto[]; itemCount: number }> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('SERIALIZABLE')
      const dtos = await this.listWithTransaction(
        queryRunner,
        actor,
        listQueryHandler
      )
      await queryRunner.commitTransaction()
      return dtos
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async listWithTransaction(
    queryRunner: QueryRunner,
    actor: RequestUser,
    listQueryHandler: ListQueryHandler
  ): Promise<{ dtos: GetTokenResponseDto[]; itemCount: number }> {
    const kcuid = this.extractKeycloakUserId(actor)

    const queryBuilder = queryRunner.manager
      .getRepository(LongRunningTokenEntity)
      .createQueryBuilder('tokens')
      .where('tokens.kcuid = :kcuid', { kcuid })

    listQueryHandler.addToQueryBuilder<LongRunningTokenEntity>(
      queryBuilder,
      'tokens'
    )

    const { entities } = await queryBuilder.getRawAndEntities()
    const itemCount = await queryBuilder.getCount()

    return {
      dtos: entities.map((e) => toGetTokenResponseDto(e)),
      itemCount,
    }
  }

  async get(id: number, actor: RequestUser): Promise<GetTokenResponseDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('SERIALIZABLE')
      const tokenDto = await this.getWithTransaction(queryRunner, id, actor)
      await queryRunner.commitTransaction()
      return tokenDto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async getWithTransaction(
    queryRunner: QueryRunner,
    id: number,
    actor: RequestUser
  ): Promise<GetTokenResponseDto> {
    const kcuid = this.extractKeycloakUserId(actor)
    const tokenEntity = await queryRunner.manager.findOneOrFail(
      LongRunningTokenEntity,
      {
        where: { id: id, kcuid: kcuid },
      }
    )

    return toGetTokenResponseDto(tokenEntity)
  }

  async create(
    description: string,
    try_admin: boolean,
    actor: RequestUser
  ): Promise<CreateTokenResponseDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('SERIALIZABLE')
      const token = await this.createWithTransaction(
        queryRunner,
        description,
        try_admin,
        actor
      )
      await queryRunner.commitTransaction()
      return token
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async createWithTransaction(
    queryRunner: QueryRunner,
    description: string,
    try_admin: boolean,
    actor: RequestUser
  ): Promise<CreateTokenResponseDto> {
    const kcuid = this.extractKeycloakUserId(actor)
    const tokenEntity = new LongRunningTokenEntity()

    const nowDate = new Date()

    const preToken = LongRunningToken.generatePreToken()

    tokenEntity.description = description
    tokenEntity.try_admin = try_admin
    tokenEntity.kcuid = kcuid
    tokenEntity.hash = await preToken.generateHash()
    tokenEntity.status = STATUS.ACTIVE
    tokenEntity.createdBy = actor.id
    tokenEntity.creationTime = nowDate
    tokenEntity.lastModifiedBy = actor.id
    tokenEntity.lastModificationTime = nowDate

    const savedTokenEntity = await queryRunner.manager.save(tokenEntity)

    const id = savedTokenEntity.id

    const token = LongRunningToken.from(id, preToken)

    this.auditService.append(
      savedTokenEntity.id,
      {},
      savedTokenEntity,
      AuditActor.convertFrom(actor),
      Action.CREATE,
      queryRunner.manager
    )

    return toCreateTokenResponseDto(savedTokenEntity, token.toString())
  }

  async revoke(id: number, actor: RequestUser): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('SERIALIZABLE')
      await this.revokeWithTransaction(queryRunner, id, actor)
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async revokeWithTransaction(
    queryRunner: QueryRunner,
    id: number,
    actor: RequestUser
  ): Promise<void> {
    const kcuid = this.extractKeycloakUserId(actor)
    const token = await queryRunner.manager.findOneOrFail(
      LongRunningTokenEntity,
      {
        where: { id: id, kcuid: kcuid },
      }
    )

    if (token.status === STATUS.REVOKED) return

    this.authCache.dropByKeyCloakId(kcuid)

    const original = token.DeepCopy()

    const nowDate = new Date()

    token.status = STATUS.REVOKED
    token.lastModifiedBy = actor.id
    token.lastModificationTime = nowDate

    const newToken = await queryRunner.manager.save(token)

    this.auditService.append(
      id,
      original,
      newToken,
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )
  }

  extractKeycloakUserId(user: RequestUser): string {
    const kcuid = user.id

    if (!isUUID(kcuid, 4)) {
      throw new Error(
        `Implementation error: keycloak user id is not a uuid: ${kcuid}`
      )
    }

    return kcuid
  }

  async retrieveKeyCloakUserId(
    tokenCandidate: string
  ): Promise<{ id: string; try_admin: boolean }> {
    try {
      const token = LongRunningToken.parse(tokenCandidate)

      const entity = await this.repository.findOneOrFail({
        where: { id: token.getId() },
      })

      const tokenMatchesDataInDatabase = await token.matches(entity.hash)

      if (!tokenMatchesDataInDatabase) {
        throw new UnauthorizedException(`Illegal token: ${token}`)
      }

      if (entity.status !== STATUS.ACTIVE) {
        throw new UnauthorizedException(`Token not active: ${token}`)
      }

      return {
        id: entity.kcuid,
        try_admin: entity.try_admin,
      }
    } catch (e) {
      throw new UnauthorizedException(e)
    }
  }
}
