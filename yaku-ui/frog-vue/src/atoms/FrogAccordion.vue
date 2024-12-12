<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-expansion-panels v-model="panel" variant="accordion">
    <v-expansion-panel :tag="tag ?? 'div'" :readonly="!openable" :rounded="0" :elevation="5">
      <v-expansion-panel-title :disabled="!clickable" :class="small ? 'small' : ''">
        <slot name="headline">
          {{ headline }}
        </slot>
        <template #actions="{ expanded }">
          <v-btn variant="text" :ripple="false" :disabled="!openable">
            <v-icon :icon="!expanded ? '$expand' : '$collapse'" @click="toggleAccordion" />
          </v-btn>
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <slot name="content">
          {{ content }}
        </slot>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

type AccordionProps = {
  /** set the accordion to open first but let the component handle the internal state afterwards */
  initialOpen?: boolean
  open?: boolean
  /** set if the accordion can be opened or not */
  openable?: boolean
  tag?: string
  headline?: string
  buttonLabel?: string
  content?: string
  small?: boolean
  arrowUpTooltip?: string
  arrowDownTooltip?: string
  clickable?: boolean
}

const props = withDefaults(defineProps<AccordionProps>(), {
  openable: true,
  clickable: true,
})

const emit = defineEmits<(e: 'update:open', newVal: boolean) => void>()

const isOpen = ref(props.openable && props.initialOpen)
const panel = ref<number[]>(isOpen.value ? [0] : [])
const toggleAccordion = () => {
  isOpen.value = props.openable ? !isOpen.value : false
  panel.value = !isOpen.value ? [0] : []
}
watch(isOpen, () => {
  emit('update:open', isOpen.value)
})
</script>

<style scoped lang="scss">
.small {
  font-size: 1rem;
}
</style>
