<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog id="manageReleaseApprovalStatus" ref="dialogRef" v-bind="$attrs" title="Change approval state" open
      @close="emit('close')">
      <template #headline>
        Change the approval state
      </template>

      <template #body>
        <div class="approval-status-container">
          <div class="flex-container">
            <FrogIcon icon="mdi-information-outline" />
            <span>Please add a comment to change the release state</span>
          </div>
          <VuetifyApproverStatus :state="status" current-user :openStatusSelection="true"
            @update:status="newStatus = $event" />
          <FrogTextarea id="change-approval-comment" v-model="comment" placeholder="Mandatory comment"
            :disabled="isSaving" />
        </div>
      </template>

      <template #actions>
        <FrogButton :disabled="!allowUpdate" :class="{ 'downloading': isSaving }" :icon="isSaving ? 'mdi-sync' : ''"
          @click="handleUpdateStatus">
          Save
        </FrogButton>
        <FrogButton secondary @click="emit('close')">
          Cancel
        </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  status: string
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'update-status',
    { status, comment }: { status: string; comment: string },
  ): void
}>()

const comment = ref('')
const newStatus = ref<string>()
onMounted(() => {
  if (props.status) newStatus.value = props.status
})
const allowUpdate = computed(
  () =>
    props.status !== newStatus.value &&
    comment.value.length > 0 &&
    newStatus.value !== undefined &&
    ['approved', 'pending'].includes(newStatus.value),
)
const handleUpdateStatus = () => {
  if (!allowUpdate.value || newStatus.value === undefined) return
  emit('update-status', { status: newStatus.value, comment: comment.value })
}
</script>

<style scoped lang="scss">
@use '../../../styles/mixins/flex' as *;

.flex-container {
  @include flexbox;
  gap: $spacing-8r;
}

.approval-status-container>div {
  margin-bottom: $spacing-16r;
}
</style>
