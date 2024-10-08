import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1721378057136 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rate_limit" DROP CONSTRAINT "FK_7e9ca7a1a2b451e5c761d09fcf9"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fcdc27fab70557a147185fd3f0"`
    )
    await queryRunner.query(`DROP TABLE "rate_limit"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rate_limit" ("id" SERIAL NOT NULL, "entity" character varying NOT NULL, "method" character varying NOT NULL, "limit" integer, "namespaceId" integer, CONSTRAINT "PK_51ea620fc09d92f5dc3cdc46a70" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fcdc27fab70557a147185fd3f0" ON "rate_limit" ("namespaceId", "entity", "method") `
    )
    await queryRunner.query(
      `ALTER TABLE "rate_limit" ADD CONSTRAINT "FK_7e9ca7a1a2b451e5c761d09fcf9" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }
}
