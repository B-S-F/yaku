import {
  UrlHandlerFactory,
  UrlProtocolConfig,
} from '@B-S-F/api-commons-lib'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import * as Minio from 'minio'
import {
  ARGO_NAMESPACE,
  ARGO_SERVER,
  DB_TYPE,
  ENCRYPTION_KEY,
  HTTP_PROXY,
  IN_PRIVATE_CLOUD,
  MAX_SECRET_LENGTH,
  MINIO_BUCKET,
  MINIO_PASSWORD,
  MINIO_SERVER,
  MINIO_USERNAME,
  MINIO_USE_SSL,
  OPENAI_API_KEY,
  OPENAI_API_VERSION,
  OPENAI_BASE_URL,
  OPENAI_MODEL,
  PULL_SECRET_NAME,
  QGCLI_IMAGE,
  QGCLI_PULL_POLICY,
  QGCLI_VERSION,
  RESULT_DELAY,
  SERVICE_PROTOCOL,
  SKIP_CHECK_ARGO_ARCHIVE,
  TESTDATA_CLEANUP,
  TESTDATA_NAMESPACES,
  TESTDATA_RETENTION_PERIOD_IN_DAYS,
  WORKFLOW_NO_PROXY,
} from '../config'
import {
  EncryptionService,
  EncryptionServiceConfig,
} from '../gp-services/encryption.service'
import { JsonValidatorService } from '../gp-services/json-validator.service'
import {
  OpenAIService,
  OpenAIServiceConfig,
} from '../gp-services/openai.service'
import { YamlValidatorService } from '../gp-services/yaml-validator.service'
import {
  ConfigEntity,
  FileContentEntity,
  FileEntity,
} from './configs/config.entity'
import { ConfigsController } from './configs/configs.controller'
import { ConfigsService } from './configs/configs.service'
import { ExcelTransformerService } from './configs/excel-transformer.service'
import { GeneratorService } from './configs/generator.service'
import { ExplanationsController } from './explanations/explanations.controller'
import { ExplanationsService } from './explanations/explanations.service'
import { Finding } from './findings/entity/finding.entity'
import { FindingController } from './findings/finding.controller'
import { FindingService } from './findings/finding.service'
import { Metric } from './metrics/entity/metric.entity'
import { MetricController } from './metrics/metric.controller'
import { MetricService } from './metrics/metric.service'
import { NamespaceAccessGuard } from './namespace/namespace-access.guard'
import {
  NamespaceLocalIdService,
  NamespaceSequenceConfig,
} from './namespace/namespace-local-id.service'
import { NamespaceMemberSequence } from './namespace/namespace-member-sequence.entity'
import { NamespaceController } from './namespace/namespace.controller'
import { Namespace } from './namespace/namespace.entity'
import {
  NamespaceCallbacks,
  NamespaceService,
} from './namespace/namespace.service'
import { ReleasesModule } from './releases/releases.module'
import { CleanTestDataConfig, CleanTestDataTask } from './run/clean-test-data'
import { RunController } from './run/run.controller'
import { Run, RunAuditEntity, RunAuditService } from './run/run.entity'
import { RunService } from './run/run.service'
import { SecretStorage } from './secret/secret-storage.service'
import { SecretController } from './secret/secret.controller'
import { Secret } from './secret/secret.entity'
import { SecretConfig, SecretService } from './secret/secret.service'
import { SimpleSecretStorage } from './secret/simple-secret-storage'
import { EncryptedSecret } from './secret/simple-secret-storage.entity'
import { UsersModule } from './users/users.module'
import { ArgoConfig, ArgoService } from './workflow/argo.service'
import {
  BlobStore,
  BlobStoreConfig,
  MinIOStoreImpl,
} from './workflow/minio.service'
import {
  PrivateCloudConfig,
  WorkflowImageConfig,
  WorkflowManager,
} from './workflow/workflow-argo.service'
import {
  WorkflowFinishConfig,
  WorkflowFinishedService,
} from './workflow/workflow-finished-service'
import { FinishedWorkflowDetectionTask } from './workflow/workflow-task'

