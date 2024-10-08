import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1721817120959 implements MigrationInterface {
  name = 'Database1721817120959'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_ed7fc37f6fc8cbca098f8395ca7"`
    )
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_ed7fc37f6fc8cbca098f8395ca7" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_ed7fc37f6fc8cbca098f8395ca7"`
    )
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_ed7fc37f6fc8cbca098f8395ca7" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }
}
