<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="o-release-task bg-grey-lighten-2" @click.prevent="onOpenTask">
    <div class="o-release-task__details">
      <VuetifyStatusPill rounded v-bind="taskStatus" :color="taskStatus.color" tooltip="Approver state is pending."
        :showTooltip="false" :label="undefined">
        <template #icon>
          <FrogIcon :icon="taskStatus.icon ?? ''" />
        </template>
      </VuetifyStatusPill>
      <h3 v-if="task.title" class="o-release-task__title text-h6">
        {{ task.title }}
      </h3>
      <FrogPopover class="o-release-task__description" arrowPlacementClass="-without-arrow-top"
        :label="task.description" trigger-on-hover tooltip-alike attached>
        <FrogIcon icon="mdi-information-outline" />
      </FrogPopover>
      <div v-if="displayAssignees.length > 0" class="o-release-task__assignees">
        <VuetifyTaskAssigneeDisplay :assignees="displayAssignees" />
      </div>
      <span class="o-release-task__due-date">
        <FrogIcon icon="mdi-calendar-clock-outline" />
        {{ getHumanDateTime(task.dueDate) }}
      </span>
    </div>
    <VuetifyInlineOrContext class="o-release-task__actions">
      <FrogPopover v-bind="actionsBtnsAttrs" label="Edit">
        <FrogButton primary icon="mdi-pencil-outline" @click.prevent.stop="showTaskDialog = true" />
      </FrogPopover>
      <FrogPopover v-bind="actionsBtnsAttrs" :label="task.closed ? 'Reopen' : 'Resolve'">
        <FrogButton tertiary :icon="task.closed ? 'mdi-autorenew' : 'mdi-check'"
          @click.prevent.stop="task.closed ? $emit('reopen', task.id) : $emit('resolve', task.id)" />
      </FrogPopover>
      <FrogPopover v-bind="actionsBtnsAttrs" label="Delete">
        <FrogButton tertiary icon="mdi-trash-can-outline" @click.prevent.stop="$emit('delete', task.id)" />
      </FrogPopover>
      <template #secondary-actions>
        <FrogMenuItem label="Edit" @click.prevent.stop="showTaskDialog = true" />
        <FrogMenuItem :label="task.closed ? 'Reopen' : 'Resolve'" :disabled="task.closed"
          @click.prevent.stop="task.closed ? $emit('reopen', task.id) : $emit('resolve', task.id)" />
        <FrogMenuItem label="Delete" @click.prevent.stop="$emit('delete', task.id)" />
      </template>
    </VuetifyInlineOrContext>
  </div>
  <Teleport to="#app">
    <VuetifyScreenCenter v-if="showTaskDialog">
      <VuetifyDialogCreateTask :task="task" edit @close="onCloseDialog"
        @update-task="async (e: UpdateTaskFormData) => await onUpdateTask({ releaseId: props.releaseId, taskId: task.id, payload: e })"
        @assign-task="async (e: string) => await handleAssignTask({ releaseId: props.releaseId, taskId: task.id, userId: e })"
        @unassign-task="async (e: string[]) => await handleUnassignTask({ releaseId: props.releaseId, taskId: task.id, userIds: e })"
        @resolve-task="async () => await handleResolveTask({ releaseId: props.releaseId, taskId: task.id })"
        @reopen-task="async () => await handleReopenTask({ releaseId: props.releaseId, taskId: task.id })" />
    </VuetifyScreenCenter>
  </Teleport>
</template>

<script setup lang="ts">
import { ArrowPlacement } from '@B-S-F/frog-vue'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useTaskDialog from '~/composables/releaseDetails/useTaskDialog'
import { StatusColors } from '~/types'
import { Task, UpdateTaskFormData } from '~/types/Task'
import { getHumanDateTime } from '~/utils'

const props = defineProps<{
  task: Task
  releaseId: number
}>()

defineEmits<{
  (e: 'reopen', id: number): void
  (e: 'resolve', id: number): void
  (e: 'delete', id: number): void
}>()

const taskStatus = computed(() => {
  if (props.task.closed)
    return {
      color: 'Success' as StatusColors,
      label: 'Approved',
      tooltip: 'Release is approved.',
      icon: 'mdi-check-circle-outline',
      iconComponent: undefined,
    }
  else
    return {
      color: 'Unknown' as StatusColors,
      label: 'Pending',
      tooltip: 'Release is pending.',
      icon: 'mdi-dots-horizontal-circle-outline',
      iconComponent: undefined,
    }
})

const displayAssignees = computed(() => props.task.assignees)

const {
  showTaskDialog,
  onUpdateTask,
  handleAssignTask,
  handleUnassignTask,
  handleResolveTask,
  handleReopenTask,
} = useTaskDialog()

const route = useRoute()
const router = useRouter()
onMounted(() => {
  const taskId = route.query?.id
  if (taskId && String(taskId) === String(props.task.id)) {
    showTaskDialog.value = true
  }
})

const onOpenTask = () => {
  showTaskDialog.value = true
  router.replace({
    query: {
      ...route.query,
      id: String(props.task.id),
    },
  })
}

const onCloseDialog = () => {
  showTaskDialog.value = false
  router.replace({
    query: {
      ...route.query,
      id: undefined,
    },
  })
}

const actionsBtnsAttrs = {
  attached: true,
  triggerOnHover: true,
  tooltipAlike: true,
  arrowPlacementClass: '-without-arrow-top' as ArrowPlacement,
}
</script>
<style scoped lang="scss">
@use '../../styles/tokens.scss' as Tokens;
@use '../../styles/mixins/flex.scss' as Flex;

.o-release-task {
  padding: Tokens.$padding-component-s;
  display: grid;
  grid-template-columns: 1fr auto;
  cursor: pointer;


  &__details {
    @include Flex.flexbox($align: center);
    column-gap: 12px;
  }

  &__title {
  }

  &__description {
    line-height: 1;
  }

  &__actions {
    transition: $reveal-effect;
    opacity: $reveal-start;
  }

  &__assignees {
    @include Flex.flexbox;

    figure:not(:first-of-type) {
      margin-left: -8px;
    }
  }

  &__due-date {
    @include Flex.flexbox;
    column-gap: 8px;
  }

  /** Hover styles */
  &:hover,
  &:focus-within {
    .o-release-task__actions {
      opacity: $reveal-end;
    }

    .o-release-task__title {
      text-decoration: underline 2px;
    }
  }

  &:active .o-release-task__title {
  }
}

.-no-extra-margin {
  margin: 0;
}
</style>
