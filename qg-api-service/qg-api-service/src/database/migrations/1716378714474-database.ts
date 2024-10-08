import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1716378714474 implements MigrationInterface {
  name = 'Database1716378714474'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "approval" ADD "commentId" integer`)
    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "UQ_01f084747f86160edbe4ffd91cb" UNIQUE ("commentId")`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "FK_01f084747f86160edbe4ffd91cb" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "approval" DROP CONSTRAINT "FK_01f084747f86160edbe4ffd91cb"`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" DROP CONSTRAINT "UQ_01f084747f86160edbe4ffd91cb"`
    )
    await queryRunner.query(`ALTER TABLE "approval" DROP COLUMN "commentId"`)
  }
}
