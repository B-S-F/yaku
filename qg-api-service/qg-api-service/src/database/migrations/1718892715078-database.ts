import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1718892715078 implements MigrationInterface {
  name = 'Database1718892715078'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."override_manualcolor_enum" AS ENUM('GREEN', 'YELLOW', 'RED')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."override_originalcolor_enum" AS ENUM('GREEN', 'YELLOW', 'RED')`
    )
    await queryRunner.query(
      `CREATE TABLE "override" ("id" SERIAL NOT NULL, "manualColor" "public"."override_manualcolor_enum" NOT NULL, "originalColor" "public"."override_originalcolor_enum" NOT NULL, "chapter" character varying NOT NULL, "requirement" character varying NOT NULL, "check" character varying NOT NULL, "createdBy" character varying NOT NULL, "lastModifiedBy" character varying NOT NULL, "creationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "lastModificationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "namespaceId" integer, "releaseId" integer, "commentId" integer, CONSTRAINT "same_check_may_not_overridden_multiple_times" UNIQUE ("namespaceId", "releaseId", "chapter", "requirement", "check"), CONSTRAINT "REL_f021adb083c8d4e61a2054908e" UNIQUE ("commentId"), CONSTRAINT "PK_f82b1456ee562709b0ad006ab74" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f82b1456ee562709b0ad006ab7" ON "override" ("id") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."override_audit_action_enum" AS ENUM('create', 'update', 'delete')`
    )
    await queryRunner.query(
      `CREATE TABLE "override_audit" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "original" jsonb NOT NULL, "modified" jsonb NOT NULL, "actor" jsonb NOT NULL, "modificationTime" TIMESTAMP NOT NULL, "action" "public"."override_audit_action_enum" NOT NULL, "namespaceId" integer, CONSTRAINT "PK_31d6834f19faf2097c7344b6c2c" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TYPE "public"."comment_referencetype_enum" RENAME TO "comment_referencetype_enum_old"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."comment_referencetype_enum" AS ENUM('check', 'comment', 'release', 'approval', 'override')`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "referenceType" TYPE "public"."comment_referencetype_enum" USING "referenceType"::"text"::"public"."comment_referencetype_enum"`
    )
    await queryRunner.query(
      `DROP TYPE "public"."comment_referencetype_enum_old"`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ADD CONSTRAINT "FK_6f007050f334c99033801406444" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ADD CONSTRAINT "FK_ed8c2636c7e8eb4eb0c80d15d78" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ADD CONSTRAINT "FK_f021adb083c8d4e61a2054908e3" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "override_audit" ADD CONSTRAINT "FK_e206ad8d729c5dd0b679d8f290c" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "override_audit" DROP CONSTRAINT "FK_e206ad8d729c5dd0b679d8f290c"`
    )
    await queryRunner.query(
      `ALTER TABLE "override" DROP CONSTRAINT "FK_f021adb083c8d4e61a2054908e3"`
    )
    await queryRunner.query(
      `ALTER TABLE "override" DROP CONSTRAINT "FK_ed8c2636c7e8eb4eb0c80d15d78"`
    )
    await queryRunner.query(
      `ALTER TABLE "override" DROP CONSTRAINT "FK_6f007050f334c99033801406444"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."comment_referencetype_enum_old" AS ENUM('check', 'comment', 'release', 'approval')`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "referenceType" TYPE "public"."comment_referencetype_enum_old" USING "referenceType"::"text"::"public"."comment_referencetype_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."comment_referencetype_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."comment_referencetype_enum_old" RENAME TO "comment_referencetype_enum"`
    )
    await queryRunner.query(`DROP TABLE "override_audit"`)
    await queryRunner.query(`DROP TYPE "public"."override_audit_action_enum"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f82b1456ee562709b0ad006ab7"`
    )
    await queryRunner.query(`DROP TABLE "override"`)
    await queryRunner.query(`DROP TYPE "public"."override_originalcolor_enum"`)
    await queryRunner.query(`DROP TYPE "public"."override_manualcolor_enum"`)
  }
}
