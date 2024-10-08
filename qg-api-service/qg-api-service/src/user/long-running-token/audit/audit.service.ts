import { Injectable } from '@nestjs/common'
import { ClassConstructor } from 'class-transformer'
import { EntityManager } from 'typeorm'
import { Action, AuditEntity } from './audit.entity'
import { AuditActor } from '../../../namespace/audit/audit.entity'

/**
 * Service for adding audit entries for a given entity to the database.
 * @template T The audit entity type of the audited entity.
 */
@Injectable()
export class AuditService<T extends AuditEntity> {
  /**
   * @param entityType The audit entity type of the audited entity.
   */
  constructor(private readonly entityType: ClassConstructor<T>) {}

  /**
   * Adds an audit entry to the database.
   * @param entityId The entity ID of the audited entity.
   * @param original The original entity before the action.
   * @param modified The modified entity after the action.
   * @param actor The actor who performed the action.
   * @param action The action that was performed on the entity.
   * @param entityManager The entity manager to use for the database operation.
   * @example
   * The following example demonstrates how to add an audit entry for a release entity.
   * ```ts
   * const auditService = new ReleaseAuditService()
   * auditService.append(
   *    namespaceId,
   *    release.id,
   *    originalRelease,
   *    release,
   *    actor,
   *    'update',
   *    queryRunner.manager
   *  )
   * ````
   */
  async append(
    entityId: number,
    original: object,
    modified: object,
    actor: AuditActor,
    action: Action,
    entityManager: EntityManager
  ) {
    const audit = new this.entityType()

    audit.entityId = entityId
    audit.original = original
    audit.modified = modified
    audit.actor = actor
    audit.modificationTime = new Date()
    audit.action = action

    await entityManager.insert(this.entityType, audit as any)
  }
}
