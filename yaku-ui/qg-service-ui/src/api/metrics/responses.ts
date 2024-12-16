// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Pagination } from '~/api/common/_Pagination'
import type { FindingMetric } from './entities'

export type GetFindingMetric = Pagination<FindingMetric>
