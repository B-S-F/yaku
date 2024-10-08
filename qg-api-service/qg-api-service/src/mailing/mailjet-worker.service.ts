import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import fetch, { RequestInit } from 'node-fetch'
import { ProxyAgent } from 'proxy-agent'
import {
  Mail,
  MailingConfiguration,
  MailingWorker,
  MailjetConfiguration,
} from './mailing.utils'

const WORKER_INTERVAL_MILLIS = 10_000
const MAILJET_BATCH_SIZE = 50

type MailjetMail = {
  From: {
    Email: string
    Name: string
  }
  To: {
    Email: string
    Name: string
  }[]
  Subject: string
  HTMLPart: string
}

@Injectable()
export class MailjetWorker implements OnModuleInit, MailingWorker {
  @InjectPinoLogger(MailjetWorker.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })
  private readonly queue: MailjetMail[] = []
  private isProcessing = false
  private readonly sendUrl: string
  private readonly basicAuth: string
  private readonly proxyAgent = new ProxyAgent()
  constructor(
    @Inject(MailingConfiguration)
    private readonly configuration: MailjetConfiguration
  ) {
    this.queue = []
    this.sendUrl = `${configuration.apiUrl}/v3.1/send`
    this.basicAuth = Buffer.from(
      `${configuration.apiKey}:${configuration.apiSecret}`
    ).toString('base64')
  }

  onModuleInit() {
    // Do nothing
  }

  async push(item: Mail): Promise<void> {
    this.queue.push(this.toMailjetMail(item))
  }

  private toMailjetMail(item: Mail): MailjetMail {
    return {
      From: {
        Email: this.configuration.sender,
        Name: this.configuration.sender,
      },
      To: [
        {
          Email: item.to,
          Name: item.to,
        },
      ],
      Subject: item.subject,
      HTMLPart: item.html,
    }
  }

  @Interval(WORKER_INTERVAL_MILLIS)
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return
    }
    this.isProcessing = true
    try {
      while (this.queue.length > 0) {
        const itemsToSend = this.queue.splice(0, MAILJET_BATCH_SIZE)
        try {
          await this.sendMail(itemsToSend)
        } catch (error) {
          this.logger.error(`Failed to send emails: ${error}`)
          this.queue.unshift(...itemsToSend)
          break
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async sendMail(items: MailjetMail[]) {
    if (items.length === 0) {
      return
    }
    if (items.length > MAILJET_BATCH_SIZE) {
      throw new Error('Cannot send more than 50 emails at a time')
    }

    const request: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.basicAuth}`,
      },
      body: JSON.stringify({ Messages: items }),
    }

    if (this.configuration.useProxy) {
      request.agent = this.proxyAgent
    }

    const response = await fetch(this.sendUrl, request)

    if (!response.ok) {
      throw new Error(
        `Failed to send emails with status ${
          response.status
        }: ${await response.text()}`
      )
    }

    this.logger.debug(`Sent ${items.length} emails`)
    return
  }
}
