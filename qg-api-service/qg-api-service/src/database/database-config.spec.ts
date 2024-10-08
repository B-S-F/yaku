import * as path from 'path'
import { databaseConfig } from './database-config'
import { TypeOrmToNestLogger } from './typeorm-logger'

describe('Db Config', () => {
  const dbPostgresType = 'postgres'
  const dbSqliteType = 'sqlite'
  const dbMariaDBType = 'mariadb'
  const dbHost = 'localdev.me'
  const dbPort = '5432'
  const dbUsername = 'yakuuser'
  const dbPassword = 'password'
  const dbName = 'yaku'
  const dbMigrationsRun = 'false'
  const testFolder = '/tmp'
  const sqliteFilename = 'qg-aas-api.sqlite'

  it('should create a proper postgres config', () => {
    const config = databaseConfig(
      dbPostgresType,
      dbHost,
      dbPort,
      dbUsername,
      dbPassword,
      dbName,
      'true',
      dbMigrationsRun,
      testFolder
    ) as any

    expect(config.type).toBe(dbPostgresType)
    expect(config.host).toBe(dbHost)
    expect(config.port).toBe(parseInt(dbPort))
    expect(config.username).toBe(dbUsername)
    expect(config.password).toBe(dbPassword)
    expect(config.database).toBe(dbName)
    expect(config.ssl).toBeTruthy()
    expect(config.synchronize).toBeFalsy()
    expect(config.autoLoadEntities).toBeTruthy()
    expect(config.logging).toBeTruthy()
    expect(config.logNotification).toBeTruthy()
    expect(config.maxQueryExecutionTime).toBe(300)
    expect(config.logger).toBeInstanceOf(TypeOrmToNestLogger)
    expect(config.migrationsRun).toBeFalsy()
  })

  it('should create a proper postgres config without ssl', () => {
    const config = databaseConfig(
      dbPostgresType,
      dbHost,
      dbPort,
      dbUsername,
      dbPassword,
      dbName,
      'false',
      dbMigrationsRun,
      testFolder
    ) as any

    expect(config.type).toBe(dbPostgresType)
    expect(config.host).toBe(dbHost)
    expect(config.port).toBe(parseInt(dbPort))
    expect(config.username).toBe(dbUsername)
    expect(config.password).toBe(dbPassword)
    expect(config.database).toBe(dbName)
    expect(config.ssl).toBeFalsy()
    expect(config.synchronize).toBeFalsy()
    expect(config.autoLoadEntities).toBeTruthy()
    expect(config.logging).toBeTruthy()
    expect(config.logNotification).toBeTruthy()
    expect(config.maxQueryExecutionTime).toBe(300)
    expect(config.logger).toBeInstanceOf(TypeOrmToNestLogger)
    expect(config.migrationsRun).toBeFalsy()
  })

  it('should create a proper sqlite config', () => {
    const config = databaseConfig(
      dbSqliteType,
      dbHost,
      dbPort,
      dbUsername,
      dbPassword,
      dbName,
      'false',
      dbMigrationsRun,
      testFolder
    )

    expect(config.type).toBe(dbSqliteType)
    expect(config.database).toBe(path.join(testFolder, sqliteFilename))
    expect(config.synchronize).toBeTruthy()
    expect(config.autoLoadEntities).toBeTruthy()
    expect(config.logging).toBeTruthy()
    expect(config.logNotification).toBeTruthy()
    expect(config.maxQueryExecutionTime).toBe(300)
    expect(config.logger).toBeInstanceOf(TypeOrmToNestLogger)
    expect(config.migrationsRun).toBeFalsy()
  })

  it('should throw an error if database type is not supported', () => {
    expect(() =>
      databaseConfig(
        dbMariaDBType,
        dbHost,
        dbPort,
        dbUsername,
        dbPassword,
        dbName,
        'false',
        dbMigrationsRun,
        testFolder
      )
    ).toThrow()
  })
})
