// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Secret } from '~/types'

export type SecretPost = Omit<Secret, 'creationTime' | 'lastModificationTime'>
export type SecretUpdate = SecretPost | Omit<SecretPost, 'secret'>
export type GetAutoPilotExplanationParams = {
  runId: string
  chapter: string
  requirement: string
  check: string
}
