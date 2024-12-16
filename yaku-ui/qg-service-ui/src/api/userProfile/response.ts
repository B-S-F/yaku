// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { EditorType } from '~/types'

export type GetUserProfile = {
  id: string
  emailNotifications: boolean
  editor: EditorType
}
