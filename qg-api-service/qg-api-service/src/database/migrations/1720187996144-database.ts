import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1720187996144 implements MigrationInterface {
  name = 'Database1720187996144'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_profile" ("id" character varying NOT NULL, "emailNotifications" boolean NOT NULL DEFAULT true, "editor" character varying NOT NULL DEFAULT 'visual', CONSTRAINT "PK_f44d0cd18cfd80b0fed7806c3b7" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_profile"`)
  }
}
