import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1720011316035 implements MigrationInterface {
  name = 'Database1720011316035'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "override" DROP CONSTRAINT "FK_f021adb083c8d4e61a2054908e3"`
    )
    await queryRunner.query(
      `ALTER TABLE "override" RENAME COLUMN "commentId" TO "comment"`
    )
    await queryRunner.query(`ALTER TABLE "override" DROP COLUMN "comment"`)
    await queryRunner.query(
      `ALTER TABLE "override" ADD "comment" character varying NOT NULL DEFAULT 'no comment text available'`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "override" DROP COLUMN "comment"`)
    await queryRunner.query(`ALTER TABLE "override" ADD "comment" integer`)
    await queryRunner.query(
      `ALTER TABLE "override" RENAME COLUMN "comment" TO "commentId"`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ADD CONSTRAINT "FK_f021adb083c8d4e61a2054908e3" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }
}
