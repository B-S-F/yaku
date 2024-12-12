<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="closeReleaseDialog" title="Confirmation" type="info" open @close="emit('close')">
      <template #headline>
        Close Release
      </template>
      <template #body>
        <div class="close-release">
          <p class="confirmation-prompt">
            Are you sure you want to close the release "{{ release?.name }}"?
          </p>
          <div class="closing-comment-form">
            <FrogTextInput id="closing-comment" v-model="closingComment" show-x placeholder="Optional comment" />
          </div>
        </div>
        <FrogNotificationBar v-if="apiError" :show="!!apiError" variant="bar" type="error" full-width with-icon
          center-icon no-content-margin>
          <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
        </FrogNotificationBar>
      </template>
      <template #actions>
        <FrogButton @click="!Number.isNaN(release?.id) && handleCloseRelease(Number(release?.id))">
          Close Release
        </FrogButton>
        <FrogButton secondary @click="emit('close')">
          Cancel
        </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { storeContext } from '~/composables/api'
import { useApiNetworkError } from '~/composables/api/useApiNetworkError'
import { useApiReleases } from '~/composables/api/useApiReleases'
import useReleaseDetails from '~/composables/releaseDetails/useReleaseDetails'
import { useReleaseStore } from '~/store/useReleaseStore'

const emit = defineEmits<(e: 'close') => void>()
const { release } = useReleaseDetails()
const closingComment = ref<string>('')
const { closeRelease, addCommentToRelease } = useApiReleases()
const apiError = ref<string>()

const releaseStore = useReleaseStore(storeContext)
const handleCloseRelease = async (releaseId: number) => {
  try {
    if (closingComment.value.length) {
      await addCommentToRelease({
        releaseId,
        comment: {
          reference: {
            type: 'release',
          },
          content: closingComment.value,
          todo: false,
        },
      })
    }
    const r = await closeRelease({ releaseId })
    if (r.ok) {
      releaseStore.updateRelease(releaseId, { closed: true })
      if (release.value) release.value.closed = true
      emit('close')
    } else {
      apiError.value = (await r.json())?.message
    }
  } catch (e) {
    console.error('error', e)
    apiError.value = useApiNetworkError()
  }
}
</script>
<style scoped lang="scss">
@use "../../../styles/tokens.scss" as *;

.closing-comment-form {
  display: flex;
  flex-direction: column;
  row-gap: $spacing-16;
  margin-bottom: $spacing-16;
}

// #closeReleaseDialog {
//   :deep(a-notification)
// }</style>
