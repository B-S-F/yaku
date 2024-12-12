<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <button v-bind="$attrs" :id="id" ref="triggerRef" class="a-chip trigger" role="listbox"
    :disabled="disabled || options.length === 0" @keyup.enter.self="onToggle" @keyup.space.self="onToggle"
    @mouseup="onToggle">
    <slot name="value">
      <FrogIcon v-if="icon" class="label-icon" :icon="icon" />
      <VuetifyStack v-slot="{ visibleClass }">
        <span :class="visibleClass">{{ modelValue?.label ?? label }}</span>
        <span>{{ longestOption }}</span>
      </VuetifyStack>
    </slot>
    <FrogIcon class="icon" :icon="open ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
  </button>
  <!-- <div tabindex="1" @keyup.space="emit('update:open', false)" @keyup.down="onFocusNext" /> -->
  <Teleport to="#app">
    <dialog ref="dialogRef" :open="open" class="dialog-reset -floating-shadow-s" @focusout="onFocusOut">
      <FrogButton v-if="clear" class="clear" :disabled="!modelValue" tertiary icon="mdi-restart"
        @mouseup="onSelect(undefined)" @keyup.enter.self="onSelect(undefined)" @keyup.space.self="onSelect(undefined)"
        @keyup.down="onFocusNext" @keyup.up="onFocusPrevious">
        Clear
      </FrogButton>
      <ul class="semantic-list">
        <li v-for="option in options" :key="option.value">
          <button class="option" :class="{ 'selected': option.value === modelValue?.value }" @mouseup="onSelect(option)"
            @keyup.enter.stop="onSelect(option)" @keyup.down="onFocusNext" @keyup.up="onFocusPrevious">
            {{ option.label }}
          </button>
        </li>
      </ul>
    </dialog>
    <div tabindex="0" />
  </Teleport>
</template>

<script setup lang="ts">
import {
  onClickOutside,
  useElementBounding,
  useEventListener,
} from '@vueuse/core'
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import type { SelectItem } from '~/types'
import { getFocusableTreeWalker, isFocusable } from '~/utils/focus'

const props = defineProps<{
  open: boolean
  id: string
  modelValue: SelectItem<string | number> | undefined
  disabled?: boolean
  icon?: string
  label?: string
  options: Readonly<SelectItem<string | number>[]>
  clear?: boolean
  dynamicWidth?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:model-value', val: SelectItem<string | number> | undefined): void
  (e: 'update:open', val: boolean): void
}>()

const triggerRef = ref<HTMLButtonElement>()
const dialogRef = ref<HTMLDialogElement>()
watchEffect(() => {
  if (props.open) onOpen()
  else {
    dialogRef.value?.close()
  }
})
onClickOutside(
  dialogRef,
  () => {
    if (props.open) emit('update:open', false)
  },
  { ignore: [triggerRef] },
)
useEventListener('keydown', (e) => {
  if (props.open && e.code === 'Escape') {
    e.preventDefault() // avoid exiting full screen mode on safari
    emit('update:open', false)
  }
})

const onToggle = () => emit('update:open', !props.open)
const onOpen = async () => {
  dialogRef.value?.showModal()
  update() // update the dropdown content position
  await nextTick()
  const selectedOptionIndex = props.options.findIndex(
    (o) => o.value === props.modelValue?.value,
  )
  // 0 is assumed to be the clear button, then starting at 1 with the first option
  if (selectedOptionIndex > -1) {
    // TODO: replace it with role="option" if using aria someday
    const node = dialogRef.value
      ?.querySelectorAll(`[tabindex="0"]`)
      .item(selectedOptionIndex) as HTMLElement | undefined
    node?.focus()
  }
}

const onSelect = (option: (typeof props)['modelValue']) => {
  emit('update:model-value', option)
  emit('update:open', false)
}

// -----------------
//  Dialog position
// -----------------
const { top, left, height, width, right, update } =
  useElementBounding(triggerRef)
watch([top, left], update)
const dialogMinWidth = computed(() => `${width.value}px`)
const dialogTop = computed(() => `${top.value + height.value}px`)
const dialogRight = computed(() => `${right.value - 16}px`)

