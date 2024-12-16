// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ref } from 'vue'
import { SortOrder } from '~/api/common'
import { Task, TaskFilter } from '~/types/Task'
import { useApiTasks } from '../api/releases/useApiTasks'
import { storeToRefs } from 'pinia'
import { provideRequestError } from '~/helpers'
import useReleaseTasksStore from '~/store/useReleaseTasksStore'

export type FetchReleaseTasksOpts = {
  filter?: TaskFilter
  sort?: SortOrder
  reset?: boolean
}

const useReleaseTasksTab = () => {
  const activeFilter = ref<TaskFilter>()
  const activeSort = ref<SortOrder>('DESC')
  const isLoading = ref<boolean>(false)
  const apiError = ref<string>()
  const next = ref<string>()

  const tasksStore = useReleaseTasksStore()
  const { tasks } = storeToRefs(tasksStore)

  const { closeTask, deteleTask, reopenTask } = useApiTasks()

  const addTask = async (task: Task) => {
    const taskExists = tasks.value.findIndex((t) => t.id === task.id)
    if (taskExists === -1) {
      // does not exist
      tasks.value.unshift(task)
    } else {
      tasks.value.splice(taskExists, 1, task)
    }
  }

  const handleResolveTask = async (releaseId: number, taskId: number) => {
    const taskExists = tasks.value.findIndex((t) => t.id === taskId)
    if (taskExists === -1) {
      return
    }

    const resolveTask = await closeTask(releaseId, { taskId })
    if (!resolveTask.ok) {
      const error = await provideRequestError(resolveTask)
      throw new Error(error)
    }

    await tasksStore.refreshTask(releaseId, taskId)
  }

  const handleReopenTask = async (releaseId: number, taskId: number) => {
    const taskExists = tasks.value.findIndex((t) => t.id === taskId)
    if (taskExists === -1) {
      return
    }

    const resolveTask = await reopenTask(releaseId, { taskId })
    if (!resolveTask.ok) {
      const error = await provideRequestError(resolveTask)
      throw new Error(error)
    }

    await tasksStore.refreshTask(releaseId, taskId)
  }

  const handleDeleteTask = async (releaseId: number, taskId: number) => {
    try {
      const taskExists = tasks.value.findIndex((t) => t.id === taskId)
      if (taskExists === -1) {
        return
      }
      const delTask = await deteleTask(releaseId, { taskId })
      if (!delTask.ok) {
        const error = await provideRequestError(delTask)
        throw new Error(error)
      }
      tasks.value.splice(taskExists, 1)
    } catch (error) {
      console.error(
        'Error deleting task: ',
        error instanceof Error ? error.message : { error },
      )
    }
  }
  return {
    tasks,
    activeFilter,
    activeSort,
    next,
    isLoading,
    apiError,
    addTask,
    handleResolveTask,
    handleDeleteTask,
    handleReopenTask,
  }
}

export default useReleaseTasksTab
