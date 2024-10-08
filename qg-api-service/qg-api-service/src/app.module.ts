import { KeyCloakStrategy } from '@B-S-F/api-keycloak-auth-lib'
import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR, RouterModule } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { createWriteStream } from 'fs'
import { LoggerModule } from 'nestjs-pino'
import {
  DATA_DIR,
  DB_HOST,
  DB_MIGRATIONS_RUN,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_TYPE,
  DB_USERNAME,
  DB_USE_SSL,
  QG_LOG_LEVEL,
} from './config'
import { databaseConfig } from './database/database-config'
import { CoreAuthGuard } from './guards/auth.guard'
import { KeyCloakAuthGuard } from './guards/keycloak-auth.guard'
import { RolesGuard } from './guards/roles.guard'
import { LocalKeyCloakModule } from './keycloak/local.keycloak.module'
import { NamespaceModule } from './namespace/namespace.module'
import { PinoLoggingInterceptor } from './pino-logging-interceptor'
import { ServiceModule } from './service/service.module'
import { LongRunningTokenStrategy } from './user/long-running-token/long.running.strategy'
import { LongRunningTokenModule } from './user/long-running-token/long.running.token.module'
import { UserProfileModule } from './user/user-profile/user-profile.module'

export class MultiStream {
  streams: NodeJS.WritableStream[]

  constructor(streams: NodeJS.WritableStream[]) {
    this.streams = streams
  }

  write(data: any) {
    this.streams.forEach((stream) => stream.write(data))
  }
}

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: [
        {
          stream: new MultiStream([
            process.stdout,
            createWriteStream('debug.log'),
          ]),
          level: QG_LOG_LEVEL,
          serializers: {
            req: () => undefined,
            res: () => undefined,
          },
        },
        null,
      ],
    }),
    NamespaceModule,
    UserProfileModule,
    ServiceModule,
    RouterModule.register([
      { path: 'namespaces', module: NamespaceModule },
      { path: 'service', module: ServiceModule },
    ]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(
      databaseConfig(
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
    ),
    LocalKeyCloakModule,
    LongRunningTokenModule,
  ],
  controllers: [],
  providers: [
    KeyCloakStrategy,
    LongRunningTokenStrategy,
    KeyCloakAuthGuard,
    CoreAuthGuard,
    {
      provide: APP_GUARD,
      useClass: CoreAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PinoLoggingInterceptor,
    },
  ],
})
export class AppModule {}