const longestOption = computed(() =>
  props.dynamicWidth
    ? ''
    : props.options.reduce(
        (acc, option) =>
          acc.length < option.label.length ? option.label : acc,
        '',
      ),
)

// ------------------------
//  Keyboard accessibility
//  https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboardinteraction
// ------------------------

const focusFirstElement = () => {
  if (!dialogRef.value) return
  ;(
    getFocusableTreeWalker(dialogRef.value).firstChild() as HTMLElement
  )?.focus()
}
const focusLastElement = () => {
  if (!dialogRef.value) return
  ;(getFocusableTreeWalker(dialogRef.value).lastChild() as HTMLElement)?.focus()
}

const focusNextChild = (node: HTMLElement) => {
  const nextChild = node.querySelector('[tabindex]')
  if (nextChild) {
    ;(nextChild as HTMLElement).focus()
  }
  return !!nextChild
}

/** for Firefox only at the moment */
const onFocusOut = (e: FocusEvent) => {
  const { relatedTarget, target, currentTarget } = e

  if (!dialogRef.value) return

  const isInNode =
    (currentTarget as HTMLElement)?.contains(relatedTarget as HTMLElement) ??
    false
  // we are still in the listbox so everything is fine.
  if (isInNode) return

  const isFocusLostOnFirstElement =
    (target as HTMLElement) ===
    (getFocusableTreeWalker(dialogRef.value).firstChild() as HTMLElement)
  if (isFocusLostOnFirstElement) {
    focusLastElement()
  } else {
    focusFirstElement()
  }
}

// ---- Arrow accessibility ----
// TODO: make it more robust
const onFocusNext = (e: Event) => {
  const isDone = focusNextChild(e.currentTarget as HTMLElement)
  if (isDone) return

  const nextSibling = (e.currentTarget as HTMLElement)
    .nextElementSibling as HTMLElement | null
  if (nextSibling === null) focusFirstElement()
  else if (isFocusable(nextSibling)) nextSibling.focus()
  else {
    const result = focusNextChild(nextSibling)
    if (!result) focusFirstElement()
  }
}

// TODO: make it more robust
const onFocusPrevious = (e: Event) => {
  const previousSibling = (e.currentTarget as HTMLElement)
    .previousElementSibling as HTMLElement | null

  if (isFocusable(previousSibling)) {
    previousSibling.focus()
    return
  }

  const parent = (e.currentTarget as HTMLElement).parentNode as HTMLElement
  if (parent?.tagName === 'DIALOG') {
    focusLastElement()
    return
  }

  const parentPrevious = parent?.previousSibling as HTMLElement | undefined
  if (isFocusable(parentPrevious)) {
    parentPrevious.focus()
  } else {
    focusLastElement()
  }
}
</script>

<style scoped lang="scss">
.trigger {
  border: 0;
  display: flex;
  column-gap: $space-component-m;
  padding: $padding-component-xxs 6px $padding-component-xxs $padding-component-m;

  &:disabled {
    cursor: initial;
    color: var(--neutral__disabled__front__default);
    background-color: var(--neutral__disabled__fill__default);
  }
}

dialog {
  min-width: v-bind(dialogMinWidth);
  position: fixed;
  top: v-bind(dialogTop);
  left: v-bind(dialogRight);
  transform: translateX(-100%);
}

.clear {
  display: flex;
  column-gap: $space-component-s;
  padding: .75rem 0.75rem 0.75rem 1rem;

  :deep(.v-btn__content),
  :deep(.v-icon) {
    padding: $spacing-0;
  }
}

.option {
  padding: .75rem 0.75rem 0.75rem 1rem;
  width: 100%;
  text-align: start;

  // button reset
  cursor: pointer;
  background-color: var(--background);
  outline: 0;

  &:hover {
    background-color: var(--plain__enabled__fill__hovered)
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
}

// Handle the focus state
.clear,
.option {
  border: 1px dotted transparent;

  /** the frok dotted will be used in this dropdown */
  &:focus {
    outline: 0;
  }

  &:focus-visible {
    border-color: currentColor;
  }
}
</style>
