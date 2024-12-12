<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="containerRef" class="list" data-cy="scrollable-list">
    <ol class="semantic-list overview-list" :class="[gap]" data-cy="overview-list">
      <li v-for="item in items" :key="item.id">
        <slot name="item" :item="item" />
      </li>
    </ol>
    <FrogPopover class="to-top" :class="{ 'scrolled': scrolled }" label="Back to top" attached triggerOnHover tooltipAlike
      arrowPlacementClass="-without-arrow-top">
      <FrogButton :secondary="breakpoints.from1210" icon="mdi-arrow-up" data-cy="back-to-top" @click="scrollToTop" />
    </FrogPopover>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string | number }">
import FrogButton from '@B-S-F/frog-vue/src/atoms/FrogButton.vue'
import FrogPopover from '@B-S-F/frog-vue/src/molecules/FrogPopover.vue'
import { useScroll, watchThrottled } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useBreakpoints } from '~/composables/useBreakPoints'

const props = defineProps<{
  items: T[]
  /* the gap value matches spacing token names. Extend it as needed. */
  gap?: 'space-elements'
  throttle?: number
  scrollToTopToggle?: boolean
}>()

const emit = defineEmits<{
  (e: 'bottom'): void
  (e: 'update:scrollToTopToggle', payload: false): void
}>()

const containerRef = ref<HTMLOListElement>()
const { arrivedState, y } = useScroll(containerRef, { offset: { bottom: 100 } })
const scrolled = ref(false)
const breakpoints = useBreakpoints()

/** throttle to avoid to much UI updates while scrolling */
watchThrottled(
  arrivedState,
  (newVal) => {
    if (newVal.bottom) emit('bottom')
  },
  { throttle: props.throttle ?? 0 },
)

watch(arrivedState, (newVal) => {
  scrolled.value = !newVal.top
})
const scrollToTop = () => {
  y.value = 0
}
watch(
  () => props.scrollToTopToggle,
  () => {
    scrollToTop()
    emit('update:scrollToTopToggle', false)
  },
)
</script>

<style scoped lang="scss">
.list {
  overflow-y: auto;
}

.list .semantic-list {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-s;
  background-color: transparent;

  li {
    display: flex;
    flex-direction: column;

    >:slotted(*) {
      flex-grow: 1;
    }
  }

  &.space-elements {
    row-gap: $space-elements;
  }
}

.to-top {
  display: none;
  position: absolute;
  bottom: $spacing-32;
  right: -$spacing-32;
  transform: translateX(100%);

  @media screen and (max-width: $bp-max-1210) {
    right: $spacing-48;
  }

  &.scrolled {
    display: block;
  }
}
</style>
