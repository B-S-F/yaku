import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1720451637443 implements MigrationInterface {
  name = 'Database1720451637443'

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
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "comment" DROP DEFAULT`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "override" ALTER COLUMN "comment" SET DEFAULT 'no comment text available'`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."comment_referencetype_enum_old" AS ENUM('check', 'comment', 'release', 'approval', 'override')`
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
