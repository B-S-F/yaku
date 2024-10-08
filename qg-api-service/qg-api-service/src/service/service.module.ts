import {
  OSSComplianceConfig,
  OSSComplianceService,
  OSSSourceController,
} from '@B-S-F/api-commons-lib'
import { Module } from '@nestjs/common'
import * as path from 'path'
import {
  IMAGE_VERSION,
  KEYCLOAK_WELL_KNOWN_CONFIG,
  PATH_PREFIX,
  PORT,
} from '../config'
import { NamespaceModule } from '../namespace/namespace.module'
import { ServiceConfig, getServiceVersion } from '../service-config'
import { VersionController } from './version/version.controller'
import { VersionService } from './version/version.service'
import { AuthInfoController } from './authinfo/auth-info.controller'
import {
  AuthInfoService,
  AuthInfoServiceConfig,
} from './authinfo/auth-info.service'

@Module({
  controllers: [VersionController, OSSSourceController, AuthInfoController],
  imports: [NamespaceModule],
  providers: [
    VersionService,
    OSSComplianceService,
    {
      provide: ServiceConfig,
      useFactory: () => {
        return new ServiceConfig(
          parseInt(PORT),
          PATH_PREFIX,
          getServiceVersion(),
          IMAGE_VERSION
        )
      },
    },
    {
      provide: OSSComplianceConfig,
      useFactory: () => {
        return new OSSComplianceConfig(
          path.join(__dirname, '..', 'oss', 'YakuCoreApi-SBOM.json'),
          {
            certifi: path.join(
              __dirname,
              '..',
              'oss',
              'src',
              'python_certifi_v2023.11.17.zip'
            ),
            fqdn: path.join(
              __dirname,
              '..',
              'oss',
              'src',
              'python_fqdn_v1.5.1.zip'
            ),
            'hashicorp-hcl': path.join(
              __dirname,
              '..',
              'oss',
              'src',
              'golang_hashicorp-hcl_v1.0.0.zip'
            ),
          }
        )
      },
    },
    {
      provide: AuthInfoServiceConfig,
      useFactory: () => {
        return new AuthInfoServiceConfig(KEYCLOAK_WELL_KNOWN_CONFIG)
      },
    },
    AuthInfoService,
  ],
  exports: [ServiceConfig],
})
export class ServiceModule {}
