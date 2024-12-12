<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="m-task-control">
    <!-- !have Task OR no assignees-->
    <FrogButton v-if="!task || !task.assignees?.length" integrated class="m-task-control__add-btn"
      @click.prevent.stop="handleManageTask">
      <TaskControlBtn />
    </FrogButton>
    <!-- have task && approvers -->
    <VuetifyTaskAssigneeDisplay v-else-if="task.assignees && task.assignees.length" :assignees="task.assignees"
      @click.prevent.stop="handleManageTask" />
  </div>
  <Teleport to="#app">
    <VuetifyScreenCenter v-if="showTaskDialog">
      <VuetifyDialogCreateTask id="task-dialog" :edit="!!task" :task="task" is-reference-task @close="showTaskDialog = false"
        @create-task="handleCreateTask"
        @update-task="async (e: UpdateTaskFormData) => task && await onUpdateTask({ releaseId: props.releaseId, taskId: task.id, payload: e })"
        @assign-task="async (e: string) => task && await handleAssignTask({ releaseId: props.releaseId, taskId: task.id, userId: e })"
        @unassign-task="async (e: string[]) => task && await handleUnassignTask({ releaseId: props.releaseId, taskId: task.id, userIds: e })"
        @resolve-task="async () => task && await handleResolveTask({ releaseId: props.releaseId, taskId: task.id })"
        @reopen-task="async () => task && await handleReopenTask({ releaseId: props.releaseId, taskId: task.id })" />
    </VuetifyScreenCenter>
  </Teleport>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import useTaskDialog from '~/composables/releaseDetails/useTaskDialog'
import useReleaseTasksStore from '~/store/useReleaseTasksStore'
import {
  Task,
  TaskFormData,
  TaskReference,
  UpdateTaskFormData,
} from '~/types/Task'
const props = defineProps<{
  reference: TaskReference
  releaseId: number
}>()

const tasksStore = useReleaseTasksStore()
const { createTaskReferenceTask, findTaskByReference } = tasksStore
const {
  showTaskDialog,
  onUpdateTask,
  handleAssignTask,
  handleResolveTask,
  handleReopenTask,
  handleUnassignTask,
} = useTaskDialog()

const task = computed<Task | undefined>(() =>
  findTaskByReference(props.reference),
)
const handleManageTask = () => {
  showTaskDialog.value = true
}

const hideDialog = () => {
  showTaskDialog.value = false
}

const handleCreateTask = async (taskFormData: TaskFormData) => {
  await createTaskReferenceTask(
    props.releaseId,
    { task: taskFormData, reference: props.reference },
    hideDialog,
  )
}
</script>

<style scoped lang="scss">
.m-task-control {
  &__add-btn {
    margin-left: 8px;

    :deep(.a-button__label) {
      padding: 0;
    }
  }
}

// do we need this, if yes how to replicate the behavior with v-btn?

:global(.m-popover .m-task-control__add-btn.a-button--integrated) {
  position: unset;
  margin-left: 8px;
}

:global(.m-popover .run-report-chapter__button.a-button--integrated) {
  position: unset;
  margin-left: 8px;
}

:global(.m-popover .run-report-requirement__button.a-button--integrated) {
  position: unset;
  margin-left: 8px;
}
</style>
