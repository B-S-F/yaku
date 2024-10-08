import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1716961630324 implements MigrationInterface {
  name = 'Database1716961630324'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      CREATE TABLE "temp_audit" as (SELECT * FROM "run_audit");
      ALTER TABLE "run_audit" DROP COLUMN "actor";
      ALTER TABLE "run_audit" ADD "actor" jsonb NOT NULL DEFAULT '{}'::jsonb;
      UPDATE "run_audit" SET "actor" = jsonb_build_object('username', "temp_audit"."actor") FROM "temp_audit" WHERE "run_audit"."id" = "temp_audit"."id";
      DROP TABLE "temp_audit";
      `
    )

    await queryRunner.query(
      `
      CREATE TABLE "temp_audit" as (SELECT * FROM "release_audit");
      ALTER TABLE "release_audit" DROP COLUMN "actor";
      ALTER TABLE "release_audit" ADD "actor" jsonb NOT NULL DEFAULT '{}'::jsonb;
      UPDATE "release_audit" SET "actor" = jsonb_build_object('username', "temp_audit"."actor") FROM "temp_audit" WHERE "release_audit"."id" = "temp_audit"."id";
      DROP TABLE "temp_audit";
      `
    )

    await queryRunner.query(
      `
      CREATE TABLE "temp_audit" as (SELECT * FROM "comment_audit");
      ALTER TABLE "comment_audit" DROP COLUMN "actor";
      ALTER TABLE "comment_audit" ADD "actor" jsonb NOT NULL DEFAULT '{}'::jsonb;
      UPDATE "comment_audit" SET "actor" = jsonb_build_object('username', "temp_audit"."actor") FROM "temp_audit" WHERE "comment_audit"."id" = "temp_audit"."id";
      DROP TABLE "temp_audit";
      `
    )

    await queryRunner.query(
      `
      CREATE TABLE "temp_audit" as (SELECT * FROM "approval_audit");
      ALTER TABLE "approval_audit" DROP COLUMN "actor";
      ALTER TABLE "approval_audit" ADD "actor" jsonb NOT NULL DEFAULT '{}'::jsonb;
      UPDATE "approval_audit" SET "actor" = jsonb_build_object('username', "temp_audit"."actor") FROM "temp_audit" WHERE "approval_audit"."id" = "temp_audit"."id";
      DROP TABLE "temp_audit";
      `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      CREATE TABLE "temp_audit" as (SELECT * FROM "run_audit");
      ALTER TABLE "run_audit" DROP COLUMN "actor";
      ALTER TABLE "run_audit" ADD "actor" character varying NOT NULL DEFAULT '';
      UPDATE "run_audit" SET "actor" = "temp_audit"."actor"->>'username' FROM "temp_audit" WHERE "run_audit"."id" = "temp_audit"."id";
      DROP TABLE "temp_audit";
      `
    )

    await queryRunner.query(
      `
      CREATE TABLE "temp_audit" as (SELECT * FROM "release_audit");
      ALTER TABLE "release_audit" DROP COLUMN "actor";
      ALTER TABLE "release_audit" ADD "actor" character varying NOT NULL DEFAULT '';
      UPDATE "release_audit" SET "actor" = "temp_audit"."actor"->>'username' FROM "temp_audit" WHERE "release_audit"."id" = "temp_audit"."id";
      DROP TABLE "temp_audit";
      `
    )

    await queryRunner.query(
      `
      CREATE TABLE "temp_audit" as (SELECT * FROM "comment_audit");
      ALTER TABLE "comment_audit" DROP COLUMN "actor";
      ALTER TABLE "comment_audit" ADD "actor" character varying NOT NULL DEFAULT '';
      UPDATE "comment_audit" SET "actor" = "temp_audit"."actor"->>'username' FROM "temp_audit" WHERE "comment_audit"."id" = "temp_audit"."id";
      DROP TABLE "temp_audit";
      `
    )

    await queryRunner.query(
      `
      CREATE TABLE "temp_audit" as (SELECT * FROM "approval_audit");
      ALTER TABLE "approval_audit" DROP COLUMN "actor";
      ALTER TABLE "approval_audit" ADD "actor" character varying NOT NULL DEFAULT '';
      UPDATE "approval_audit" SET "actor" = "temp_audit"."actor"->>'username' FROM "temp_audit" WHERE "approval_audit"."id" = "temp_audit"."id";
      DROP TABLE "temp_audit";
      `
    )
  }
}
