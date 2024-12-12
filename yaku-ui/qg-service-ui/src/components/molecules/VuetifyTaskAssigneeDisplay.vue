<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="m-task-assignee-display">
    <VuetifyAvatar v-if="assignees.length === 1" :name="displayUserName(assignees[0])" />
    <div v-else class="m-task-assignee-display__assignees">
      <template v-if="assignees.length === 2">
        <VuetifyAvatar v-for="assignee in assignees" :key="assignee.id" :name="displayUserName(assignee)" />
      </template>
      <div v-else class="m-task-assignee-display__assignees">
        <VuetifyAvatar :name="displayUserName(assignees[0])" />
        <div class="m-task-assignee-display__count -size-s highlight">
          +{{ assignees.length - 1 }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { NamespaceUser } from '~/api'
import { displayUserName } from '~/helpers/displayUserName'

type TaskAssigneeDisplayProps = {
  assignees: NamespaceUser[]
}

defineProps<TaskAssigneeDisplayProps>()
</script>
<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;

.m-task-assignee-display {
  margin-left: $space-component-s;

  .mo-avatar {
    border: 2px solid var(--v-theme-background);

    &:first-of-type {
      z-index: 2;
    }

    &:not(:first-of-type) {
      margin-left: -8px;
      z-index: 1;
    }
  }

  &__count {
    width: 32px;
    height: 32px;
    border-radius: 16px;
    border: 2px solid #0277BD; // light-blue-darken-3
    /** Schemes/Primary background/Major signal neutral/Enabled fill default */
    @include Flex.flexbox($justify: center);
  }

  &__assignees {
    @include Flex.flexbox;


    .m-task-assignee-display__count {
      margin-left: -4px;
    }
  }
}
</style>
