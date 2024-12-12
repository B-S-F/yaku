// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { computed } from 'vue'
import { currentEnv, currentNamespace } from '../context'
import { useAuthHeaders } from '../useAuthHeaders'
import {
  AssignTaskPayload,
  CloseTaskParams,
  CreateTaskPayload,
  CreateTaskReferenceTaskPayload,
  DeleteTaskParams,
  GetAllTasksParams,
  GetTaskDetailsParams,
  PatchTaskPayload,
  ReopenTaskParams,
  UnassignTaskPayload,
} from '~/api'
import { setApiPaginationParams, setApiSortOrderParam } from '../helpers'

export const useApiTasks = () => {
  const { getAuthHeader } = useAuthHeaders()
  const apiUrl = computed(
    () =>
      `${currentEnv.value?.url}/api/v1/namespaces/${currentNamespace.value?.id}/releases`,
  )

  /** Fetch all the tasks Related to a release */
  const getReleaseTasks = async (
    releaseId: number,
    opts?: GetAllTasksParams,
  ) => {
    const {
      page = '1',
      items = '100',
      sortOrder = 'DESC',
      sortBy,
      state,
      assignees,
    } = opts || {}
    const url = new URL(`${apiUrl.value}/${releaseId}/tasks`)
    setApiPaginationParams(url, { items, page })
    setApiSortOrderParam(url, sortOrder)
    if (sortBy) {
      url.searchParams.append('sortBy', sortBy)
    }

    if (state) {
      url.searchParams.append('state', state)
    }

    if (assignees && assignees.length > 0) {
      assignees.forEach((assignee) =>
        url.searchParams.append('assignees', assignee),
      )
    }

    const r = await fetch(url, {
      headers: {
        ...getAuthHeader(),
      },
    })
    return r
  }

  /** Fetch an individual task details */
  const getTaskDetails = async (
    releaseId: number,
    { taskId }: GetTaskDetailsParams,
  ) => {
    return await fetch(`${apiUrl.value}/${releaseId}/tasks/${taskId}`, {
      headers: {
        ...getAuthHeader(),
      },
    })
  }

  /** Create a new task in a release */
  const createTask = async (releaseId: number, payload: CreateTaskPayload) => {
    return await fetch(`${apiUrl.value}/${releaseId}/tasks`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /** Create a reference task release */
  const createReferenceTask = async (
    releaseId: number,
    payload: CreateTaskReferenceTaskPayload,
  ) => {
    return await fetch(`${apiUrl.value}/${releaseId}/tasks/referenceTask`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /** Delete a task */
  const deteleTask = async (
    releaseId: number,
    { taskId }: DeleteTaskParams,
  ) => {
    return await fetch(`${apiUrl.value}/${releaseId}/tasks/${taskId}`, {
      headers: {
        ...getAuthHeader(),
      },
      method: 'DELETE',
    })
  }

  /** Close a task */
  const closeTask = async (releaseId: number, { taskId }: CloseTaskParams) => {
    return await fetch(`${apiUrl.value}/${releaseId}/tasks/${taskId}/close`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  }

  /** Reopen a task  */
  const reopenTask = async (
    releaseId: number,
    { taskId }: ReopenTaskParams,
  ) => {
    return await fetch(`${apiUrl.value}/${releaseId}/tasks/${taskId}/reopen`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  }

  /** Assign a task */
  const assignTask = async (
    releaseId: number,
    { taskId, assignees }: AssignTaskPayload,
  ) => {
    return await fetch(
      `${apiUrl.value}/${releaseId}/tasks/${taskId}/assignees`,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ assignees }),
      },
    )
  }

  /** Unassign a task */
  const unassignTask = async (
    releaseId: number,
    { taskId, assignees }: UnassignTaskPayload,
  ) => {
    return await fetch(
      `${apiUrl.value}/${releaseId}/tasks/${taskId}/assignees`,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
        body: JSON.stringify({ assignees }),
      },
    )
  }

  /** Patch task  */
  const updateTask = async (
    releaseId: number,
    taskId: number,
    payload: PatchTaskPayload,
  ) =>
    await fetch(`${apiUrl.value}/${releaseId}/tasks/${taskId}`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  return {
    getReleaseTasks,
    getTaskDetails,
    createTask,
    deteleTask,
    closeTask,
    reopenTask,
    assignTask,
    unassignTask,
    createReferenceTask,
    updateTask,
  }
}
