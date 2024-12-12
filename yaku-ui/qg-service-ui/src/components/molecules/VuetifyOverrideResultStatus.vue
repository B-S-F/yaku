<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="triggerRef" class="m-approver-status -secondary" @click="handleToggleOpenDialog">
    <div class="left">
      <VuetifyStatusPill rounded v-bind="statusPill" :color="statusPill.color" tooltip="Approver state is pending."
        :showTooltip="false" :label="undefined">
        <template #icon>
          <FrogIcon v-if="!statusPill.iconComponent" :icon="statusPill.icon" />
          <component :is="statusPill.iconComponent" v-else />
        </template>
      </VuetifyStatusPill>
      <span class="highlight -size-s">{{ statusOption ?? 'Select manual status' }}</span>
    </div>
    <div class="right">
      <FrogButton integrated :icon="open ? 'mdi-chevron-up' : 'mdi-chevron-down'" @keyup.enter.self="handleToggleOpenDialog"
        @keyup.space.self="handleToggleOpenDialog" @mouseup="handleToggleOpenDialog" @click="handleToggleOpenDialog" />
    </div>
    <Teleport to="#app">
      <dialog ref="dialogRef" :open="open" class="dialog-reset -floating-shadow-s" @focusout="onFocusOut">
        <ul class="semantic-list">
          <li v-for="option in statusOptions" :key="option.key">
            <button class="a-button option bg-background"
              :class="{ 'selected': option.key === selectedOption && option.key !== props.status }"
              :disabled="option.key === props.status" @mouseup="onSelect(option.key)"
              @keyup.enter.stop="onSelect(option.key)" @keyup.down="onFocusNext" @keyup.up="onFocusPrevious">
              <VuetifyStatusPill rounded v-bind="getResultPillFromStatus(option.key, true)"
                :color="getResultPillFromStatus(option.key, true).color" tooltip="Approver state is pending."
                :showTooltip="false" :label="undefined">
                <template #icon>
                  <FrogIcon v-if="!getResultPillFromStatus(option.key, true).iconComponent"
                    :icon="getResultPillFromStatus(option.key, true).icon ?? ''" />
                  <component :is="getResultPillFromStatus(option.key, true).iconComponent" v-else />
                </template>
              </VuetifyStatusPill>
              <span class="highlight -size-s">{{ option.value }}</span>
            </button>
          </li>
        </ul>
      </dialog>
      <div tabindex="0" />
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import { getResultPillFromStatus } from '~/helpers'
import {
  onClickOutside,
  useElementBounding,
  useEventListener,
} from '@vueuse/core'
import { getFocusableTreeWalker, isFocusable } from '~/utils/focus'

const props = defineProps<{
  status: string | undefined
}>()

const emit = defineEmits<(e: 'update:status', value: string) => void>()

const open = ref<boolean>(false)

const statusPill = computed(() =>
  getResultPillFromStatus(<string>selectedOption.value, true),
)
const statusOptions = [
  {
    key: 'GREEN',
    value: 'Passed',
  },
  {
    key: 'YELLOW',
    value: 'Passed with warning',
  },
  {
    key: 'RED',
    value: 'Not Passed',
  },
]
const statusOption = computed(
  () =>
    statusOptions.find((option) => option.key === selectedOption.value)?.value,
)
const selectedOption = ref<string | undefined>(props.status)

const triggerRef = ref<HTMLButtonElement>()
const dialogRef = ref<HTMLDialogElement>()
// -----------------
//  Dialog position
// -----------------
const { top, left, height, width, right, update } =
  useElementBounding(triggerRef)
watch([top, left], update)
const dialogMinWidth = computed(() => `${width.value}px`)
const dialogTop = computed(() => `${top.value + height.value}px`)
const dialogRight = computed(() => `${right.value}px`)
const handleToggleOpenDialog = () => {
  open.value = !open.value
}
onClickOutside(
  dialogRef,
  () => {
    if (open.value) {
      open.value = false
    }
  },
  { ignore: [triggerRef] },
)
useEventListener('keydown', (e) => {
  if (open.value && e.code === 'Escape') {
    e.preventDefault() // avoid exiting full screen mode on safari
  }
})

watchEffect(() => {
  if (open.value) onOpenDialog()
  else {
    dialogRef.value?.close()
  }
})

const onOpenDialog = async () => {
  dialogRef.value?.showModal()
  update() // update the dropdown content position
  await nextTick()
  const selectedOptionIndex = statusOptions.findIndex(
    (o) => o.value === selectedOption.value,
  )
  // 0 is assumed to be the clear button, then starting at 1 with the first option
  if (selectedOptionIndex > 0) {
    // TODO: replace it with role="option" if using aria someday
    const node = dialogRef.value
      ?.querySelectorAll(`[tabindex="0"]`)
      .item(selectedOptionIndex) as HTMLElement | undefined
    node?.focus()
  }
}

const onSelect = (value: string) => {
  selectedOption.value = value
  open.value = false
  emit('update:status', value)
}

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

const focusNextChild = (node: HTMLElement) => {
  const nextChild = node.querySelector('[tabindex]')
  if (nextChild) {
    ;(nextChild as HTMLElement).focus()
  }
  return !!nextChild
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
@use "../../styles/tokens.scss" as *;

.m-approver-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-12 $spacing-12;
  height: 56px;
  cursor: pointer;

  .left {
    display: flex;
    align-items: center;
    column-gap: $space-component-m;

    span {
      text-transform: capitalize;
    }
  }
}

dialog {
  min-width: v-bind(dialogMinWidth);
  position: fixed;
  top: v-bind(dialogTop);
  left: v-bind(dialogRight);
  transform: translateX(-100%);
}

.option {
  padding: .75rem 0.75rem 0.75rem 1rem;
  width: 100%;
  text-align: start;

  span {
    text-transform: capitalize;
  }

  // button reset
  cursor: pointer;
  outline: 0;

  display: flex;
  align-items: center;

  column-gap: $space-component-m;

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
</style>
