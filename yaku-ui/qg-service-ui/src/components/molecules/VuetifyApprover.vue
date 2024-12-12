<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="approvers">
    <FrogIcon v-if="approvers === 0" source="ui" icon="plus" class="empty" />
    <template v-if="approvers <= 2">
      <VuetifyAvatar v-for="(item, index) in props.approvers" :key="index" class="approver"
        :class="item.state === 'approved' ? 'approved' : 'pending'" :name="item.user.displayName" />
    </template>
    <template v-if="approvers > 2 && firstApprover">
      <VuetifyAvatar class="approver" :name="firstApprover.user.displayName"
        :class="firstApprover.state === 'approved' ? 'approved' : 'pending'" />
      <VuetifyAvatar :name="`+${approvers - 1}`" bg="#fff" color="#000" class="approver" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { ReleaseApprover } from '~/types/Release'

export type ApproverProps = {
  approvers: ReleaseApprover[]
}
const props = defineProps<ApproverProps>()
const approvers = computed(() => (props.approvers ? props.approvers.length : 0))
const firstApprover = computed(() =>
  props.approvers ? props.approvers[0] : undefined,
)
</script>
<style scoped lang="scss">
@use '../../styles/helpers.scss' as *;

.approvers {
  display: flex;
  margin: auto;
  padding: 0px;
  flex-direction: row;
}

.empty {
  border: 2px dashed #BDBDBD; // grey-lighten-1
  background-color: transparent;
  border-radius: 50%;
  align-items: center;
  display: flex;
  justify-content: center;
  color: #BDBDBD; // grey-lighten-1
  width: $spacing-32;
  height: $spacing-32;
  font-size: $size-icon-s;
}

.approver {
  border-width: 2px;
  border-style: solid;
  margin-left: -8px;

  &:first-child {
    z-index: 4;
    margin-left: 0;
  }

  &:nth-child(2) {
    z-index: 5;
  }
}

.approved {
  border-color: #64DD17; // light-green-accent-4
}

.pending {
  border-color: #BDBDBD; // grey-lighten-1
}
</style>
