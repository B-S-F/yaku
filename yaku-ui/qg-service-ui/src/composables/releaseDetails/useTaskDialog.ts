// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Ref, ref } from 'vue'
import { TaskFormData, Task, UpdateTaskFormData } from '~/types/Task'
import { useApiTasks } from '../api/releases/useApiTasks'
import { provideRequestError } from '~/helpers'
import useReleaseTasksStore from '~/store/useReleaseTasksStore'
import { storeToRefs } from 'pinia'

const useTaskDialog = () => {
  const showTaskDialog = ref<boolean>(false)
  const apiError = ref<string>()
  const isLoading = ref<boolean>(false)

  const tasksStore = useReleaseTasksStore()
  const { tasks } = storeToRefs(tasksStore)

  const {
    createTask,
    updateTask,
    assignTask: apiAssignTask,
    unassignTask,
    getTaskDetails,
    closeTask,
    reopenTask,
  } = useApiTasks()

  const handleShowTaskDialog = () => {
    showTaskDialog.value = true
  }

  const handleCreateTask = async (
    releaseId: number,
    formData: TaskFormData,
  ) => {
    try {
      // 1. Reset flow state
      isLoading.value = true
      apiError.value = undefined

      const create = await createTask(releaseId, {
        title: formData.title,
        description: formData.description,
        dueDate: new Date(formData.dueDate).toISOString(),
        reminder: formData.reminder,
      })

      if (!create.ok) {
        const createError = await provideRequestError(create)
        throw new Error(createError)
      }

      const createdTask = (await create.json()) as Task

      if (formData.assignees.length > 0) {
        const assign = await apiAssignTask(releaseId, {
          taskId: createdTask.id,
          assignees: formData.assignees,
        })

        if (!assign.ok) {
          const assignError = await provideRequestError(assign)
          throw new Error(assignError)
        }

        const fetchTask = await getTaskDetails(releaseId, {
          taskId: createdTask.id,
        })

        if (!fetchTask.ok) {
          const fetchError = await provideRequestError(fetchTask)
          throw new Error(fetchError)
        }

        return (await fetchTask.json()) as Task
      }
    } catch (error) {
      console.error('Error creating task: ', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const handleUpdateTask = async (
    releaseId: number,
    taskId: number,
    formData: UpdateTaskFormData,
  ) => {
    try {
      isLoading.value = true
      apiError.value = undefined
      const update = await updateTask(releaseId, taskId, formData)

      if (!update.ok) {
        const updateError = await provideRequestError(update)
        throw new Error(updateError)
      }

      return (await update.json()) as Task
    } catch (error) {
      console.error('Error udpating task: ', error)
    }
  }

  const assignTask = async (
    releaseId: number,
    taskId: number,
    userIds: string[],
    unassign?: boolean,
  ) => {
    apiError.value = undefined
    const operationFunc = unassign ? unassignTask : apiAssignTask
    const assign = await operationFunc(releaseId, {
      taskId,
      assignees: userIds,
    })

    if (!assign.ok) {
      const assignError = await provideRequestError(assign)
      throw new Error(assignError)
    }
    const fetchTask = await getTaskDetails(releaseId, { taskId })

    if (!fetchTask.ok) {
      const fetchError = await provideRequestError(fetchTask)
      throw new Error(fetchError)
    }

    return (await fetchTask.json()) as Task
  }

  type ResolveTaskParams = {
    releaseId: number
    taskId: number
  }

  const handleResolveTask = async ({
    releaseId,
    taskId,
  }: ResolveTaskParams) => {
    try {
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
    } catch (error) {
      console.error(
        'Error resolving task',
        error instanceof Error ? error.message : error,
      )
    }
  }

  const handleReopenTask = async ({ releaseId, taskId }: ResolveTaskParams) => {
    try {
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
    } catch (error) {
      console.error(
        'Error reopening task',
        error instanceof Error ? error.message : error,
      )
    }
  }

  type UpdateTaskParams = {
    releaseId: number
    taskId: number
    payload: UpdateTaskFormData
  }
  const onUpdateTask = async ({
    releaseId,
    taskId,
    payload,
  }: UpdateTaskParams) => {
    if (releaseId) {
      const updatedTask = await handleUpdateTask(releaseId, taskId, payload)
      const taskIdx = tasks.value.findIndex((t) => t.id === taskId)
      if (taskIdx === -1 || !updatedTask) return
      tasksStore.addTask(updatedTask)
      showTaskDialog.value = false
    }
  }

  type AssignTaskParams = {
    releaseId: number
    taskId: number
    userIds: string[]
  }
  const handleUnassignTask = async ({
    releaseId,
    taskId,
    userIds,
  }: AssignTaskParams) => {
    if (releaseId) {
      await assignTask(releaseId, taskId, userIds, true)
      const taskIdx = tasks.value.findIndex((t) => t.id === taskId)
      if (taskIdx === -1) return
      await tasksStore.refreshTask(releaseId, taskId)
    }
  }

  type UnassignTaskParams = {
    releaseId: number
    taskId: number
    userId: string
  }
  const handleAssignTask = async ({
    releaseId,
    taskId,
    userId,
  }: UnassignTaskParams) => {
    if (releaseId) {
      await assignTask(releaseId, taskId, [userId])
      const taskIdx = tasks.value.findIndex((t) => t.id === taskId)
      if (taskIdx === -1) return
      await tasksStore.refreshTask(releaseId, taskId)
    }
  }

  return {
    assignTask,
    showTaskDialog,
    handleShowTaskDialog,
    handleCreateTask,
    handleUpdateTask,
    apiError,
    handleResolveTask,
    handleReopenTask,
    onUpdateTask,
    handleUnassignTask,
    handleAssignTask,
  }
}

export default useTaskDialog