@Module({
  controllers: [
    NamespaceController,
    SecretController,
    RunController,
    ConfigsController,
    FindingController,
    MetricController,
    ExplanationsController,
  ],
  imports: [
    ReleasesModule,
    UsersModule,
    TypeOrmModule.forFeature([
      Namespace,
      ConfigEntity,
      FileEntity,
      FileContentEntity,
      Secret,
      EncryptedSecret,
      Run,
      RunAuditEntity,
      NamespaceMemberSequence,
      Finding,
      Metric,
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useExisting: NamespaceAccessGuard,
    },
    NamespaceAccessGuard,
    ArgoService,
    EncryptionService,
    NamespaceService,
    RunService,
    SecretService,
    ConfigsService,
    GeneratorService,
    ExcelTransformerService,
    WorkflowManager,
    WorkflowFinishedService,
    NamespaceLocalIdService,
    FinishedWorkflowDetectionTask,
    CleanTestDataTask,
    YamlValidatorService,
    JsonValidatorService,
    FindingService,
    MetricService,
    UrlHandlerFactory,
    RunAuditService,
    OpenAIService,
    ExplanationsService,
    {
      provide: BlobStore,
      useClass: MinIOStoreImpl,
    },
    {
      provide: SecretStorage,
      useClass: SimpleSecretStorage,
    },
    {
      provide: NamespaceCallbacks,
      useFactory: (configsService: ConfigsService, runService: RunService) => {
        return new NamespaceCallbacks([
          configsService.getNamespaceCreatedCallback(),
          runService.getNamespaceCreatedCallback(),
        ])
      },
      inject: [ConfigsService, RunService],
    },
    {
      provide: NamespaceSequenceConfig,
      useFactory: () => {
        return new NamespaceSequenceConfig(DB_TYPE)
      },
    },
    {
      provide: WorkflowImageConfig,
      useFactory: () => {
        return new WorkflowImageConfig(
          QGCLI_IMAGE,
          { v1: QGCLI_VERSION, v2: QGCLI_VERSION },
          QGCLI_PULL_POLICY
        )
      },
    },
    {
      provide: WorkflowFinishConfig,
      useFactory: () => {
        return new WorkflowFinishConfig(
          parseInt(RESULT_DELAY),
          SKIP_CHECK_ARGO_ARCHIVE === 'true'
        )
      },
    },
    {
      provide: ArgoConfig,
      useFactory: () => {
        return new ArgoConfig(ARGO_NAMESPACE, ARGO_SERVER)
      },
    },
    {
      provide: Minio.Client,
      useFactory: () => {
        const url = new URL(MINIO_SERVER)
        return new Minio.Client({
          endPoint: url.hostname,
          port: parseInt(url.port),
          accessKey: MINIO_USERNAME,
          secretKey: MINIO_PASSWORD,
          useSSL: MINIO_USE_SSL === 'true',
        })
      },
    },
    {
      provide: BlobStoreConfig,
      useFactory: () => {
        return new BlobStoreConfig(MINIO_BUCKET)
      },
    },
    {
      provide: PrivateCloudConfig,
      useFactory: () => {
        return new PrivateCloudConfig(
          IN_PRIVATE_CLOUD === 'true',
          HTTP_PROXY,
          WORKFLOW_NO_PROXY,
          PULL_SECRET_NAME
        )
      },
    },
    {
      provide: SecretConfig,
      useFactory: () => {
        return new SecretConfig(parseInt(MAX_SECRET_LENGTH))
      },
    },
    {
      provide: EncryptionServiceConfig,
      useFactory: () => {
        return new EncryptionServiceConfig(ENCRYPTION_KEY)
      },
    },
    {
      provide: UrlProtocolConfig,
      useFactory: () => {
        return new UrlProtocolConfig(SERVICE_PROTOCOL)
      },
    },
    {
      provide: CleanTestDataConfig,
      useFactory: () => {
        return new CleanTestDataConfig(
          TESTDATA_CLEANUP === 'true',
          TESTDATA_NAMESPACES,
          TESTDATA_RETENTION_PERIOD_IN_DAYS
        )
      },
    },
    {
      provide: OpenAIServiceConfig,
      useFactory: () =>
        new OpenAIServiceConfig(
          OPENAI_BASE_URL,
          OPENAI_API_VERSION,
          OPENAI_API_KEY,
          OPENAI_MODEL
        ),
    },
  ],
  exports: [WorkflowImageConfig],
})
export class NamespaceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
  }
}
