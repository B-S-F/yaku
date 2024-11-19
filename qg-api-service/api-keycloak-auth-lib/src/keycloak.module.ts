import { Module } from '@nestjs/common'
import { KeyCloakConfig, KeyCloakService } from './keycloak.service'
import { LoggerModule } from 'nestjs-pino'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: [
        {
          level: 'debug',
          serializers: {
            req: () => undefined,
            res: () => undefined,
          },
        },
        null,
      ],
    }),
  ],
  providers: [
    KeyCloakConfig,
    {
      provide: KeyCloakConfig,
      useFactory: () =>
        new KeyCloakConfig(
          process.env.KEYCLOAK_SERVER.trim(),
          process.env.KEYCLOAK_REALM.trim(),
          process.env.KEYCLOAK_AUTH.trim(),
          process.env.KEYCLOAK_CLIENT_ID.trim(),
          process.env.KEYCLOAK_CLIENT_SECRET.trim(),
          process.env.KEYCLOAK_ADMIN_URL.trim(),
          process.env.KEYCLOAK_WELL_KNOWN_CONFIG.trim(),
        ),
    },
    KeyCloakService,
  ],
  exports: [KeyCloakService],
})
export class KeyCloakModule {}
