// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Pagination } from '~/api/common/_Pagination'
import { App } from '~/types/AppCatalog'

export type GetApps = Pagination<App>
