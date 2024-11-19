// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm'

@Entity()
@Unique(['namespaceId', 'name'])
export class EncryptedSecret {
  @Index()
  @PrimaryColumn()
  namespaceId: number

  @PrimaryColumn()
  name: string

  @Column()
  value: string
}
