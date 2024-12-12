<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <ul ref="selectOptionRef" class="semantic-list select-option">
    <li v-for="option in options" :key="option.id">
      <button class="option bg-grey-lighten-3" :class="{ 'selected': option.id === modelValue?.id }" :icon="option.icon"
        @mouseup="onSelect(option)" @keyup.space.stop="onSelect(option)" @keyup.enter.stop="onSelect(option)"
        @keyup.down="onFocusNext" @keyup.up="onFocusPrevious">
        <FrogIcon v-if="option.icon" :icon="option.icon" />
        <span>{{ option.label }}</span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getFocusableTreeWalker, isFocusable } from '~/utils/focus'

type OptionItem = {
  id: string
  icon?: string
  label?: string
}

defineProps<{
  modelValue?: OptionItem
  options: OptionItem[]
}>()

const emit = defineEmits<{
  (e: 'update:model-value', val: OptionItem | undefined): void
  (e: 'select', action: OptionItem): void
}>()

const onSelect = (option: OptionItem) => {
  emit('update:model-value', option)
  emit('select', option)
}

const selectOptionRef = ref<HTMLOListElement>()

const focusFirstElement = () => {
  if (!selectOptionRef.value) return
  ;(
    getFocusableTreeWalker(selectOptionRef.value).firstChild() as HTMLElement
  )?.focus()
}
const focusLastElement = () => {
  if (!selectOptionRef.value) return
  ;(
    getFocusableTreeWalker(selectOptionRef.value).lastChild() as HTMLElement
  )?.focus()
}

const onFocusNext = (e: Event) => {
  const nextSibling = (e.currentTarget as HTMLElement).parentElement
    ?.nextElementSibling?.firstChild as HTMLElement | null | undefined
  if (!nextSibling) focusFirstElement()
  else if (isFocusable(nextSibling)) nextSibling.focus()
}

const onFocusPrevious = (e: Event) => {
  const previousSibling = (e.currentTarget as HTMLElement).parentElement
    ?.previousElementSibling?.firstChild as HTMLElement | null | undefined

  if (isFocusable(previousSibling)) {
    previousSibling.focus()
    return
  }

  focusLastElement()
}
</script>

<style scoped lang="scss">
.option {
  padding: .75rem 0.75rem 0.75rem 1rem;
  width: 100%;
  text-align: start;

  display: flex;
  column-gap: $space-component-s;

  // button reset
  cursor: pointer;
  outline: 0;
  border: 0;

  &:hover {
    background-color: var(--plain__enabled__fill__hovered);
  }

  &:active {
    background-color: var(--plain__enabled__fill__pressed);
  }

  &.selected {
    background-color: var(--major-accent__enabled__fill__default);
    color: var(--major-accent__enabled__front__default);

    &:hover {
      background-color: var(--major-signal-neutral__enabled__fill__hovered)
    }

    &:active {
      background-color: var(--major-signal-neutral__enabled__fill__pressed);
    }
  }

  span {
    white-space: nowrap;
  }
}

.option {
  border: $focus-width $focus-style transparent;

  /** the frok dotted will be used in this dropdown */
  &:focus {
    outline: 0;
  }

  &:focus-visible {
    border-color: $focus-color;
  }
}
</style>
