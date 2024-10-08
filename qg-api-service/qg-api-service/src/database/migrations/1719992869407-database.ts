import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1719992869407 implements MigrationInterface {
  name = 'Database1719992869407'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."override_manualcolor_enum" RENAME TO "override_manualcolor_enum_old"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."override_manualcolor_enum" AS ENUM('GREEN', 'YELLOW', 'RED', 'ERROR', 'FAILED', 'UNANSWERED', 'NA', 'PENDING')`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "manualColor" TYPE "public"."override_manualcolor_enum" USING "manualColor"::"text"::"public"."override_manualcolor_enum"`
    )
    await queryRunner.query(
      `DROP TYPE "public"."override_manualcolor_enum_old"`
    )
    await queryRunner.query(
      `ALTER TYPE "public"."override_originalcolor_enum" RENAME TO "override_originalcolor_enum_old"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."override_originalcolor_enum" AS ENUM('GREEN', 'YELLOW', 'RED', 'ERROR', 'FAILED', 'UNANSWERED', 'NA', 'PENDING')`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "originalColor" TYPE "public"."override_originalcolor_enum" USING "originalColor"::"text"::"public"."override_originalcolor_enum"`
    )
    await queryRunner.query(
      `DROP TYPE "public"."override_originalcolor_enum_old"`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."override_originalcolor_enum_old" AS ENUM('GREEN', 'YELLOW', 'RED')`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "originalColor" TYPE "public"."override_originalcolor_enum_old" USING "originalColor"::"text"::"public"."override_originalcolor_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."override_originalcolor_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."override_originalcolor_enum_old" RENAME TO "override_originalcolor_enum"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."override_manualcolor_enum_old" AS ENUM('GREEN', 'YELLOW', 'RED')`
    )
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "manualColor" TYPE "public"."override_manualcolor_enum_old" USING "manualColor"::"text"::"public"."override_manualcolor_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."override_manualcolor_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."override_manualcolor_enum_old" RENAME TO "override_manualcolor_enum"`
    )
  }
}
