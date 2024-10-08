import { TypeOrmModule } from '@nestjs/typeorm'
import { LongRunningTokenController } from './long.running.token.controller'
import {
  LongRunningTokenAuditEntity,
  LongRunningTokenAuditService,
  LongRunningTokenEntity,
} from './long.running.token.entity'
import { Module } from '@nestjs/common'
import { LocalKeyCloakModule } from '../../keycloak/local.keycloak.module'
import { LongRunningTokenService } from './long.running.token.service'
import { SERVICE_PROTOCOL } from '../../config'
import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { AuthCache, AuthCacheConfig } from './long.running.token.cache'
import { LongRunningTokenAuthGuard } from './long.running.token.auth.guard'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LongRunningTokenEntity,
      LongRunningTokenAuditEntity,
    ]),
    LocalKeyCloakModule,
  ],
  controllers: [LongRunningTokenController],
  providers: [
    LongRunningTokenAuthGuard,
    AuthCacheConfig,
    AuthCache,
    LongRunningTokenAuditService,
    LongRunningTokenService,
    UrlHandlerFactory,
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
  ],
  exports: [LongRunningTokenService, AuthCache, LongRunningTokenAuthGuard],
})
export class LongRunningTokenModule {}
