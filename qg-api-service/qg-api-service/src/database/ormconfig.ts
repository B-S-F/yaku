import { DataSource } from 'typeorm'
import { DatabaseConfig, databaseConfig } from './database-config'
import {
  DATA_DIR,
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_TYPE,
  DB_USERNAME,
  DB_USE_SSL,
  DB_MIGRATIONS_RUN,
} from '../config'

// Adapts the custom database configuration to the TypeORM module options
const config: Omit<DatabaseConfig, 'type'> & { type?: any } = databaseConfig(
  DB_TYPE,
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  DB_USE_SSL,
  DB_MIGRATIONS_RUN,
  DATA_DIR
)
export const configSource = new DataSource({
  type: config.type,
  host: config.host,
  port: config.port,
  database: config.database,
  username: config.username,
  password: config.password,
  ssl: config.ssl,
  logging: config.logging,
  logger: config.logger,
  maxQueryExecutionTime: config.maxQueryExecutionTime,
  entities: config.entities as any,
  migrations: config.migrations,
  migrationsTableName: config.migrationsTableName,
  migrationsRun: config.migrationsRun,
  synchronize: config.synchronize,
})
