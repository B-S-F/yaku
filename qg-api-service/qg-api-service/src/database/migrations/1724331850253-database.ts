import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1724331850253 implements MigrationInterface {
  name = 'Database1724331850253'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "task_notification" ("id" SERIAL NOT NULL, "lastNotified" TIMESTAMP WITH TIME ZONE NOT NULL, "taskId" integer, CONSTRAINT "PK_1682db7744a913c67552814d0cc" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1682db7744a913c67552814d0c" ON "task_notification" ("id") `
    )
    await queryRunner.query(
      `ALTER TABLE "task_notification" ADD CONSTRAINT "FK_d6b7031cbc6690f8f8c7814b3c8" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_notification" DROP CONSTRAINT "FK_d6b7031cbc6690f8f8c7814b3c8"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1682db7744a913c67552814d0c"`
    )
    await queryRunner.query(`DROP TABLE "task_notification"`)
  }
}
