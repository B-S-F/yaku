import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SERVICE_PROTOCOL } from '../../../../config'
import { UsersModule } from '../../../../namespace/users/users.module'
import { CheckResultOverridesController } from './check-result-override.controller'
import {
  CheckResultOverrideAuditEntity,
  CheckResultOverrideAuditService,
  CheckResultOverrideEntity,
} from './check-result-override.entity'
import { CheckResultOverridesService } from './check-result-override.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckResultOverrideEntity,
      CheckResultOverrideAuditEntity,
    ]),
    UsersModule,
  ],
  controllers: [CheckResultOverridesController],
  providers: [
    UrlHandlerFactory,
    CheckResultOverridesService,
    CheckResultOverrideAuditService,
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
  ],
  exports: [CheckResultOverridesService, CheckResultOverrideAuditService],
})
export class CheckResultOverridesModule {}
