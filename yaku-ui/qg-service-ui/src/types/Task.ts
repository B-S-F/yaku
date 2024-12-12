// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NamespaceUser } from '~/api'

export type TaskReminder = 'overdue' | 'always' | 'disabled'
export type TaskReference = {
  chapter?: string | null
  requirement?: string | null
  check?: string | null
}
export type Task = {
  id: number
  title: string
  dueDate: string
  reminder: TaskReminder
  description: string
  createdBy: NamespaceUser
  lastModifiedBy: NamespaceUser
  creationTime: string
  lastModificationTime: string
  closed: boolean
  assignees: NamespaceUser[]
  reference?: TaskReference
}

export type TaskFormData = {
  assignees: string[]
  title?: string
  description?: string
  dueDate: string
  reminder: 'overdue' | 'always' | 'disabled'
}

export type UpdateTaskFormData = Omit<TaskFormData, 'assignees'>

export type TaskFilter = 'open' | 'closed' | 'assigned' | 'overdue'
