import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1725353720260 implements MigrationInterface {
  name = 'Database1725353720260'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ADD "chapter" character varying`
    )
    await queryRunner.query(
      `ALTER TABLE "task" ADD "requirement" character varying`
    )
    await queryRunner.query(`ALTER TABLE "task" ADD "check" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "check"`)
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "requirement"`)
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "chapter"`)
  }
}
