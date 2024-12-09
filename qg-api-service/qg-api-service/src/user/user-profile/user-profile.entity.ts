// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Column, Entity, PrimaryColumn } from 'typeorm'
import { EditorType } from './utils/types'

@Entity()
export class UserProfile {
  @PrimaryColumn({ type: 'uuid' })
  id: string // Actual kc_id of the user

  @Column({ default: true })
  emailNotifications: boolean

  @Column({ type: 'enum', enum: EditorType, default: EditorType.VISUAL })
  editor: EditorType
}
