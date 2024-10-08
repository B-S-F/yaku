import { MigrationInterface, QueryRunner } from 'typeorm'

export class preMigrationsSetup1716194960810 implements MigrationInterface {
  name = 'preMigrationsSetup1716194960810'
  schemaName = 'public'
  migrationsTableName = 'history'
  baselineTables = [
    'encrypted_secret',
    'findings',
    'metric',
    'namespace',
    'config_entity',
    'file_entity',
    'file_content_entity',
    'namespace_member_sequence',
    'rate_limit',
    'run',
    'run_audit',
    'secret',
    'user',
    'api_token_metadata',
    'namespace_users_user',
    'release',
    'release_audit',
    'approval',
    'approval_audit',
    'comment',
    'comment_audit',
  ]

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Running pre-migrations setup')

    if (process.env.IN_PRIVATE_CLOUD === 'true') {
      this.baselineTables.push('master_host')
    }

    // Check if all baseline-migration tables are present
    const existingTables = await this.getExistingTables(queryRunner)
    const [missingTables, extraTables] =
      this.getSymmetricDifference(existingTables)

    if (
      extraTables.length === 0 &&
      missingTables.length === this.baselineTables.length
    ) {
      // All baseline tables are missing, run baseline migration
      await this.upBaselineMigration(queryRunner)
      return
    } else if (missingTables.length === 0 && extraTables.length === 0) {
      // All baseline tables exist, no need to run baseline migration
      console.log(
        'All baseline migration tables are present, no need to run baseline migration'
      )
      return
    } else if (extraTables.length > 0) {
      throw new Error(
        `Extra tables present in database besides those mentioned in baseline migration tables: ${extraTables.join(
          ', '
        )}`
      )
    } else if (missingTables.length > 0) {
      throw new Error(
        `Some baseline migration tables are missing from the present database: ${missingTables.join(
          ', '
        )}`
      )
    }
    throw new Error(
      'Unknown error: Something went wrong while checking for baseline migration tables, we should not reach here!'
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Running pre-migrations setup down')
    await this.downBaselineMigration(queryRunner)
  }

  private async getExistingTables(queryRunner: QueryRunner): Promise<string[]> {
    return await queryRunner
      .query(
        `select table_name from information_schema.Tables where table_schema='${this.schemaName}';`
      )
      .then((res) =>
        res.map((table: { table_name: string }) => table.table_name)
      )
  }

  private getSymmetricDifference(
    existingTables: string[]
  ): [missingTables: string[], extraTables: string[]] {
    const missingTables: string[] = []
    const extraTables: string[] = []

    // We are getting the Symmetric Difference between the existing tables and the expected baseline tables
    // Check if there are any extra tables in the database
    existingTables.forEach((table: string) => {
      if (
        table != this.migrationsTableName &&
        !this.baselineTables.includes(table)
      ) {
        extraTables.push(table)
      }
      return true
    })
    // Check if there are any missing tables in the database
    this.baselineTables.forEach((table: string) => {
      if (!existingTables.includes(table)) {
        missingTables.push(table)
      }
      return true
    })

    return [missingTables, extraTables]
  }

