import {
  KeyCloakConfig,
  KeyCloakService,
  KeyCloakStrategy,
  KeyCloakUser,
} from '@B-S-F/api-keycloak-auth-lib'
import { INestApplication } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core/constants'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm'
import crypto from 'crypto'
import { pgOptions } from '../dbsetup'
import { KeyCloakServiceMock } from '../mocks/keycloak'
import { MailingServiceMock } from '../mocks/mailing'
import { Logger, LoggerModule, PinoLogger } from 'nestjs-pino'
import { Client } from 'pg'
import { KeyCloakAuthGuard } from 'src/guards/keycloak-auth.guard'
import { RolesGuard } from 'src/guards/roles.guard'
import { LocalKeyCloakModule } from '../../src/keycloak/local.keycloak.module'
import { Metric } from '../../src/namespace/metrics/entity/metric.entity'
import {
  CommentAuditEntity,
  CommentEntity,
} from '../../src/namespace/releases/comments/comment.entity'
import {
  TaskAuditEntity,
  TaskEntity,
} from '../../src/namespace/releases/tasks/tasks.entity'
import { SubscriptionEntity } from '../../src/namespace/subscriptions/entity/subscription.entity'
import { Repository } from 'typeorm'
import { IMAGE_VERSION, PATH_PREFIX } from '../../src/config'
import { mainConfig } from '../../src/main.config'
import {
  ConfigEntity,
  FileContentEntity,
  FileEntity,
} from '../../src/namespace/configs/config.entity'
import { Finding } from '../../src/namespace/findings/entity/finding.entity'
import { RequestUser } from '../../src/namespace/module.utils'
import { NamespaceModule } from '../../src/namespace/namespace.module'
import { NamespaceSequenceConfig } from '../../src/namespace/namespace/namespace-local-id.service'
import { NamespaceMemberSequence } from '../../src/namespace/namespace/namespace-member-sequence.entity'
import { Namespace } from '../../src/namespace/namespace/namespace.entity'
import {
  ApprovalAuditEntity,
  ApprovalEntity,
} from '../../src/namespace/releases/approvals/approvals.entity'
import {
  ReleaseAuditEntity,
  ReleaseEntity,
} from '../../src/namespace/releases/release.entity'
import { ReleasesModule } from '../../src/namespace/releases/releases.module'
import { Run, RunAuditEntity } from '../../src/namespace/run/run.entity'
import { Secret } from '../../src/namespace/secret/secret.entity'
import { EncryptedSecret } from '../../src/namespace/secret/simple-secret-storage.entity'
import { ArgoConfig } from '../../src/namespace/workflow/argo.service'
import { BlobStoreConfig } from '../../src/namespace/workflow/minio.service'
import { PinoLoggingInterceptor } from '../../src/pino-logging-interceptor'
import { ServiceConfig, getServiceVersion } from '../../src/service-config'
import { ServiceModule } from '../../src/service/service.module'
import { LongRunningTokenStrategy } from '../../src/user/long-running-token/long.running.strategy'
import { LongRunningTokenModule } from '../../src/user/long-running-token/long.running.token.module'
import { UserProfile } from '../../src/user/user-profile/user-profile.entity'
import { UserProfileModule } from '../../src/user/user-profile/user-profile.module'
import { MailingService } from '../../src/mailing/mailing.service'
import { LongRunningTokenService } from '../../src/user/long-running-token/long.running.token.service'
import { CreateTokenResponseDto } from '../../src/user/long-running-token/long.running.token.utils'
import { ARGO_NAMESPACE, ARGO_SERVER, MINIO_BUCKET } from '../mocks'

