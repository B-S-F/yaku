// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1731486466435 implements MigrationInterface {
  name = 'Database1731486466435'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "run" ADD "synthetic" boolean NOT NULL DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "run" DROP COLUMN "synthetic"`)
  }
}
