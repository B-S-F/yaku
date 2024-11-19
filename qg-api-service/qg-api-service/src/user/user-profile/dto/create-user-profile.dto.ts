// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { EditorType } from '../utils/types'

export class CreateUserProfileDto {
  emailNotifications?: boolean
  editor?: EditorType
}
