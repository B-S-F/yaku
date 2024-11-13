import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1728539762302 implements MigrationInterface {
  name = 'Database1728539762302'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "check_result_override" ("id" SERIAL NOT NULL, "manualFulfilled" boolean NOT NULL, "originalFulfilled" boolean NOT NULL, "chapter" character varying NOT NULL, "requirement" character varying NOT NULL, "check" character varying NOT NULL, "hash" character varying NOT NULL, "createdBy" character varying NOT NULL, "lastModifiedBy" character varying NOT NULL, "creationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "lastModificationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "comment" character varying NOT NULL, "namespaceId" integer, "releaseId" integer, CONSTRAINT "same_check_result_may_not_overridden_multiple_times" UNIQUE ("namespaceId", "releaseId", "chapter", "requirement", "check", "hash"), CONSTRAINT "PK_bd3416260e2d40fb2724dd28572" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bd3416260e2d40fb2724dd2857" ON "check_result_override" ("id") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."check_result_override_audit_action_enum" AS ENUM('create', 'update', 'delete')`
    )
    await queryRunner.query(
      `CREATE TABLE "check_result_override_audit" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "original" jsonb NOT NULL, "modified" jsonb NOT NULL, "actor" jsonb NOT NULL, "modificationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "action" "public"."check_result_override_audit_action_enum" NOT NULL, "namespaceId" integer, CONSTRAINT "PK_7474ce98112a3eb86095144ed5c" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "check_result_override" ADD CONSTRAINT "FK_2b5973badcd20363955e13584d2" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "check_result_override" ADD CONSTRAINT "FK_b8c479892e0ae9d383e8bbaf86b" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "check_result_override_audit" ADD CONSTRAINT "FK_2cd079eb9b747c1415d4c962b5b" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "check_result_override_audit" DROP CONSTRAINT "FK_2cd079eb9b747c1415d4c962b5b"`
    )
    await queryRunner.query(
      `ALTER TABLE "check_result_override" DROP CONSTRAINT "FK_b8c479892e0ae9d383e8bbaf86b"`
    )
    await queryRunner.query(
      `ALTER TABLE "check_result_override" DROP CONSTRAINT "FK_2b5973badcd20363955e13584d2"`
    )
    await queryRunner.query(`DROP TABLE "check_result_override_audit"`)
    await queryRunner.query(
      `DROP TYPE "public"."check_result_override_audit_action_enum"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd3416260e2d40fb2724dd2857"`
    )
    await queryRunner.query(`DROP TABLE "check_result_override"`)
  }
}