type Repositories = {
  configRepository: Repository<ConfigEntity>
  fileRepository: Repository<FileEntity>
  fileContentRepository: Repository<FileContentEntity>
  findingRepository: Repository<Finding>
  metricRepository: Repository<Metric>
  runRepository: Repository<Run>
  runAuditRepository: Repository<RunAuditEntity>
  secretRepository: Repository<Secret>
  secretStoreRepository: Repository<EncryptedSecret>
  releaseRepository: Repository<ReleaseEntity>
  releaseAuditRepository: Repository<ReleaseAuditEntity>
  approvalRepository: Repository<ApprovalEntity>
  approvalAuditRepository: Repository<ApprovalAuditEntity>
  commentRepository: Repository<CommentEntity>
  commentAuditRepository: Repository<CommentAuditEntity>
  subscriptionRepository: Repository<SubscriptionEntity>
  userProfileRepository: Repository<UserProfile>
  taskRepository: Repository<TaskEntity>
  taskAuditRepository: Repository<TaskAuditEntity>
}

export type NamespaceTestEnvironment = {
  namespace: Namespace
  users: RequestUser[]
}

export class TestUtils {
  constructor(private testingModule: TestingModule) {}

  public generateUserToken = async (user: RequestUser): Promise<void> => {
    const token: CreateTokenResponseDto = await this.testingModule
      .get<LongRunningTokenService>(LongRunningTokenService)
      .create('Token for integration tests', false, user)

    const kc_users: KeyCloakUser[] = this.testingModule
      .get<KeyCloakServiceMock>(KeyCloakService)
      .getMockUsers()

    this.testingModule
      .get<KeyCloakServiceMock>(KeyCloakService)
      .mapTokenToMockUser(
        token.token,
        kc_users.find((kc_user) => kc_user.kc_sub == user.id)
      )
  }

  public getUserToken = async (user: RequestUser) => {
    const kc_users: KeyCloakUser[] = this.testingModule
      .get<KeyCloakServiceMock>(KeyCloakService)
      .getMockUsers()

    const kc_user_map: Map<string, KeyCloakUser> = this.testingModule
      .get<KeyCloakServiceMock>(KeyCloakService)
      .getTokenMap()

    const kc_user = kc_users.find((kc_user) => kc_user.kc_sub === user.id)

    for (const [key, value] of kc_user_map.entries()) {
      if (value === kc_user) {
        return key
      }
    }
  }
}

export type NestTestingApp = {
  app: INestApplication
  testingModule: TestingModule
  repositories: Repositories
  utils: TestUtils
}

export class NestUtil {
  private appData: NestTestingApp = undefined

  async startNestApplication(): Promise<NestTestingApp> {
    const dbName = crypto.randomUUID()
    await this.createDatabase(dbName)

    const testingModule: TestingModule = await Test.createTestingModule({
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
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: pgOptions.port,
          username: pgOptions.user,
          password: pgOptions.password,
          database: dbName,
          autoLoadEntities: true,
          synchronize: true,
        }),
        RouterModule.register([
          { path: 'namespaces', module: NamespaceModule },
        ]),
        NamespaceModule,
        LongRunningTokenModule,
        ServiceModule,
        LocalKeyCloakModule,
        ReleasesModule,
        UserProfileModule,
      ],
      providers: [
        {
          provide: PinoLogger,
          useValue: {
            pinoHttp: [],
            setContext: {},
            log: (message: any) => {
              console.log(`log: ${message}`)
            },
            error: (message: any) => {
              console.error(`error: ${message}`)
            },
            warn: (message: any) => {
              console.warn(`warn: ${message}`)
            },
            debug: (message: any) => {
              console.debug(`debug: ${message}`)
            },
            trace: (message: any) => {
              console.trace(`trace: ${message}`)
            },
          },
        },
        {
          provide: Logger,
          useValue: {
            pinoHttp: [],
            setContext: {},
            log: (message: any) => {
              console.log(`log: ${message}`)
            },
            error: (message: any) => {
              console.error(`error: ${message}`)
            },
            warn: (message: any) => {
              console.warn(`warn: ${message}`)
            },
            debug: (message: any) => {
              console.debug(`debug: ${message}`)
            },
            trace: (message: any) => {
              console.trace(`trace: ${message}`)
            },
          },
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: PinoLoggingInterceptor,
        },
        JwtService,
        KeyCloakStrategy,
        LongRunningTokenStrategy,
        KeyCloakAuthGuard,
        {
          provide: ServiceConfig,
          useFactory: () =>
            new ServiceConfig(
              3000,
              PATH_PREFIX,
              getServiceVersion(),
              IMAGE_VERSION
            ),
        },
        {
          provide: APP_GUARD,
          useClass: KeyCloakAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
    })
      .overrideProvider(ArgoConfig)
      .useFactory({
        factory: () => new ArgoConfig(ARGO_NAMESPACE, ARGO_SERVER),
      })
      .overrideProvider(BlobStoreConfig)
      .useFactory({
        factory: () => new BlobStoreConfig(MINIO_BUCKET),
      })
      .overrideProvider(NamespaceSequenceConfig)
      .useFactory({
        factory: () => {
          return new NamespaceSequenceConfig('embedded_postgres')
        },
      })
      .overrideInterceptor(PinoLoggingInterceptor)
      .useValue({
        intercept: (context: any, next: any) => {
          console.log(`Intercept method called with context: ${context}`)
          return next.handle()
        },
      })
      .overrideProvider(KeyCloakConfig)
      .useValue({})
      .overrideProvider(KeyCloakService)
      .useClass(KeyCloakServiceMock)
      .overrideProvider(MailingService)
      .useClass(MailingServiceMock)
      .compile()

