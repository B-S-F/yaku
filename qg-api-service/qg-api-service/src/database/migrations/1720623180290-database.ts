import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1720623180290 implements MigrationInterface {
  name = 'Database1720623180290'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "editor"`)
    await queryRunner.query(
      `CREATE TYPE "public"."user_profile_editor_enum" AS ENUM('visual', 'code')`
    )
    await queryRunner.query(
      `ALTER TABLE "user_profile" ADD "editor" "public"."user_profile_editor_enum" NOT NULL DEFAULT 'visual'`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "editor"`)
    await queryRunner.query(`DROP TYPE "public"."user_profile_editor_enum"`)
    await queryRunner.query(
      `ALTER TABLE "user_profile" ADD "editor" character varying NOT NULL DEFAULT 'visual'`
    )
  }
}
