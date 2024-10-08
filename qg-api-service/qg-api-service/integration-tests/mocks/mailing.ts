import { Injectable } from '@nestjs/common'

@Injectable()
export class MailingServiceMock {
  pushNotification(to: string, subject: string, notification: Notification) {
    return
  }
}
