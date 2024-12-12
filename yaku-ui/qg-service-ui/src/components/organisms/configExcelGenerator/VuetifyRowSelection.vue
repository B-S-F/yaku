<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="row-selection">
    <VuetifyStepHeading class="step-heading" heading="Choose the sheet and define the range of content"
      description="Choose the correct sheet of the uploaded file and define the content area by setting the start and row with the handles below or the input fields." />
    <div class="fields o-form__row">
      <FrogDropdown id="sheetButtonDropdown" v-model="selectedSheet" label="Sheet" :items="options" />
      <FrogFormField class="row-field" :fieldMsg="rowInputErrorMessage">
        <FrogValueModificator id="startRowInput" v-model="range.startRow" class="row-field" label="Start Row"
          :min="MIN_RANGE" :max="maxRange" />
        <FrogValueModificator id="endRowInput" v-model="range.endRow" class="row-field" label="End Row" :min="MIN_RANGE"
          :max="maxRange" />
      </FrogFormField>
    </div>
    <VuetifyMappingTableSelection v-if="table" v-model:range="range" hide-headline-names :table="table" />
    <div class="navigation-buttons">
      <FrogButton secondary icon="mdi-arrow-left" @click="emit('back')">
        Change File
      </FrogButton>
      <FrogButton icon="mdi-arrow-right" icon-right :disabled="disableNextStep" @click="emit('next')">
        Apply Content Range
      </FrogButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useWorkbookStore } from '~/store/useWorkbookStore'

const emit = defineEmits<{
  (e: 'next'): void
  (e: 'back'): void
}>()

const { selectedSheet, options, range, table, maxRange } = storeToRefs(
  useWorkbookStore(),
)

const MIN_RANGE = 1
const validateLineInput = (
  n: number,
  min: number,
  max: number,
): string | undefined => {
  if (n % 1 !== 0) return 'No decimal values allowed'
  if (n < MIN_RANGE) return `Values not lower than ${min}`
  if (n > max) return `Values not higher than ${max}`
}

const rowInputErrorMessage = computed(() => {
  const startRowValidation = validateLineInput(
    range.value.startRow,
    MIN_RANGE,
    maxRange.value,
  )
  const endRowValidation = validateLineInput(
    range.value.endRow,
    MIN_RANGE,
    maxRange.value,
  )

  const messages = [startRowValidation]
  if (startRowValidation !== endRowValidation) messages.push(endRowValidation)
  if (range.value.startRow > range.value.endRow)
    messages.push('The values are switched. Please correct the input')
  console.log(messages)
  return messages.filter((x) => !!x).join('. ')
})
const disableNextStep = computed(() => !!rowInputErrorMessage.value)
</script>

<style scoped lang="scss">
.row-selection {
  height: 100%;
  width: 100%;
  overflow-y: visible; // the page can scroll
  display: flex;
  flex-direction: column;
}

.fields {
  margin-bottom: 2em;
  display: flex;
  column-gap: $space-elements;
}

.row-field {
  display: grid;
  grid-template-rows: auto 0.1rem;
  // a third column for large error messages
  grid-template-columns: auto 1fr;
  column-gap: $space-component-s;
  max-width: 50%;
  justify-content: start;

  :deep(.v-messages) {
    grid-column: 1 / -1;
    position: relative;
    top: .75rem;
  }

  :deep(.v-alert__content) {
    @extend %inline-ellipsis;
  }
}
</style>
