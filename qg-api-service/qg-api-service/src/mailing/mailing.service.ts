import { Inject, Injectable } from '@nestjs/common'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import {
  MailingConfiguration,
  MailingWorker,
  Notification,
  NotificationType,
} from './mailing.utils'
import { TemplatingService } from './templating.service'

// This data is referenced in templates/comment.mjml
export type CommentData = {
  user_name: string // TODO: maybe "username"
  namespace_name: string // Needed, as UI does use the namespace name in their URL
  release_id: number
  release_name: string
  comment_id: number
  parent_comment_id: number
  chapter_id: string
  requirement_id: string
  check_id: string
  created_by: string
  content: string
}

type CommentNotification = {
  type: NotificationType.Comment
  data: CommentData
}

// This data is referenced in templates/mention.mjml
export type MentionData = Omit<CommentData, 'thread_id'>

type MentionNotification = {
  type: NotificationType.Mention
  data: MentionData
}

// this data is referenced in templates/approval_status.mjml
export type ApprovalStateData = {
  user_name: string
  changed_by: string
  namespace_name: string
  release_id: number
  release_name: string
  status: string
}

export type ApprovalStateNotification = {
  type: NotificationType.ApprovalState
  data: ApprovalStateData
}

// this data is referenced in templates/approval.mjml
export type ApprovalData = {
  user_name: string
  namespace_name: string
  release_id: number
  release_name: string
  added_by: string
}

export type ApprovalNotification = {
  type: NotificationType.Approval
  data: ApprovalData
}

// this data is referenced in templates/task_assigned.mjml
export type TaskAssignedData = {
  user_name: string
  namespace_name: string
  release_id: number
  task_title: string
  task_id: number
  task_description: string
}

export type TaskAssignedNotification = {
  type: NotificationType.TaskAssigned
  data: TaskAssignedData
}

// this data is referenced in templates/task_recurring.mjml
export type TaskRecurringData = {
  user_name: string
  namespace_name: string
  release_id: number
  task_id: number
  task_title: string
  task_description: string
}

export type TaskRecurringNotification = {
  type: NotificationType.TaskRecurring
  data: TaskRecurringData
}

// this data is referenced in templates/check_override.mjml
export type CheckOverrideData = {
  user_name: string
  namespace_name: string
  release_id: number
  release_name: string
  chapter_id: string
  requirement_id: string
  check_id: string
  check_title?: string
  check_status: string
  modified_by: string
}

export type CheckOverrideNotification = {
  type: NotificationType.CheckOverride
  data: CheckOverrideData
}

export abstract class MailingService {
  abstract pushNotification(
    to: string,
    subject: string,
    notification: Notification
  ): void
}

@Injectable()
export class MailingServiceImpl extends MailingService {
  @InjectPinoLogger(MailingService.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })
  private readonly from: string
  constructor(
    @Inject(MailingConfiguration)
    private readonly configuration: MailingConfiguration,
    @Inject(TemplatingService)
    private readonly templatingService: TemplatingService,
    @Inject(MailingWorker)
    private readonly mailingWorker: MailingWorker
  ) {
    super()
    this.from = configuration.sender
  }

  pushNotification(
    to: string,
    subject: string,
    notification:
      | CommentNotification
      | MentionNotification
      | ApprovalStateNotification
      | ApprovalNotification
      | TaskAssignedNotification
      | TaskRecurringNotification
      | CheckOverrideNotification
  ) {
    this.mailingWorker.push({
      from: this.from,
      to,
      subject,
      html: this.templatingService.Template(notification),
    })
  }
}

@Injectable()
export class NullMailingService extends MailingService {
  pushNotification(to: string, subject: string, notification: Notification) {
    // Do nothing
  }
}
