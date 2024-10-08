import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1718888039825 implements MigrationInterface {
  name = 'Database1718888039825'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "release_audit" ALTER COLUMN "actor" DROP DEFAULT`
    )
    await queryRunner.query(
      `ALTER TABLE "run_audit" ALTER COLUMN "actor" DROP DEFAULT`
    )
    await queryRunner.query(
      `ALTER TABLE "comment_audit" ALTER COLUMN "actor" DROP DEFAULT`
    )
    await queryRunner.query(
      `ALTER TABLE "approval_audit" ALTER COLUMN "actor" DROP DEFAULT`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "approval_audit" ALTER COLUMN "actor" SET DEFAULT '{}'`
    )
    await queryRunner.query(
      `ALTER TABLE "comment_audit" ALTER COLUMN "actor" SET DEFAULT '{}'`
    )
    await queryRunner.query(
      `ALTER TABLE "run_audit" ALTER COLUMN "actor" SET DEFAULT '{}'`
    )
    await queryRunner.query(
      `ALTER TABLE "release_audit" ALTER COLUMN "actor" SET DEFAULT '{}'`
    )
  }
}
