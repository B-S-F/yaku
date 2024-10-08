import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1716830875600 implements MigrationInterface {
  name = 'Database1716830875600'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."long_running_token_status_enum" AS ENUM('active', 'revoked')`
    )
    await queryRunner.query(
      `CREATE TABLE "long_running_token" ("id" SERIAL NOT NULL, "description" character varying NOT NULL, "kcuid" character varying NOT NULL, "try_admin" boolean NOT NULL, "hash" character varying NOT NULL, "status" "public"."long_running_token_status_enum" NOT NULL, "createdBy" character varying NOT NULL, "lastModifiedBy" character varying NOT NULL, "creationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "lastModificationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "lastUsed" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '"1970-01-01T00:00:00.000Z"', CONSTRAINT "PK_bc1bd37ca1a498a71eeb96e32ed" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."long_running_token_audit_action_enum" AS ENUM('create', 'update')`
    )
    await queryRunner.query(
      `CREATE TABLE "long_running_token_audit" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "original" jsonb NOT NULL, "modified" jsonb NOT NULL, "actor" character varying NOT NULL, "modificationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "action" "public"."long_running_token_audit_action_enum" NOT NULL, CONSTRAINT "PK_d0ca3d7637148773e4f4b0b7a3a" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "long_running_token_audit"`)
    await queryRunner.query(
      `DROP TYPE "public"."long_running_token_audit_action_enum"`
    )
    await queryRunner.query(`DROP TABLE "long_running_token"`)
    await queryRunner.query(
      `DROP TYPE "public"."long_running_token_status_enum"`
    )
  }
}
