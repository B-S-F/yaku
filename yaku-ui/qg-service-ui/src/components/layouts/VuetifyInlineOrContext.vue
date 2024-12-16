<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="containerRef" class="inline-or-context">
    <div ref="itemsRef" class="items">
      <slot name="default" />
    </div>
    <FrogPopover :class="{ 'out': overflowingItemCount < 1 }" attached triggerOnHover tooltipAlike
      arrowPlacementClass="-without-arrow-top" class="menu-button" label="More Actions">
      <FrogButton v-on-click-outside="onClickOutsideHandler" tertiary icon="mdi-dots-vertical" data-cy="menu-button"
        @click.prevent="toggleContextMenu" />
    </FrogPopover>
    <ul v-show="showContextMenu" ref="contextMenuRef" class="bg-background context-menu semantic-list elevation-1">
      <slot name="secondary-actions" />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { vOnClickOutside } from '@vueuse/components'

const showContextMenu = ref(false)
const toggleContextMenu = () => {
  showContextMenu.value = !showContextMenu.value
}
const onClickOutsideHandler = () => {
  if (showContextMenu.value) {
    showContextMenu.value = false
  }
}

const containerRef = ref<HTMLDivElement>()
const itemsRef = ref<HTMLDivElement>()
const contextMenuRef = ref<HTMLUListElement>()
const hidingClass = 'out'
const scrollWidth = ref(0)
const overflowingItemCount = ref(0)

const updateOverflowingItemCount = () => {
  const containerEl = containerRef.value
  const itemsEl = itemsRef.value
  const contextMenuEl = contextMenuRef.value

  if (!containerEl || !itemsEl) return

  const elementCount = itemsEl.children.length

  if (overflowingItemCount.value < 1) {
    scrollWidth.value = itemsEl.scrollWidth
  }

  const clientWidth = containerEl.clientWidth
  const childWidth = (scrollWidth.value - 12) / elementCount

  const overflowOf = scrollWidth.value - clientWidth
  const overflowingItems = Math.ceil(overflowOf / childWidth)

  overflowingItemCount.value =
    overflowingItems > 0 && overflowingItems <= elementCount
      ? overflowingItems + 1
      : overflowingItems

  for (
    let i = elementCount - overflowingItemCount.value;
    i < elementCount;
    i++
  ) {
    itemsEl.children[i]?.classList.add(hidingClass)
    contextMenuEl?.children[i]?.classList.remove(hidingClass)
  }

  for (let i = 0; i < elementCount - overflowingItemCount.value; i++) {
    contextMenuEl?.children[i]?.classList.add(hidingClass)
    itemsEl.children[i]?.classList.remove(hidingClass)
  }
}
const debouncedUpdate = useDebounceFn(updateOverflowingItemCount, 250)

onMounted(debouncedUpdate)
useEventListener('resize', debouncedUpdate)
</script>

<style scoped lang="scss">
.inline-or-context {
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  flex-flow: row nowrap;
  align-items: baseline;
}

.items {
  overflow: hidden;
  display: flex;
  flex-flow: row nowrap;
  column-gap: $space-component-buttonGroup;
  padding: $padding-component-xs $padding-component-s;
}

.items+ :not(.out) {
  margin-left: $space-component-buttonGroup;
}

.context-menu {
  position: absolute;
  top: var(--context-menu-y, 100%);
  right: $spacing-16;
  z-index: 2;
}

.menu-button {
  padding: $padding-component-m $padding-component-m $padding-component-m 0;
}

.popover-container.out {
  display: none;
}

// for the slot elements
:deep(.out) {
  display: none;
}
</style>
