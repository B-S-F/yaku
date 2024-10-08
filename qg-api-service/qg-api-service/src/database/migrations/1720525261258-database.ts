import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1720525261258 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "namespace_users_user"`)
    await queryRunner.query(`DROP TABLE "api_token_metadata"`)
    await queryRunner.query(`DROP TABLE "user"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "roles" character varying NOT NULL DEFAULT 'user', CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("username") `
    )

    await queryRunner.query(
      `CREATE TABLE "api_token_metadata" ("id" SERIAL NOT NULL, "tokenId" character varying NOT NULL, "userId" integer, CONSTRAINT "PK_934db966aea226a6e52b351dcc1" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "api_token_metadata" ADD CONSTRAINT "FK_04459b7994e913f5d5dd171f2ec" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )

    await queryRunner.query(
      `CREATE TABLE "namespace_users_user" ("namespaceId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_aa38632aaf759f8d59daa8a9370" PRIMARY KEY ("namespaceId", "userId"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_989584f54fd886f3cbd357f1ac" ON "namespace_users_user" ("namespaceId") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9badd2dcfaca57dfd13ca9100e" ON "namespace_users_user" ("userId") `
    )
    await queryRunner.query(
      `ALTER TABLE "namespace_users_user" ADD CONSTRAINT "FK_989584f54fd886f3cbd357f1ac0" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE "namespace_users_user" ADD CONSTRAINT "FK_9badd2dcfaca57dfd13ca9100ec" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    )
  }
}
