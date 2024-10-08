import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import * as path from 'path'
import { TypeOrmToNestLogger } from './typeorm-logger'

export function databaseConfig(
  type: string,
  host: string,
  port: string,
  username: string,
  password: string,
  database: string,
  useSSL: string,
  migrationsRun: string,
  dataFolder: string
): DatabaseConfig {
  switch (type) {
    case 'postgres':
      return {
        type,
        ...hostData(host, port, database, username, password),
        synchronize: false,
        autoLoadEntities: true,
        ssl: useSSL === 'true',
        logging: true,
        logNotification: true,
        logger: new TypeOrmToNestLogger(),
        maxQueryExecutionTime: 300,
        migrationsRun: migrationsRun.toLowerCase() === 'true',
        migrationsTableName: 'history',
        migrations: ['dist/**/migrations/*.js'],
        entities: ['dist/**/!(mocks)/*.entity.js'],
      }
    case 'sqlite':
      return {
        type,
        database: path.join(dataFolder, 'qg-aas-api.sqlite'),
        synchronize: true,
        autoLoadEntities: true,
        logging: true,
        logNotification: true,
        logger: new TypeOrmToNestLogger(),
        maxQueryExecutionTime: 300,
      }
    default:
      throw new Error(`Database ${type} not supported`)
  }
}

export type DatabaseConfig = TypeOrmModuleOptions & {
  logger: any
  logNotification: boolean
} & Partial<hostinfo & { ssl: boolean }>

type hostinfo = {
  host: string
  port: number
  database: string
  username: string
  password: string
}

function hostData(
  host: string,
  port: string,
  database: string,
  username: string,
  password: string
): hostinfo {
  return {
    host,
    port: parseInt(port),
    database,
    username: username.trim(),
    password: password.trim(),
  }
}
