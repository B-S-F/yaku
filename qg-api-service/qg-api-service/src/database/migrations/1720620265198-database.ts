import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1720620265198 implements MigrationInterface {
  name = 'Database1720620265198'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("userId" character varying NOT NULL, "releaseId" integer NOT NULL, "creationTime" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d2bcb22c0519869229c3617d017" PRIMARY KEY ("userId", "releaseId"))`
    )
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_ed7fc37f6fc8cbca098f8395ca7" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_ed7fc37f6fc8cbca098f8395ca7"`
    )
    await queryRunner.query(`DROP TABLE "subscriptions"`)
  }
}
