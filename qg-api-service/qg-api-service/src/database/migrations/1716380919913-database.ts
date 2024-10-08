import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1716380919913 implements MigrationInterface {
  name = 'Database1716380919913'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."comment_referencetype_enum" RENAME TO "comment_referencetype_enum_old"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."comment_referencetype_enum" AS ENUM('check', 'comment', 'release', 'approval')`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "referenceType" TYPE "public"."comment_referencetype_enum" USING "referenceType"::"text"::"public"."comment_referencetype_enum"`
    )
    await queryRunner.query(
      `DROP TYPE "public"."comment_referencetype_enum_old"`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."comment_referencetype_enum_old" AS ENUM('check', 'comment', 'release')`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ALTER COLUMN "referenceType" TYPE "public"."comment_referencetype_enum_old" USING "referenceType"::"text"::"public"."comment_referencetype_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."comment_referencetype_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."comment_referencetype_enum_old" RENAME TO "comment_referencetype_enum"`
    )
  }
}
