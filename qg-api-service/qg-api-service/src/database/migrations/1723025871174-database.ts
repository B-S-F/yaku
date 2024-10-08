import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1723025871174 implements MigrationInterface {
  name = 'Database1723025871174'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."task_reminder_enum" AS ENUM('disabled', 'overdue', 'always')`
    )
    await queryRunner.query(
      `CREATE TABLE "task" ("id" SERIAL NOT NULL, "dueDate" TIMESTAMP WITH TIME ZONE, "reminder" "public"."task_reminder_enum" NOT NULL DEFAULT 'disabled', "description" character varying NOT NULL, "createdBy" character varying NOT NULL, "lastModifiedBy" character varying NOT NULL, "creationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "lastModificationTime" TIMESTAMP WITH TIME ZONE NOT NULL, "closed" boolean NOT NULL DEFAULT false, "assignees" text array, "namespaceId" integer, "releaseId" integer, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fb213f79ee45060ba925ecd576" ON "task" ("id") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."task_audit_action_enum" AS ENUM('create', 'update', 'delete')`
    )
    await queryRunner.query(
      `CREATE TABLE "task_audit" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "original" jsonb NOT NULL, "modified" jsonb NOT NULL, "actor" jsonb NOT NULL, "modificationTime" TIMESTAMP NOT NULL, "action" "public"."task_audit_action_enum" NOT NULL, "namespaceId" integer, CONSTRAINT "PK_0b918f13b4502a40a57d4d73429" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_cda5589e024944bb6652b019d67" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_36a561a34b87f402301f119afbb" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "task_audit" ADD CONSTRAINT "FK_8b1239f0763e6d73725585455b1" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_audit" DROP CONSTRAINT "FK_8b1239f0763e6d73725585455b1"`
    )
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "FK_36a561a34b87f402301f119afbb"`
    )
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "FK_cda5589e024944bb6652b019d67"`
    )
    await queryRunner.query(`DROP TABLE "task_audit"`)
    await queryRunner.query(`DROP TYPE "public"."task_audit_action_enum"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fb213f79ee45060ba925ecd576"`
    )
    await queryRunner.query(`DROP TABLE "task"`)
    await queryRunner.query(`DROP TYPE "public"."task_reminder_enum"`)
  }
}
