// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NamespaceUser } from '~/api'

export type Severity =
  | 'UNKNOWN'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'INFORMATIONAL'
export type FindingStatus = 'unresolved' | 'resolved'

export type Finding = {
  /** the DB identifier */
  id: string
  /** a hash of the finding */
  uniqueHashId: string
  metadata:
    | {
        name: string
        package: string
        /** the azure defender use capitalized strings for severity */
        severity: Severity | Capitalize<Lowercase<Severity>>
        description?: string
      }
    | Record<string, never>
  namespaceId: number
  configId: number
  runId: number
  runStatus: 'completed' | 'running' | 'pending' | 'failed'
  /** the overall result of the last run that generated this finding */
  runOverallResult?: 'RED' | 'YELLOW' | 'GREEN' | 'PENDING' | 'FAILED'
  /** ISO 8601 date formatted as string */
  runCompletionTime?: string
  /** flag the finding when resolved */
  status: FindingStatus
  /** A resolved finding can have a comment attached to it */
  resolvedComment?: string | null
  /** User ID that resolved this finding */
  resolver: string | NamespaceUser | null
  /** ISO 8601 date formatted as string */
  resolvedDate: string | null
  /** The chapter of the configuration related to this finding */
  chapter: string
  /** The requirement of the configuration related to this finding */
  requirement: string
  /** The check of the configuration related to this finding */
  check: string
  /** description of the related check */
  criterion: string
  /** reason behind this finding */
  justification: string
  /** Amount of runs in which the finding occurs */
  occurrenceCount: number
  /** ISO 8601 date formatted as string */
  createdAt: string
  /** ISO 8601 date formatted as string */
  updatedAt: string
}
