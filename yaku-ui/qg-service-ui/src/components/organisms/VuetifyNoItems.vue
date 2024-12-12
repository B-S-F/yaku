<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="empty-state" data-cy="empty-view">
    <div class="content">
      <slot name="title" />
      <VuetifyEmptyState ref="svgRef" :label="label" :labelX="labelX" />
      <div ref="slotParentRef" class="svg-floor-position">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDebounceFn, useElementBounding } from '@vueuse/core'

defineProps<{
  label?: string
  labelX?: number
}>()

const svgRef = ref()
const floor = computed(() => svgRef.value?.floorRef)
const slotParentRef = ref<HTMLDivElement>()
const xF = ref<string>('0px'),
  yF = ref<string>('0px'),
  widthF = ref<string>('0px'),
  heightF = ref<string>('0px')

const setButtonPosition = () => {
  const { x, y, width, height } = useElementBounding(floor.value)
  xF.value = x.value + 'px'
  yF.value = y.value + 'px'
  widthF.value = width.value + 'px'
  heightF.value = height.value + 'px'
}

watch(floor, () => {
  setButtonPosition()
})
const debouncedFn = useDebounceFn(setButtonPosition, 100)
window.addEventListener('resize', debouncedFn)
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: $spacing-32;
  padding: $padding-component-l;
  height: 100%;

  svg {
    height: 100%;
    width: 100%;
  }

  .svg-floor-position {
    position: fixed;
    width: v-bind(widthF);
    height: v-bind(heightF);
    left: v-bind(xF);
    top: v-bind(yF);

    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
