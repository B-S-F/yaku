import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1731327756433 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //approval
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "approver" SET DATA TYPE uuid USING "approver"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`
    )
    //comment
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`
    )
    //long_running_token
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "kcuid" SET DATA TYPE uuid USING "kcuid"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`
    )
    //override
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`
    )
    //release
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`
    )
    //subscriptions
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "userId" SET DATA TYPE uuid USING "userId"::uuid`
    )
    //task
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "assignees" SET DATA TYPE uuid[] USING "assignees"::uuid[]`
    )
    //user_profile
    await queryRunner.query(
      `ALTER TABLE "user_profile" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid`
    )
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    //approval
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "approver" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "createdBy" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`
    )
    //comment
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "createdBy" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`
    )
    //long_running_token
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "kcuid" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "createdBy" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`
    )
    //override
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "createdBy" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`
    )
    //release
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "createdBy" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`
    )
    //subscriptions
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "userId" SET DATA TYPE varchar`
    )
    //task
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "createdBy" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "assignees" SET DATA TYPE text[]`
    )
    //user_profile
    await queryRunner.query(
      `ALTER TABLE "user_profile" ALTER COLUMN "id" SET DATA TYPE varchar`
    )
  }
}
