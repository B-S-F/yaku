import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1723811410176 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            CREATE TABLE "temp_audit" as (SELECT * FROM "long_running_token_audit");
            ALTER TABLE "long_running_token_audit" DROP COLUMN "actor";
            ALTER TABLE "long_running_token_audit" ADD "actor" jsonb NOT NULL DEFAULT '{}'::jsonb;
            UPDATE "long_running_token_audit" SET "actor" = jsonb_build_object('username', "temp_audit"."actor") FROM "temp_audit" WHERE "long_running_token_audit"."id" = "temp_audit"."id";
            DROP TABLE "temp_audit";
            ALTER TABLE "long_running_token_audit" ALTER COLUMN "actor" DROP DEFAULT
            `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            CREATE TABLE "temp_audit" as (SELECT * FROM "long_running_token_audit");
            ALTER TABLE "long_running_token_audit" DROP COLUMN "actor";
            ALTER TABLE "long_running_token_audit" ADD "actor" character varying NOT NULL DEFAULT '';
            UPDATE "long_running_token_audit" SET "actor" = "temp_audit"."actor"->>'username' FROM "temp_audit" WHERE "long_running_token_audit"."id" = "temp_audit"."id";
            DROP TABLE "temp_audit";
            ALTER TABLE "long_running_token_audit" ALTER COLUMN "actor" DROP DEFAULT
            `
    )
  }
}
