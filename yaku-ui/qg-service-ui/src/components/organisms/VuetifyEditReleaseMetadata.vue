<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="editReleaseRef" class="container">
    <div>
      <FrogTextInput id="release-name" ref="nameInput" v-model="localRelease.name" label="Release name" />
    </div>
    <div>
      <FrogTextInput id="release-date" v-model="localRelease.plannedDate" type="date" :value="localRelease.plannedDate"
        placeholder="Selected date" label="Planned release" :min="getEarliestPossibleReleaseDate()" />
    </div>

    <div>
      <FrogDropdown id="release-configuration" label="Select a configuration" :items="configsOptions" disabled
        :model-value="configsOptions.find(c => c.value === localRelease.qgConfig)"
        @update:model-value="localRelease.qgConfig = ($event.value as number)" />
    </div>

    <div class="actions">
      <FrogButton
        @click.prevent="emit('confirm', { name: localRelease.name, plannedDate: new Date(localRelease.plannedDate).toISOString() })">
        Save
      </FrogButton>
      <FrogButton secondary @click="emit('close')">
        Cancel
      </FrogButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectItem } from '@B-S-F/frog-vue'
import { onClickOutside } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'
import { PatchReleasePayload } from '~/api'
import { storeContext } from '~/composables/api'
import { useConfigStore } from '~/store/useConfigStore'
import { Release } from '~/types/Release'
import { getEarliestPossibleReleaseDate } from '~/utils'

const props = defineProps<{
  release: Release
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: PatchReleasePayload): void
}>()
const { configs } = useConfigStore(storeContext)
const configsOptions = computed<SelectItem[]>(() =>
  configs.map((config) => ({
    label: config.name,
    value: config.id,
  })),
)

const editReleaseRef = ref<HTMLDivElement>()
onClickOutside(editReleaseRef, () => emit('close'))

const localRelease = reactive<{
  name: string
  plannedDate: string
  qgConfig: number
}>({
  name: props.release.name,
  plannedDate: new Date(props.release.plannedDate).toISOString().slice(0, 16),
  qgConfig: props.release.qgConfigId,
})
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as *;

.container>*~* {
  margin-top: $spacing-24;
}

.close {
  position: absolute;
  top: 0;
  right: 0;
}

label~* {
  margin-bottom: 8px;
}

.actions {
  display: flex;
  gap: 12px;

  >* {
    margin-bottom: 0; // disable margin-bottom of buttons in popover
  }
}

:global(.edit-release-dialog .m-popover__head) {
  margin-bottom: 0;
}
</style>
