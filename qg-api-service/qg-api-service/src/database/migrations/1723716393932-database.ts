import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1723716393932 implements MigrationInterface {
  name = 'Database1723716393932'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ADD "title" character varying NOT NULL DEFAULT ''`
    )
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "description" DROP NOT NULL`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "description" SET NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "title"`)
  }
}
