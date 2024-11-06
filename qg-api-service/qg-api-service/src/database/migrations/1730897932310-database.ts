import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1730897932310 implements MigrationInterface {
  name = 'Database1730897932310'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "run" ADD "synthetic" boolean`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "run" DROP COLUMN "synthetic"`)
  }
}
