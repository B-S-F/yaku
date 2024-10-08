import { PinoLogger, Logger, InjectPinoLogger } from 'nestjs-pino'
import { QG_LOG_LEVEL } from '../config'
import { QueryRunner, Logger as TypeOrmLogger } from 'typeorm'

export class TypeOrmToNestLogger implements TypeOrmLogger {
  @InjectPinoLogger('TypeORM')
  private readonly logger = new Logger(
    new PinoLogger({
      pinoHttp: {
        level: QG_LOG_LEVEL,
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    {}
  )

  private logQueries = false

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    if (this.logQueries) {
      this.logger.debug({
        msg: `Executing ${this.createQueryString(query, parameters)}`,
      })
    }
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner
  ) {
    this.logger.warn({
      msg: `Query failed executing DB operation for ${this.createQueryString(
        query,
        parameters
      )} with error information ${error}`,
    })
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner
  ) {
    this.logger.log({
      msg: `Long running query: Took ${time}ms for ${this.createQueryString(
        query,
        parameters
      )}`,
    })
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.debug({
      msg: `Schema build with message ${message}`,
    })
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.debug({
      msg: `Data migration with message ${message}`,
    })
  }

  log(level: 'log' | 'warn' | 'info', message: any, queryRunner?: QueryRunner) {
    if (level === 'warn') {
      this.logger.warn({ msg: message })
    } else {
      this.logger.log({ msg: message })
    }
  }

  private createQueryString(query: string, parameters: any[]): string {
    return `query ${query} with parameters ${
      parameters ? parameters.toString() : '[]'
    }`
  }
}
