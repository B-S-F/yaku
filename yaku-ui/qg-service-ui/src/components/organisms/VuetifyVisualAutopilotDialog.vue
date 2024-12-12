<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogDialog :id="`edit-autopilot-${autopilotName}`" class="dialog"
    :title="autopilotIds ? 'Autopilot' : `Edit ${autopilotName}`" open @close="emit('abort')">
    <template #body>
      <FrogDropdown v-if="autopilotIds" id="autopilot" class="autopilot-dropdown"
        :model-value="SelectItemConverter.fromString(autopilotName)"
        :items="autopilotIds.map(SelectItemConverter.fromString)"
        @update:modelValue="emit('switch-autopilot', $event.value.toString())" />
      <h2 class="heading text-h6 font-weight-bold">
        Environment Variables
      </h2>
      <ul class="semantic-list env-list">
        <li v-for="variable in env" :key="variable.name" class="env-item">
          <FrogTextInput :id="variable.name" class="input" :model-value="variable.value ?? variable.defaultValue"
            :readonly="variable.value === undefined" :label="variable.name"
            @update:modelValue="variable.value = $event" />
          <FrogButton integrated :icon="variable.value === undefined ? 'mdi-pencil-outline' : 'mdi-close'"
            @click="toggleOverwrite(variable)" />
        </li>
      </ul>
    </template>
    <template #actions>
      <FrogButton @click="onConfirm">
        Save
      </FrogButton>
      <FrogButton secondary @click="emit('abort')">
        Cancel
      </FrogButton>
    </template>
  </FrogDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { SelectItemConverter } from '~/helpers'
import type { EnvVariableInput } from '~/types'

const props = defineProps<{
  autopilotName: string
  autopilotIds?: string[]
  env: EnvVariableInput[]
}>()

const emit = defineEmits<{
  (e: 'abort'): void
  (e: 'switch-autopilot', autopilotName: string): void
  (e: 'confirm-edit', payload: EnvVariableInput[]): void
}>()

const autopilotEnvs = ref(props.env)
watch(
  () => props.env,
  (newVal) => (autopilotEnvs.value = newVal),
)

const toggleOverwrite = (env: EnvVariableInput) => {
  env.value = env.value === undefined ? '' : undefined
}

const onConfirm = () => {
  emit('confirm-edit', autopilotEnvs.value)
}
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as Tokens;

.dialog {
  max-height: Tokens.$dialogMaxHeight;
  overflow-y: auto;
}

.autopilot-dropdown {
  margin-bottom: $space-elements;
}

.heading {
  margin: 0 0 $space-component-m 0;
}

.env-list {
  display: flex;
  flex-direction: column;
  row-gap: $spacing-16;
}

.env-item {
  display: flex;
  column-gap: $space-component-l;
  align-items: center;

  .input {
    flex-grow: 1;
  }
}
</style>
