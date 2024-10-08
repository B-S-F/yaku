import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1726572236042 implements MigrationInterface {
  name = 'Database1726572236042'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "config_entity" ALTER COLUMN "creationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "config_entity" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "plannedDate" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "creationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "release_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "run" ALTER COLUMN "creationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "run" ALTER COLUMN "completionTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "run_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "secret" ALTER COLUMN "creationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "secret" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "runCompletionTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "resolvedDate" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "metric" ALTER COLUMN "creationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "creationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "comment_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "creationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "approval_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "override_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "task_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "creationTime" TYPE TIMESTAMP WITH TIME ZONE`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "creationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "task_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "override_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "approval_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "creationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "comment_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "creationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "metric" ALTER COLUMN "creationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "updatedAt" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "createdAt" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "resolvedDate" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "runCompletionTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "secret" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "secret" ALTER COLUMN "creationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "run_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "run" ALTER COLUMN "completionTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "run" ALTER COLUMN "creationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "release_audit" ALTER COLUMN "modificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "creationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "plannedDate" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "config_entity" ALTER COLUMN "lastModificationTime" TYPE TIMESTAMP`
    )
    await queryRunner.query(
      `ALTER TABLE "config_entity" ALTER COLUMN "creationTime" TYPE TIMESTAMP`
    )
  }
}