    const app: INestApplication = testingModule.createNestApplication()
    app.useLogger(app.get(Logger))
    mainConfig(app)
    await app.init()
    const repositories: Repositories = {
      configRepository: testingModule.get(getRepositoryToken(ConfigEntity)),
      fileRepository: testingModule.get(getRepositoryToken(FileEntity)),
      fileContentRepository: testingModule.get(
        getRepositoryToken(FileContentEntity)
      ),
      findingRepository: testingModule.get(getRepositoryToken(Finding)),
      metricRepository: testingModule.get(getRepositoryToken(Metric)),
      runRepository: testingModule.get(getRepositoryToken(Run)),
      runAuditRepository: testingModule.get(getRepositoryToken(RunAuditEntity)),
      secretRepository: testingModule.get(getRepositoryToken(Secret)),
      secretStoreRepository: testingModule.get(
        getRepositoryToken(EncryptedSecret)
      ),
      releaseRepository: testingModule.get(getRepositoryToken(ReleaseEntity)),
      releaseAuditRepository: testingModule.get(
        getRepositoryToken(ReleaseAuditEntity)
      ),
      approvalRepository: testingModule.get(getRepositoryToken(ApprovalEntity)),
      approvalAuditRepository: testingModule.get(
        getRepositoryToken(ApprovalAuditEntity)
      ),
      commentRepository: testingModule.get(getRepositoryToken(CommentEntity)),
      commentAuditRepository: testingModule.get(
        getRepositoryToken(CommentAuditEntity)
      ),
      subscriptionRepository: testingModule.get(
        getRepositoryToken(SubscriptionEntity)
      ),
      userProfileRepository: testingModule.get(getRepositoryToken(UserProfile)),
      taskRepository: testingModule.get(getRepositoryToken(TaskEntity)),
      taskAuditRepository: testingModule.get(
        getRepositoryToken(TaskAuditEntity)
      ),
    }

    const utils = new TestUtils(testingModule)

