import {
  KeyCloakConfig,
  KeyCloakService,
} from '@B-S-F/api-keycloak-auth-lib'
import { Module } from '@nestjs/common'
import { LoggerModule } from 'nestjs-pino'
import {
  KEYCLOAK_ADMIN_URL,
  KEYCLOAK_AUTH,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_ENABLE_PROXY_TUNNEL,
  KEYCLOAK_REALM,
  KEYCLOAK_SERVER,
  KEYCLOAK_WELL_KNOWN_CONFIG,
} from '../config'

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
    {
      provide: KeyCloakConfig,
      useValue: new KeyCloakConfig(
        KEYCLOAK_SERVER.trim(),
        KEYCLOAK_REALM.trim(),
        KEYCLOAK_AUTH.trim(),
        KEYCLOAK_CLIENT_ID.trim(),
        KEYCLOAK_CLIENT_SECRET.trim(),
        KEYCLOAK_ADMIN_URL.trim(),
        KEYCLOAK_WELL_KNOWN_CONFIG.trim(),
        KEYCLOAK_ENABLE_PROXY_TUNNEL.trim() === 'true'
      ),
    },
    KeyCloakService,
  ],
  exports: [KeyCloakService],
})
export class LocalKeyCloakModule {}
