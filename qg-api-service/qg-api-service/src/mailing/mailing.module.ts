import { DynamicModule, Module } from '@nestjs/common'
import {
  ENABLE_MAIL_NOTIFICATIONS_FEATURE,
  INSTANCE_NAME,
  MAILJET_API_KEY,
  MAILJET_API_SECRET,
  MAILJET_API_URL,
  MAILJET_USE_PROXY,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_SENDER,
  SMTP_USERNAME,
  TEMPLATE_PATH,
  UI_SETTINGS_PATH,
  UI_URL,
  USE_MAILJET_API,
} from '../config'
import {
  MailingService,
  MailingServiceImpl,
  NullMailingService,
} from './mailing.service'
import {
  MailingConfiguration,
  MailingWorker,
  MailjetConfiguration,
  SMTPConfiguration,
} from './mailing.utils'
import { MailjetWorker } from './mailjet-worker.service'
import { SMTPWorker } from './smtp-worker.service'
import { TemplatingCache } from './templating-cache.service'
import {
  InstanceName,
  TemplatingConfiguration,
  TemplatingService,
} from './templating.service'

@Module({})
export class MailingModule {
  static register(): DynamicModule {
    if (ENABLE_MAIL_NOTIFICATIONS_FEATURE === 'true') {
      let workerProviders = []
      if (USE_MAILJET_API === 'true') {
        workerProviders = [
          {
            provide: MailingConfiguration,
            useValue: new MailjetConfiguration(
              SMTP_SENDER,
              MAILJET_API_URL,
              MAILJET_API_KEY,
              MAILJET_API_SECRET,
              MAILJET_USE_PROXY === 'true'
            ),
          },
          {
            provide: MailingWorker,
            useClass: MailjetWorker,
          },
        ]
      } else {
        workerProviders = [
          {
            provide: MailingConfiguration,
            useValue: new SMTPConfiguration(
              SMTP_SENDER,
              SMTP_HOST,
              Number(SMTP_PORT),
              SMTP_USERNAME,
              SMTP_PASSWORD,
              SMTP_SECURE === 'true',
              true
            ),
          },
          {
            provide: MailingWorker,
            useClass: SMTPWorker,
          },
        ]
      }
      return {
        module: MailingModule,
        imports: [],
        controllers: [],
        providers: [
          {
            provide: MailingService,
            useClass: MailingServiceImpl,
          },
          ...workerProviders,
          TemplatingService,
          {
            provide: TemplatingConfiguration,
            useValue: new TemplatingConfiguration({
              instanceName: INSTANCE_NAME as InstanceName,
              uiURL: UI_URL,
              uiSettingsPath: UI_SETTINGS_PATH,
            }),
          },
          {
            provide: TemplatingCache,
            useValue: new TemplatingCache(TEMPLATE_PATH),
          },
        ],
        exports: [MailingService],
      }
    } else {
      return {
        module: MailingModule,
        providers: [
          {
            provide: MailingService,
            useClass: NullMailingService,
          },
        ],
        exports: [MailingService],
      }
    }
  }
}