    this.appData = { app, testingModule, repositories, utils }
    return this.appData
  }

  private async createDatabase(dbName: string) {
    const client = new Client({
      port: pgOptions.port,
      user: pgOptions.user,
      password: pgOptions.password,
      host: 'localhost',
      database: 'postgres',
    })

    await client.connect()
    await client.query(`CREATE DATABASE ${client.escapeIdentifier(dbName)}`)
    await client.end()
  }

  public async initDatabaseContent(): Promise<{
    testNamespace: NamespaceTestEnvironment
    otherNamespace: NamespaceTestEnvironment
  }> {
    const testingModule = this.appData.testingModule

    const nmsRepo = testingModule.get(
      getRepositoryToken(NamespaceMemberSequence)
    )
    await nmsRepo.remove(await nmsRepo.find())

    const rRepo = testingModule.get(getRepositoryToken(Run))
    await rRepo.remove(await rRepo.find())

    const runAuditRepo = testingModule.get(getRepositoryToken(RunAuditEntity))
    await runAuditRepo.remove(await runAuditRepo.find())

    const fcRepo = testingModule.get(getRepositoryToken(FileContentEntity))
    await fcRepo.remove(await fcRepo.find())

    const fRepo = testingModule.get(getRepositoryToken(FileEntity))
    await fRepo.remove(await fRepo.find())

    const cRepo = testingModule.get(getRepositoryToken(ConfigEntity))
    await cRepo.remove(await cRepo.find())

    const nRepo = testingModule.get(getRepositoryToken(Namespace))
    await nRepo.remove(await nRepo.find())

    const mRepo = testingModule.get(getRepositoryToken(Metric))
    await mRepo.remove(await mRepo.find())

    const fndRepo = testingModule.get(getRepositoryToken(Finding))
    await fndRepo.remove(await fndRepo.find())

    const approvalRepo = testingModule.get(getRepositoryToken(ApprovalEntity))
    await approvalRepo.remove(await approvalRepo.find())

    const releaseRepo = testingModule.get(getRepositoryToken(ReleaseEntity))
    await releaseRepo.remove(await releaseRepo.find())

    const subscriptionRepo = testingModule.get(
      getRepositoryToken(SubscriptionEntity)
    )
    await subscriptionRepo.remove(await subscriptionRepo.find())

    const approvalAuditRepo = testingModule.get(
      getRepositoryToken(ApprovalAuditEntity)
    )
    await approvalAuditRepo.remove(await approvalAuditRepo.find())

    const releaseAuditRepo = testingModule.get(
      getRepositoryToken(ReleaseAuditEntity)
    )
    await releaseAuditRepo.remove(await releaseAuditRepo.find())

    const userProfileRepo = testingModule.get(getRepositoryToken(UserProfile))
    await userProfileRepo.remove(await userProfileRepo.find())

    const kc = testingModule.get<KeyCloakServiceMock>(KeyCloakService)
    kc.revokeAccessToAllMockusersForAllNamespaces()
    const testNamespace = await this.createNamespace('test_namespace')
    const otherNamespace = await this.createNamespace('other_namespace')
    return { testNamespace, otherNamespace }
  }

  private async createNamespace(
    name: string
  ): Promise<NamespaceTestEnvironment> {
    const testingModule = this.appData.testingModule
    const kc = testingModule.get<KeyCloakServiceMock>(KeyCloakService)

    const users: (RequestUser & { roles: string[] })[] = kc
      .getMockUsers()
      .map((user) => {
        const userWithRole: RequestUser & { roles: string[] } = {
          ...new RequestUser(
            user.kc_sub,
            user.username,
            user.email,
            user.displayName
          ),
          roles: user.roles,
        }
        return userWithRole
      })

    const namespace: Namespace = await testingModule
      .get(getRepositoryToken(Namespace))
      .save({
        name,
      })

    for (const user of users) {
      kc.grantAccessToMockuserForNamespace(user.id, namespace.id, user.roles)
      await this.appData.utils.generateUserToken(user)
    }

    await testingModule.get(getRepositoryToken(NamespaceMemberSequence)).save([
      {
        namespace,
        entityName: Run.name,
        lastId: 0,
      },
      {
        namespace,
        entityName: ConfigEntity.name,
        lastId: 0,
      },
    ])

    return {
      namespace,
      users,
    }
  }
}
