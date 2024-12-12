// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NamespaceUser } from '../core'

export type ReleaseCommentReference = {
  type?: 'check' | 'comment' | 'release'
  chapter?: string
  requirement?: string
  check?: string
  id?: number | string
}

export type ReleaseComment = {
  id: number
  reference: ReleaseCommentReference
  todo: boolean
  content: string
  status: 'created' | 'resolved'
  createdBy: NamespaceUser
  creationTime: string
  replies: ReleaseComment[]
}

export type ReplyComment = ReleaseComment

export type ReleaseThreadStatus = 'resolved' | 'unresolved'

export type CommentsThread = ReleaseComment
