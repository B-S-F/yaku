import { Injectable } from '@nestjs/common'

export enum NotificationType {
  Comment = 'comment.mjml',
  Mention = 'mention.mjml',
  Approval = 'approver.mjml',
  ApprovalState = 'approval_status.mjml',
  TaskAssigned = 'task_assigned.mjml',
  TaskRecurring = 'task_recurring.mjml',
  CheckOverride = 'check_override.mjml',
}

export const availableTemplates = Object.values(NotificationType)

export type TemplateMap = Map<NotificationType, ejs.TemplateFunction>

export interface Notification {
  type: NotificationType
  data: any
}

export class Mail {
  from: string
  to: string
  subject: string
  html: string
}

export abstract class MailingWorker {
  abstract push(item: Mail): void
}

export class MailingConfiguration {
  type: string
  sender: string

  constructor(sender: string) {
    this.sender = sender
  }
}

@Injectable()
export class SMTPConfiguration extends MailingConfiguration {
  readonly host: string
  readonly port: number
  readonly username: string
  readonly password: string
  readonly secure?: boolean
  readonly verify?: boolean

  constructor(
    sender: string,
    host: string,
    port: number,
    username: string,
    password: string,
    secure?: boolean,
    verify?: boolean
  ) {
    super(sender)
    this.host = host
    this.port = port
    this.username = username
    this.password = password
    this.secure = secure
    this.verify = verify
  }
}

@Injectable()
export class MailjetConfiguration extends MailingConfiguration {
  readonly apiUrl: string
  readonly apiKey: string
  readonly apiSecret: string
  readonly useProxy?: boolean

  constructor(
    sender: string,
    apiUrl: string,
    apiKey: string,
    apiSecret: string,
    useProxy?: boolean
  ) {
    super(sender)
    this.apiUrl = apiUrl
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.useProxy = useProxy
  }
}
