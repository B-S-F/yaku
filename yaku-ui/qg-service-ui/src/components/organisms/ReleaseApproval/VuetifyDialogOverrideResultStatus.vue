<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog
      id="overrideResultStatus"
      v-bind="$attrs"
      title="Check settings"
      open
      @close="emit('close')"
    >
    <template #headline>
        Change to manual check status
    </template>

      <template #body>
        <div class="approval-status-container">
          <div class="flex-container">
            <span>
              <FrogIcon icon="mdi-information-outline" />
            </span>
            <span
              >This override applies to all future runs. Until the decision is
              made to set the check status automatically again</span
            >
          </div>
          <VuetifyOverrideResultStatus
            :status="prevStatus"
            @update:status="updateSelection($event)"
          />
          <FrogTextarea
            id="override-result-status-comment"
            v-model="comment"
            class="description-textarea"
            label="Mandatory comment"
            :disabled="isLoading"
          />
        </div>
        <FrogNotificationBar
          v-if="!!apiError"
          :show="!!apiError"
          variant="bar"
          type="error"
          full-width
          with-icon
          center-icon
          no-content-margin
        >
          <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
        </FrogNotificationBar>
      </template>

      <template #actions>
        <FrogPopover
          v-bind="
            releaseOverride
              ? TOOLTIP_CONFIG
              : { ...TOOLTIP_CONFIG, triggerOnHover: false }
          "
        >
          <template #content>
            <p class="tooltip-status-hint">Last automated result</p>
            <div class="tooltip-status-container">
              <VuetifyStatusPill
                rounded
                v-bind="statusPill"
                :color="statusPill.color"
                tooltip="Approver state is pending."
                :showTooltip="false"
              >
                <template #icon>
                  <FrogIcon
                    v-if="!statusPill.iconComponent"
                    :icon="statusPill.icon"
                  />
                  <component :is="statusPill.iconComponent" v-else />
                </template>
              </VuetifyStatusPill>
              <span class="highlight -size-s">{{ statusPill.tooltip }}</span>
            </div>
          </template>
          <FrogButton
            secondary
            icon="mdi-arrow-u-left-top"
            :disabled="!releaseOverride || isLoading"
            @click="reset"
          >
            Revert to automated
          </FrogButton>
        </FrogPopover>

        <FrogButton
          :disabled="!comment || !hasResultChanged"
          :class="{ downloading: isLoading }"
          :icon="isLoading ? 'mdi-sync' : ''"
          @click="save"
        >
          Save
        </FrogButton>
        <FrogButton secondary @click="emit('close')"> Cancel </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApiReleases } from '~/composables/api/useApiReleases'
import { ApiError, ReleaseOverride } from '~/api'
import { Check } from '~/types/Release'
import { TOOLTIP_CONFIG } from '~/helpers/getTooltipConfig'
import { getResultPillFromStatus } from '~helpers'
import { useApiNetworkError } from '~/composables/api'

const props = defineProps<{
  releaseId: number
  check: Check
  message: string | undefined
  releaseOverride: ReleaseOverride | undefined
}>()

const emit = defineEmits<{
  (e: 'update', newStatus: string): void
  (e: 'reset'): void
  (e: 'close'): void
}>()

const apiRelease = useApiReleases()
const apiError = ref<string>()

const comment = ref(props.message ?? '')
const hasResultChanged = ref(false)
const manualColor = ref<string | null>(null)
const isLoading = ref(false)

const prevStatus = computed(
  () => props.releaseOverride?.manualColor ?? undefined,
)
const statusPill = computed(() =>
  getResultPillFromStatus(props.check.originalStatus || props.check.status),
)

const updateSelection = (status: string) => {
  hasResultChanged.value = true
  manualColor.value = status
}

const addOverride = async () => {
  try {
    const r = await apiRelease.addReleaseOverride({
      releaseId: props.releaseId,
      chapterId: props.check.chapterId,
      requirementId: props.check.requirementId,
      check: props.check.id,
      comment: comment.value,
      originalColor: props.check.status,
      manualColor: <string>manualColor.value,
    })
    if (!r.ok) {
      const error = ((await r.json()) as ApiError)?.message
      if (error) {
        apiError.value = error
      } else {
        apiError.value = useApiNetworkError()
      }
    }
  } catch (err) {
    console.error(err)
    apiError.value = useApiNetworkError()
  }
}

const patchOverride = async () => {
  try {
    const r = await apiRelease.patchReleaseOverride({
      releaseId: props.releaseId,
      overrideId: Number(props.releaseOverride?.id),
      payload: {
        comment: comment.value,
        originalColor: props.check.status,
        manualColor: <string>manualColor.value,
      },
    })
    if (!r.ok) {
      const error = ((await r.json()) as ApiError)?.message
      if (error) {
        apiError.value = error
      } else {
        apiError.value = useApiNetworkError()
      }
    }
  } catch (err) {
    console.error(err)
    apiError.value = useApiNetworkError()
  }
}

const deleteOverride = async () => {
  try {
    if (props.releaseOverride) {
      const r = await apiRelease.deleteReleaseOverride({
        releaseId: props.releaseId,
        overrideId: Number(props.releaseOverride?.id),
      })
      if (!r.ok) {
        const error = ((await r.json()) as ApiError)?.message
        if (error) {
          apiError.value = error
        } else {
          apiError.value = useApiNetworkError()
        }
      }
    }
  } catch (err) {
    console.error(err)
    apiError.value = useApiNetworkError()
  }
}

const reset = async () => {
  if (props.releaseOverride) {
    await deleteOverride()
  }
  emit('reset')
  emit('close')
}

const save = async () => {
  isLoading.value = true
  if (props.releaseOverride) {
    await patchOverride()
  } else {
    await addOverride()
  }
  if (!apiError.value) {
    emit('update', <string>manualColor.value)
    emit('close')
  }
  isLoading.value = false
}
</script>

<style scoped lang="scss">
@use "../../../styles/mixins/flex" as *;

.flex-container {
  @include flexbox;
  gap: $spacing-8r;
  align-items: initial;
}

.tooltip-status-hint {
  font-size: 0.75rem;
}

.tooltip-status-container {
  @include flexbox($align: center);
  gap: $spacing-8r;
  margin-bottom: 0.5rem;
}

.approval-status-container > div {
  margin-bottom: $spacing-16r;
}
</style>
