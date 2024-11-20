// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Injectable } from '@nestjs/common'

@Injectable()
export class MailingServiceMock {
  pushNotification(to: string, subject: string, notification: Notification) {
    return
  }
}
