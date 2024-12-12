// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Release, ReleaseApprover, ReleaseHistoryItem } from '~/types/Release'
import { Pagination } from '../common/_Pagination'
import { ReleaseComment } from './comment'
import { Task } from '~/types/Task'

export type GetReleases = Pagination<Release>
export type GetApprovalStateAllResponse = Pagination<ReleaseApprover>
export type GetReleaseComments = Pagination<ReleaseComment>
export type GetReleaseHistoryResponse = Pagination<ReleaseHistoryItem>
export type GetTasks = Pagination<Task>
