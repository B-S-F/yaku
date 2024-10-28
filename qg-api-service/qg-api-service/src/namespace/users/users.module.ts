import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { Module } from '@nestjs/common'
import { SERVICE_PROTOCOL } from '../../config'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { LocalKeyCloakModule } from '../../keycloak/local.keycloak.module'
import { UsersCache, UsersCacheConfig } from './users.cache'

@Module({
  imports: [LocalKeyCloakModule],
  controllers: [UsersController],
  providers: [
    UrlHandlerFactory,
    UsersService,
    UsersCacheConfig,
    UsersCache,
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
