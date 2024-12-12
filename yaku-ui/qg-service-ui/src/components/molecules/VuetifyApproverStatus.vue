<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="triggerRef" class="m-approver-status bg-grey-lighten-3" :class="{
    '-current-user': currentUser && !closed
  }" @click="!closed ? handleToggleOpenDialog() : null">
    <div class="left">
      <VuetifyStatusPill rounded v-bind="getVuetifyReleaseStatusPillInfo(localState)"
        :color="getVuetifyReleaseStatusPillInfo(localState).color" tooltip="Approver state is pending."
        :showTooltip="false" :label="undefined">
        <template #icon>
          <FrogIcon v-if="!getVuetifyReleaseStatusPillInfo(localState).iconComponent"
            :icon="getVuetifyReleaseStatusPillInfo(localState).icon ?? ''" />
          <component :is="getVuetifyReleaseStatusPillInfo(localState).iconComponent" v-else />
        </template>
      </VuetifyStatusPill>
      <span class="highlighted text-sm-caption font-weight-bold">{{ localState }}</span>
    </div>
    <div class="right">
      <FrogButton v-if="!closed && currentUser" integrated
        :icon="!openStatusSelection ? 'mdi-pencil-outline' : open ? 'up' : 'down'"
        @keyup.enter.self="handleToggleOpenDialog" @keyup.space.self="handleToggleOpenDialog"
        @mouseup="handleToggleOpenDialog" @click="handleToggleOpenDialog" />
    </div>
    <Teleport to="#app">
      <dialog v-if="openStatusSelection" ref="dialogRef" class="dialog-reset -floating-shadow-s" @focusout="onFocusOut">
        <ul class="semantic-list">
          <li v-for="option in statusOptions" :key="option.value">
            <button class="a-button option" :class="{ 'selected': option.value === selectedOption }"
              :disabled="option.value === props.state" @mouseup="onSelect(option.value)"
              @keyup.enter.stop="onSelect(option.value)" @keyup.down="onFocusNext" @keyup.up="onFocusPrevious">
              <VuetifyStatusPill rounded v-bind="getVuetifyReleaseStatusPillInfo(option.value)"
                :color="getVuetifyReleaseStatusPillInfo(option.value).color" tooltip="Approver state is pending."
                :showTooltip="false" :label="undefined">
                <template #icon>
                  <FrogIcon v-if="!getVuetifyReleaseStatusPillInfo(option.value).iconComponent"
                    :icon="getVuetifyReleaseStatusPillInfo(option.value).icon ?? ''" />
                  <component :is="getVuetifyReleaseStatusPillInfo(option.value).iconComponent" v-else />
                </template>
              </VuetifyStatusPill>
              <span class="highlighted text-sm-caption font-weight-bold">{{ option.value }}</span>
            </button>
          </li>
        </ul>
      </dialog>
      <div tabindex="0" />
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import {
  onClickOutside,
  useElementBounding,
  useEventListener,
} from '@vueuse/core'
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import { getVuetifyReleaseStatusPillInfo } from '~/helpers'
import { getFocusableTreeWalker, isFocusable } from '~/utils/focus'

const props = defineProps<{
  state: string
  currentUser?: boolean
  openStatusSelection?: boolean
  closed?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:status', value: string): void
  (e: 'open:dialog'): void
}>()

const open = ref<boolean>(false)

const statusOptions = [
  {
    value: 'pending',
  },
  {
    value: 'approved',
  },
]
const localState = ref<string>(props.state)
const selectedOption = ref<string>()

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
  if (props.currentUser) {
    if (props.openStatusSelection) open.value = !open.value
    else emit('open:dialog')
  }
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
  localState.value = value === 'pending' ? 'pending' : 'approved'
  emit('update:status', localState.value)
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

  &.-current-user {
    cursor: pointer;
  }

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
  background-color: var(--v-theme-background);
  outline: 0;

  display: flex;
  align-items: center;

  column-gap: $space-component-m;

  &:hover {
    background-color: #EEEEEE; // rgb(var(--v-theme-primary), var(--v-hover-opacity)); // grey-lighten-3
  }

  &.selected {
    background-color: #1976D2; // rgb(var(--v-theme-primary), var(--v-selected-opacity)); // blue-darken-2
    color: rgb(var(--v-theme-backgorund));

    &:hover {
      background-color: #1565C0; // rgb(var(--v-theme-secondary), var(--v-hover-opacity)); // blue-darken-3
    }

    &:active {
      background-color: #0D47A1; // rgb(var(--v-theme-secondary), var(--v-active-opacity)); // blue-darken-4 // var(--major-signal-neutral__enabled__fill__pressed);
    }
  }
}
</style>
