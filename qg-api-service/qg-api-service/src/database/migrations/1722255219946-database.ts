import { MigrationInterface, QueryRunner } from 'typeorm'

export class Database1722255219946 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const timestamp = new Date().toISOString()
    const releaseType = 'release',
      checkType = 'check',
      commentType = 'comment'
    const releaseRows = await queryRunner.query(
      `UPDATE comment SET "referenceType" = '${releaseType}', "lastModifiedBy" = 'SYSTEM_ACTOR', "lastModificationTime" = '${timestamp}'  WHERE "referenceType" IS NULL AND "reference" IS NULL AND "parentId" IS NULL returning *`
    )
    const checkRows = await queryRunner.query(
      `UPDATE comment SET "referenceType" = '${checkType}', "lastModifiedBy" = 'SYSTEM_ACTOR', "lastModificationTime" = '${timestamp}' WHERE "referenceType" IS NULL AND "reference" IS NOT NULL returning *`
    )
    const commentRows = await queryRunner.query(
      `UPDATE comment SET "referenceType" = '${commentType}', "lastModifiedBy" = 'SYSTEM_ACTOR', "lastModificationTime" = '${timestamp}' WHERE "referenceType" IS NULL AND "parentId" IS NOT NULL returning *`
    )
    await queryRunner.query(
      `ALTER TABLE comment ALTER COLUMN "referenceType" SET NOT NULL`
    )
    const audits = [
      {
        rows: commentRows[0],
        ct: commentType,
      },
      {
        rows: checkRows[0],
        ct: checkType,
      },
      {
        rows: releaseRows[0],
        ct: releaseType,
      },
    ]
    for (const { rows, ct } of audits) {
      for (const row of rows) {
        const auditRows = await queryRunner.query(
          `SELECT * FROM comment_audit WHERE "entityId" = ${row.id} ORDER BY "modificationTime" DESC LIMIT 1`
        )
        if (auditRows.length !== 1)
          throw new Error('expected exactly 1 audit row')
        const auditRow = auditRows[0]
        const original = JSON.stringify(auditRow.modified).replace(/'/g, "''") // NOTE: escape single quotes in some comments
        const namespaceId = auditRow.modified.namespace.id
        let modified = auditRow.modified
        modified.lastModificationTime = timestamp
        modified.lastModifiedBy = 'SYSTEM_ACTOR'
        modified.referenceType = ct
        modified = JSON.stringify(modified).replace(/'/g, "''") // NOTE: escape single quotes in some comments
        await queryRunner.query(
          `INSERT INTO comment_audit("entityId", "original", "modified", "modificationTime", "action", "namespaceId", "actor") VALUES(${
            row.id
          }, '${original}', '${modified}', '${timestamp}', 'update', ${namespaceId}, '${JSON.stringify(
            {
              id: 'SYSTEM_ACTOR',
              username: 'SYSTEM_ACTOR',
              displayName: 'SYSTEM_ACTOR',
            }
          )}')`
        )
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE comment ALTER COLUMN "referenceType" DROP NOT NULL`
    )
  }
}