  private async upBaselineMigration(queryRunner: QueryRunner) {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "roles" character varying NOT NULL DEFAULT 'user', CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("username") `
    )
    await queryRunner.query(
      `CREATE TABLE "namespace" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_155557f16b1d166388d7308086a" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_011e61f2ca9be1b10640bc4227" ON "namespace" ("name") `
    )
    await queryRunner.query(
      `CREATE TABLE "config_entity" ("globalId" SERIAL NOT NULL, "id" integer NOT NULL, "name" character varying NOT NULL, "description" character varying, "creationTime" TIMESTAMP NOT NULL, "lastModificationTime" TIMESTAMP NOT NULL, "namespaceId" integer, CONSTRAINT "PK_9188664fb90d610829e7c6da23c" PRIMARY KEY ("globalId"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5c8934a30d258fa13b01447418" ON "config_entity" ("namespaceId", "id") `
    )
    await queryRunner.query(
      `CREATE TABLE "file_entity" ("id" SERIAL NOT NULL, "filename" character varying NOT NULL, "configGlobalId" integer, CONSTRAINT "PK_d8375e0b2592310864d2b4974b2" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "file_content_entity" ("id" SERIAL NOT NULL, "content" character varying NOT NULL, "fileId" integer, CONSTRAINT "REL_1b603e1e2c41eb003c280fe49c" UNIQUE ("fileId"), CONSTRAINT "PK_1faf2a69391b0db54c34024d1e1" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "namespace_member_sequence" ("id" SERIAL NOT NULL, "entityName" character varying NOT NULL, "lastId" integer NOT NULL DEFAULT '0', "namespaceId" integer, CONSTRAINT "PK_19e8f7492ed6f8de38ba52ab8c2" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e07f2cbccc88f55c36d8ca1201" ON "namespace_member_sequence" ("namespaceId", "entityName") `
    )
    await queryRunner.query(
      `CREATE TABLE "rate_limit" ("id" SERIAL NOT NULL, "entity" character varying NOT NULL, "method" character varying NOT NULL, "limit" integer, "namespaceId" integer, CONSTRAINT "PK_51ea620fc09d92f5dc3cdc46a70" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fcdc27fab70557a147185fd3f0" ON "rate_limit" ("namespaceId", "entity", "method") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."release_approvalmode_enum" AS ENUM('one', 'all')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."release_approvalstate_enum" AS ENUM('approved', 'pending')`
    )
    await queryRunner.query(
      `CREATE TABLE "release" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "approvalMode" "public"."release_approvalmode_enum" NOT NULL, "createdBy" character varying NOT NULL, "lastModifiedBy" character varying NOT NULL, "plannedDate" TIMESTAMP NOT NULL, "creationTime" TIMESTAMP NOT NULL DEFAULT now(), "lastModificationTime" TIMESTAMP NOT NULL DEFAULT now(), "closed" boolean NOT NULL DEFAULT false, "approvalState" "public"."release_approvalstate_enum", "namespaceId" integer, "configGlobalId" integer NOT NULL, CONSTRAINT "PK_1a2253436964eea9c558f9464f4" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1a2253436964eea9c558f9464f" ON "release" ("id") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."release_audit_action_enum" AS ENUM('create', 'update', 'delete')`
    )
    await queryRunner.query(
      `CREATE TABLE "release_audit" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "original" jsonb NOT NULL, "modified" jsonb NOT NULL, "actor" character varying NOT NULL, "modificationTime" TIMESTAMP NOT NULL, "action" "public"."release_audit_action_enum" NOT NULL, "namespaceId" integer, CONSTRAINT "PK_1cee39b3f501ef7530825caf32e" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "run" ("globalId" SERIAL NOT NULL, "id" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "overallResult" character varying, "argoNamespace" character varying, "argoName" character varying, "argoId" character varying, "log" text, "creationTime" TIMESTAMP, "storagePath" character varying NOT NULL, "completionTime" TIMESTAMP, "namespaceId" integer, "configGlobalId" integer, CONSTRAINT "PK_1020f0fb56ff43bac93be187200" PRIMARY KEY ("globalId"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_026c02cd28544a428ad073ba3c" ON "run" ("namespaceId", "id") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."run_audit_action_enum" AS ENUM('create', 'update', 'delete')`
    )
    await queryRunner.query(
      `CREATE TABLE "run_audit" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "original" jsonb NOT NULL, "modified" jsonb NOT NULL, "actor" character varying NOT NULL, "modificationTime" TIMESTAMP NOT NULL, "action" "public"."run_audit_action_enum" NOT NULL, "namespaceId" integer, CONSTRAINT "PK_a4e55c3dce564c37094c19e8963" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "secret" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "creationTime" TIMESTAMP NOT NULL, "lastModificationTime" TIMESTAMP NOT NULL, "namespaceId" integer, CONSTRAINT "PK_6afa4961954e17ec2d6401afc3d" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_6511f55200fbcf6d4d74f95f32" ON "secret" ("namespaceId") `
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ff5543bdb2d7754d2f2c58765e" ON "secret" ("namespaceId", "name") `
    )
    await queryRunner.query(
      `CREATE TABLE "encrypted_secret" ("namespaceId" integer NOT NULL, "name" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "UQ_1a7b82aa2bc3c6de9c339ed1bd4" UNIQUE ("namespaceId", "name"), CONSTRAINT "PK_1a7b82aa2bc3c6de9c339ed1bd4" PRIMARY KEY ("namespaceId", "name"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_365fe3e2ac536cdec403b5da27" ON "encrypted_secret" ("namespaceId") `
    )
    await queryRunner.query(
      `CREATE TABLE "api_token_metadata" ("id" SERIAL NOT NULL, "tokenId" character varying NOT NULL, "userId" integer, CONSTRAINT "PK_934db966aea226a6e52b351dcc1" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."findings_runstatus_enum" AS ENUM('pending', 'running', 'completed', 'failed')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."findings_runoverallresult_enum" AS ENUM('RED', 'YELLOW', 'GREEN', 'UNANSWERED', 'FAILED', 'ERROR')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."findings_status_enum" AS ENUM('unresolved', 'resolved')`
    )
    await queryRunner.query(
      `CREATE TABLE "findings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uniqueIdHash" character varying(100) NOT NULL, "metadata" jsonb NOT NULL, "namespaceId" integer NOT NULL, "configId" integer NOT NULL, "runId" integer NOT NULL, "runStatus" "public"."findings_runstatus_enum" NOT NULL, "runOverallResult" "public"."findings_runoverallresult_enum" NOT NULL, "runCompletionTime" TIMESTAMP NOT NULL, "chapter" character varying(300) NOT NULL, "requirement" character varying(300) NOT NULL, "check" character varying(300) NOT NULL, "criterion" character varying(300) NOT NULL, "justification" character varying(3000) NOT NULL, "occurrenceCount" integer NOT NULL DEFAULT '1', "status" "public"."findings_status_enum" NOT NULL, "resolvedComment" text, "resolvedDate" TIMESTAMP, "resolver" character varying(100), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_01b3a29d97f2ab66da5cb963d48" UNIQUE ("uniqueIdHash"), CONSTRAINT "PK_ae9807d6293c23c13ff8804d09c" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."metric_service_enum" AS ENUM('findings-api', 'core-api')`
    )
    await queryRunner.query(
      `CREATE TABLE "metric" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "service" "public"."metric_service_enum" NOT NULL, "metric" jsonb NOT NULL, "creationTime" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d24c075ea2926dd32bd1c534ce" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."approval_approvalstate_enum" AS ENUM('approved', 'pending')`
    )
    await queryRunner.query(
      `CREATE TABLE "approval" ("id" SERIAL NOT NULL, "approver" character varying NOT NULL, "approvalState" "public"."approval_approvalstate_enum" NOT NULL, "createdBy" character varying NOT NULL, "lastModifiedBy" character varying NOT NULL, "creationTime" TIMESTAMP NOT NULL DEFAULT now(), "lastModificationTime" TIMESTAMP NOT NULL DEFAULT now(), "namespaceId" integer, "releaseId" integer, CONSTRAINT "same_person_may_not_be_an_approver_multiple_times" UNIQUE ("namespaceId", "releaseId", "approver"), CONSTRAINT "PK_97bfd1cd9dff3c1302229da6b5c" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97bfd1cd9dff3c1302229da6b5" ON "approval" ("id") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."approval_audit_action_enum" AS ENUM('create', 'update', 'delete')`
    )
    await queryRunner.query(
      `CREATE TABLE "approval_audit" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "original" jsonb NOT NULL, "modified" jsonb NOT NULL, "actor" character varying NOT NULL, "modificationTime" TIMESTAMP NOT NULL, "action" "public"."approval_audit_action_enum" NOT NULL, "namespaceId" integer, CONSTRAINT "PK_db3d8413c583a3415e0a63d5d46" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."comment_referencetype_enum" AS ENUM('check', 'comment', 'release')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."comment_status_enum" AS ENUM('created', 'resolved')`
    )
    await queryRunner.query(
      `CREATE TABLE "comment" ("id" SERIAL NOT NULL, "referenceType" "public"."comment_referencetype_enum", "content" character varying NOT NULL, "todo" boolean NOT NULL, "status" "public"."comment_status_enum" NOT NULL, "createdBy" character varying NOT NULL, "lastModifiedBy" character varying NOT NULL, "creationTime" TIMESTAMP NOT NULL, "lastModificationTime" TIMESTAMP NOT NULL, "reference" jsonb, "namespaceId" integer NOT NULL, "releaseId" integer NOT NULL, "parentId" integer, CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0b0e4bbc8415ec426f87f3a88e" ON "comment" ("id") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."comment_audit_action_enum" AS ENUM('create', 'update', 'delete')`
    )
    await queryRunner.query(
      `CREATE TABLE "comment_audit" ("id" SERIAL NOT NULL, "entityId" integer NOT NULL, "original" jsonb NOT NULL, "modified" jsonb NOT NULL, "actor" character varying NOT NULL, "modificationTime" TIMESTAMP NOT NULL, "action" "public"."comment_audit_action_enum" NOT NULL, "namespaceId" integer, CONSTRAINT "PK_b55ea6bf040a605be14af5495cd" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "namespace_users_user" ("namespaceId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_aa38632aaf759f8d59daa8a9370" PRIMARY KEY ("namespaceId", "userId"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_989584f54fd886f3cbd357f1ac" ON "namespace_users_user" ("namespaceId") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9badd2dcfaca57dfd13ca9100e" ON "namespace_users_user" ("userId") `
    )
    await queryRunner.query(
      `ALTER TABLE "config_entity" ADD CONSTRAINT "FK_8a42e0f3fd20cd82e721b70dd4c" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "file_entity" ADD CONSTRAINT "FK_8e988d605f5043b729c1d7ebd00" FOREIGN KEY ("configGlobalId") REFERENCES "config_entity"("globalId") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "file_content_entity" ADD CONSTRAINT "FK_1b603e1e2c41eb003c280fe49cf" FOREIGN KEY ("fileId") REFERENCES "file_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "namespace_member_sequence" ADD CONSTRAINT "FK_3fe73ca562a5e979e4f3c9522d2" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "rate_limit" ADD CONSTRAINT "FK_7e9ca7a1a2b451e5c761d09fcf9" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ADD CONSTRAINT "FK_150b110b484f2c487a575f81536" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "release" ADD CONSTRAINT "FK_30a4253d0d0478aabbb81dbceee" FOREIGN KEY ("configGlobalId") REFERENCES "config_entity"("globalId") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "release_audit" ADD CONSTRAINT "FK_79b9f54255f33b5cf22f5e76305" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "run" ADD CONSTRAINT "FK_a85d8eca36dc1959e4286425e43" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "run" ADD CONSTRAINT "FK_9f7007b19701fe63b0424c44716" FOREIGN KEY ("configGlobalId") REFERENCES "config_entity"("globalId") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "run_audit" ADD CONSTRAINT "FK_1b5f711f00349627e4f3e3f9605" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "secret" ADD CONSTRAINT "FK_6511f55200fbcf6d4d74f95f327" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "api_token_metadata" ADD CONSTRAINT "FK_04459b7994e913f5d5dd171f2ec" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "FK_895e9ed631d95799d4134e0b261" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "FK_0ea14e9d203c867e348892b1ed5" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "approval_audit" ADD CONSTRAINT "FK_0f00596641a73a86439b21a72cc" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "FK_3aae63761b147641511e1401957" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "FK_e592d086bf981c03d1fa9d0650b" FOREIGN KEY ("releaseId") REFERENCES "release"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "FK_e3aebe2bd1c53467a07109be596" FOREIGN KEY ("parentId") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "comment_audit" ADD CONSTRAINT "FK_e814e3f6ac91d648356dd637422" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "namespace_users_user" ADD CONSTRAINT "FK_989584f54fd886f3cbd357f1ac0" FOREIGN KEY ("namespaceId") REFERENCES "namespace"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE "namespace_users_user" ADD CONSTRAINT "FK_9badd2dcfaca57dfd13ca9100ec" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE "encrypted_secret" ADD CONSTRAINT "UQ_1a7b82aa2bc3c6de9c339ed1bd4" UNIQUE ("namespaceId", "name")`
    )
  }
  public async downBaselineMigration(queryRunner: QueryRunner): Promise<void> {
    //Down is disabled as a protection to not remove the whole initial DB
    console.log('Baseline migration down is disabled!!!')
    // await queryRunner.query(
    //   `ALTER TABLE "encrypted_secret" DROP CONSTRAINT "UQ_1a7b82aa2bc3c6de9c339ed1bd4"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "namespace_users_user" DROP CONSTRAINT "FK_9badd2dcfaca57dfd13ca9100ec"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "namespace_users_user" DROP CONSTRAINT "FK_989584f54fd886f3cbd357f1ac0"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "comment_audit" DROP CONSTRAINT "FK_e814e3f6ac91d648356dd637422"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "comment" DROP CONSTRAINT "FK_e3aebe2bd1c53467a07109be596"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "comment" DROP CONSTRAINT "FK_e592d086bf981c03d1fa9d0650b"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "comment" DROP CONSTRAINT "FK_3aae63761b147641511e1401957"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "approval_audit" DROP CONSTRAINT "FK_0f00596641a73a86439b21a72cc"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "approval" DROP CONSTRAINT "FK_0ea14e9d203c867e348892b1ed5"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "approval" DROP CONSTRAINT "FK_895e9ed631d95799d4134e0b261"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "api_token_metadata" DROP CONSTRAINT "FK_04459b7994e913f5d5dd171f2ec"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "secret" DROP CONSTRAINT "FK_6511f55200fbcf6d4d74f95f327"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "run_audit" DROP CONSTRAINT "FK_1b5f711f00349627e4f3e3f9605"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "run" DROP CONSTRAINT "FK_9f7007b19701fe63b0424c44716"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "run" DROP CONSTRAINT "FK_a85d8eca36dc1959e4286425e43"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "release_audit" DROP CONSTRAINT "FK_79b9f54255f33b5cf22f5e76305"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "release" DROP CONSTRAINT "FK_30a4253d0d0478aabbb81dbceee"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "release" DROP CONSTRAINT "FK_150b110b484f2c487a575f81536"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "rate_limit" DROP CONSTRAINT "FK_7e9ca7a1a2b451e5c761d09fcf9"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "namespace_member_sequence" DROP CONSTRAINT "FK_3fe73ca562a5e979e4f3c9522d2"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "file_content_entity" DROP CONSTRAINT "FK_1b603e1e2c41eb003c280fe49cf"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "file_entity" DROP CONSTRAINT "FK_8e988d605f5043b729c1d7ebd00"`
    // )
    // await queryRunner.query(
    //   `ALTER TABLE "config_entity" DROP CONSTRAINT "FK_8a42e0f3fd20cd82e721b70dd4c"`
    // )
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_9badd2dcfaca57dfd13ca9100e"`
    // )
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_989584f54fd886f3cbd357f1ac"`
    // )
    // await queryRunner.query(`DROP TABLE "namespace_users_user"`)
    // await queryRunner.query(`DROP TABLE "comment_audit"`)
    // await queryRunner.query(`DROP TYPE "public"."comment_audit_action_enum"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_0b0e4bbc8415ec426f87f3a88e"`
    // )
    // await queryRunner.query(`DROP TABLE "comment"`)
    // await queryRunner.query(`DROP TYPE "public"."comment_status_enum"`)
    // await queryRunner.query(`DROP TYPE "public"."comment_referencetype_enum"`)
    // await queryRunner.query(`DROP TABLE "approval_audit"`)
    // await queryRunner.query(`DROP TYPE "public"."approval_audit_action_enum"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_97bfd1cd9dff3c1302229da6b5"`
    // )
    // await queryRunner.query(`DROP TABLE "approval"`)
    // await queryRunner.query(`DROP TYPE "public"."approval_approvalstate_enum"`)
    // await queryRunner.query(`DROP TABLE "metric"`)
    // await queryRunner.query(`DROP TYPE "public"."metric_service_enum"`)
    // await queryRunner.query(`DROP TABLE "findings"`)
    // await queryRunner.query(`DROP TYPE "public"."findings_status_enum"`)
    // await queryRunner.query(
    //   `DROP TYPE "public"."findings_runoverallresult_enum"`
    // )
    // await queryRunner.query(`DROP TYPE "public"."findings_runstatus_enum"`)
    // await queryRunner.query(`DROP TABLE "api_token_metadata"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_365fe3e2ac536cdec403b5da27"`
    // )
    // await queryRunner.query(`DROP TABLE "encrypted_secret"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_ff5543bdb2d7754d2f2c58765e"`
    // )
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_6511f55200fbcf6d4d74f95f32"`
    // )
    // await queryRunner.query(`DROP TABLE "secret"`)
    // await queryRunner.query(`DROP TABLE "run_audit"`)
    // await queryRunner.query(`DROP TYPE "public"."run_audit_action_enum"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_026c02cd28544a428ad073ba3c"`
    // )
    // await queryRunner.query(`DROP TABLE "run"`)
    // await queryRunner.query(`DROP TABLE "release_audit"`)
    // await queryRunner.query(`DROP TYPE "public"."release_audit_action_enum"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_1a2253436964eea9c558f9464f"`
    // )
    // await queryRunner.query(`DROP TABLE "release"`)
    // await queryRunner.query(`DROP TYPE "public"."release_approvalstate_enum"`)
    // await queryRunner.query(`DROP TYPE "public"."release_approvalmode_enum"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_fcdc27fab70557a147185fd3f0"`
    // )
    // await queryRunner.query(`DROP TABLE "rate_limit"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_e07f2cbccc88f55c36d8ca1201"`
    // )
    // await queryRunner.query(`DROP TABLE "namespace_member_sequence"`)
    // await queryRunner.query(`DROP TABLE "file_content_entity"`)
    // await queryRunner.query(`DROP TABLE "file_entity"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_5c8934a30d258fa13b01447418"`
    // )
    // await queryRunner.query(`DROP TABLE "config_entity"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_011e61f2ca9be1b10640bc4227"`
    // )
    // await queryRunner.query(`DROP TABLE "namespace"`)
    // await queryRunner.query(
    //   `DROP INDEX "public"."IDX_78a916df40e02a9deb1c4b75ed"`
    // )
    // await queryRunner.query(`DROP TABLE "user"`)
  }
}
