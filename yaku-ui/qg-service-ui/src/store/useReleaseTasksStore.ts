// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { SortOrder } from '~/api/common'
import { Pagination } from '~/api/common/_Pagination'
import { useApiNetworkError } from '~/composables/api'
import { useApiTasks } from '~/composables/api/releases/useApiTasks'
import { provideRequestError } from '~/helpers'
import { Task, TaskFilter, TaskFormData, TaskReference } from '~/types/Task'
import useKeycloakStore from './useKeycloakStore'

const taskStore = () => {
  const tasks = ref<Task[]>([])
  const activeFilter = ref<TaskFilter | string>('')
  const activeSort = ref<SortOrder>('DESC')
  const isLoading = ref<boolean>(false)
  const {
    getReleaseTasks,
    createReferenceTask: apiCreateReferenceTask,
    assignTask,
    getTaskDetails,
  } = useApiTasks()
  const keycloakStore = useKeycloakStore()
  const { user } = storeToRefs(keycloakStore)

  const fetchReleaseTasks = async (
    releaseId: number,
    onError?: (e: string) => void,
  ) => {
    try {
      tasks.value = []
      let page: number | undefined = 1
      while (page !== undefined) {
        const getTasks = await getReleaseTasks(releaseId, {
          page: String(page),
          items: '100',
        })
        if (!getTasks.ok) {
          const error = await provideRequestError(getTasks)
          console.error('Error fetching tasks: ', error)
          throw new Error(error)
        }
        const { data = [], pagination = undefined } =
          (await getTasks.json()) as Pagination<Task>
        tasks.value.push(...data)

        if (pagination?.totalCount) {
          page =
            pagination.totalCount > tasks.value.length
              ? pagination.pageSize + 1
              : undefined
        } else {
          page = undefined
        }
      }
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : await provideRequestError()
      if (onError) {
        onError(errorMsg)
      }
      console.error('Error fetching release tasks', errorMsg)
    }
  }

  const filterCurrentUserTasks = (t: Task) =>
    user.value.uuid && t.assignees.map((a) => a.id).includes(user.value.uuid)

  const filterOverdueTasks = (t: Task) => new Date(t.dueDate) < new Date()

  const sortTasks = (order: SortOrder) => (a: Task, b: Task) => {
    const dateA = new Date(a.dueDate).getTime()
    const dateB = new Date(b.dueDate).getTime()
    return order === 'ASC' ? dateA - dateB : dateB - dateA
  }

  const filteredTasks = computed(() => {
    switch (activeFilter.value) {
      case 'open':
        return tasks.value.filter((t) => !t.closed)
      case 'closed':
        return tasks.value.filter((t) => t.closed)
      case 'assigned':
        return tasks.value.filter(filterCurrentUserTasks)
      case 'overdue':
        return tasks.value.filter(filterOverdueTasks)
      default:
        return tasks.value
    }
  })

  // TODO: include sorted tasks
  const sortedTasks = computed(() =>
    filteredTasks.value.sort(sortTasks(activeSort.value)),
  )

  const findTaskByReference = (reference: TaskReference) => {
    if (!tasks.value || !tasks.value.length) return undefined
    return tasks.value.find(
      (t) =>
        t.reference &&
        JSON.stringify(t.reference) === JSON.stringify(reference),
    )
  }

  const createTaskReferenceTask = async (
    releaseId: number,
    { task, reference }: { task: TaskFormData; reference: TaskReference },
    onFinish?: () => void,
    onError?: (e: string) => void,
  ) => {
    try {
      // 1. Create reference task using reference
      const { dueDate, reminder, assignees } = task
      const _reference: TaskReference = {}
      Object.keys(reference).forEach((r) => {
        if (reference[r as keyof TaskReference] !== null)
          _reference[r as keyof TaskReference] =
            reference[r as keyof TaskReference]
      })
      const createTask = await apiCreateReferenceTask(releaseId, {
        dueDate: new Date(dueDate).toISOString(),
        reminder,
        reference: _reference,
      })
      if (!createTask.ok) {
        const apiError = await provideRequestError(createTask)
        throw new Error(apiError)
      }
      // 2. Get new task id
      const _task = (await createTask.json()) as Task
      // 3. Assign assignees to the new task
      const assingTask = await assignTask(releaseId, {
        taskId: _task.id,
        assignees,
      })
      if (!assingTask.ok) {
        const apiError = await provideRequestError(assingTask)
        throw new Error(apiError)
      }
      // 4. Get new task and append it
      const getTask = await getTaskDetails(releaseId, { taskId: _task.id })
      if (!getTask.ok) {
        const apiError = await provideRequestError(getTask)
        tasks.value?.push(_task)
        throw new Error(apiError)
      }
      const taskWithAssignees = (await getTask.json()) as Task
      tasks.value?.push(taskWithAssignees)
      onFinish?.()
    } catch (error) {
      // 5. handle finish & error state
      const errorMsg =
        error instanceof Error ? error.message : useApiNetworkError()
      if (onError && errorMsg) {
        onError(errorMsg)
      }
      console.error('Error creating & assigning a task...', errorMsg)
    }
  }

  const refreshTask = async (releaseId: number, taskId: number) => {
    try {
      const taskIdx = tasks.value.findIndex((t) => t.id === taskId)
      if (taskIdx === -1) {
        console.warn('Failed to refresh tasks: Taks not found')
        return
      }
      const getTask = await getTaskDetails(releaseId, { taskId })
      if (!getTask.ok) {
        const error = await provideRequestError(getTask)
        throw new Error(error)
      }
      const updateTask = (await getTask.json()) as Task
      addTask(updateTask)
    } catch (error) {
      console.error(
        'Failed to refresh tasks: ',
        error instanceof Error ? error.message : error,
      )
    }
  }

  const addTask = async (task: Task) => {
    const taskExists = tasks.value.findIndex((t) => t.id === task.id)
    if (taskExists === -1) {
      // does not exist
      tasks.value.unshift(task)
    } else {
      tasks.value.splice(taskExists, 1, task)
    }
  }

  return {
    tasks,
    fetchReleaseTasks,
    findTaskByReference,
    createTaskReferenceTask,
    addTask,
    refreshTask,
    filteredTasks,
    activeFilter,
    activeSort,
    sortedTasks,
  }
}

export default () => defineStore('releaseTasksStore', taskStore)()
