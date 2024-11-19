// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { SetMetadata } from '@nestjs/common'

export const IsPublicAPI = 'isPublicApi'
export const Public = () => SetMetadata(IsPublicAPI, true)
