import {
  Inject,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import * as nodemailer from 'nodemailer'
import {
  Mail,
  MailingConfiguration,
  MailingWorker,
  SMTPConfiguration,
} from './mailing.utils'

const WORKER_INTERVAL_MILLIS = 10_000

@Injectable()
export class SMTPWorker implements OnModuleInit, MailingWorker {
  @InjectPinoLogger(SMTPWorker.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })
  private readonly transporter: nodemailer.Transporter
  private readonly queue: Mail[] = []
  private isProcessing = false
  constructor(
    @Inject(MailingConfiguration)
    private readonly configuration: SMTPConfiguration
  ) {
    this.queue = []
    this.transporter = nodemailer.createTransport({
      host: configuration.host,
      port: configuration.port,
      secure: configuration.secure,
      auth: {
        user: configuration.username,
        pass: configuration.password,
      },
    } as nodemailer.TransportOptions)
  }

  async onModuleInit() {
    if (!this.configuration.verify) {
      return
    }

    const verified = await this.transporter.verify()
    if (!verified) {
      throw new InternalServerErrorException(
        'Could not verify the connection to the SMTP server'
      )
    }
  }

  async push(item: Mail): Promise<void> {
    this.queue.push(item)
  }

  @Interval(WORKER_INTERVAL_MILLIS)
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return
    }
    this.isProcessing = true
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift()
        if (item) {
          try {
            await this.transporter.sendMail(item)
          } catch (error) {
            this.logger.error(`Error sending email: ${error}`)
            this.queue.push(item)
            break
          }
        }
      }
    } finally {
      this.isProcessing = false
    }
  }
}
