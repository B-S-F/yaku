// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1732714208822 implements MigrationInterface {
  name = 'Database1732714208822'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "kcuid" SET DATA TYPE uuid USING "kcuid"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_profile" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "resolver" SET DATA TYPE uuid USING "resolver"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "approver" SET DATA TYPE uuid USING "approver"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "createdBy" SET DATA TYPE uuid USING "createdBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "lastModifiedBy" SET DATA TYPE uuid USING "lastModifiedBy"::uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "assignees" SET DATA TYPE uuid[] USING "assignees"::uuid[]`,
    )
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "userId" SET DATA TYPE uuid USING "userId"::uuid`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "userId" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "assignees" SET DATA TYPE text[]`,
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "createdBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "createdBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "createdBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ALTER COLUMN "approver" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "createdBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "findings" ALTER COLUMN "resolver" SET DATA TYPE varchar(100)`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_profile" ALTER COLUMN "id" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "createdBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "long_running_token" ALTER COLUMN "kcuid" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "lastModifiedBy" SET DATA TYPE varchar`,
    )
    await queryRunner.query(
      `ALTER TABLE "release" ALTER COLUMN "createdBy" SET DATA TYPE varchar`,
    )
  }
}
