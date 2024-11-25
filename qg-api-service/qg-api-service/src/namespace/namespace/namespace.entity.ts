// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Namespace {
  @PrimaryGeneratedColumn()
  id: number

  @Index()
  @Column()
  name: string
}
