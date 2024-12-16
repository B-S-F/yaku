// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Config, Run, SecretMetadata } from '~/types'
import type { Pagination } from '~/api/common/_Pagination'
import { Namespace } from './entities'

export type GetNamespaces = Namespace[]

export type GetConfigs = Pagination<Config>

export type GetRuns = Pagination<Run>
export type GetRun = Run

export type GetSecrets = Pagination<SecretMetadata>
export type GetSecret = SecretMetadata
