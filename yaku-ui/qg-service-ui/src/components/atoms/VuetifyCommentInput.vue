<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="comment-input bg-grey-lighten-2 text-grey">
    <textarea ref="textarea" v-model="input" class="comment-input-textarea" :placeholder="placeholder"
      :disabled="disabled" @keydown="onKeydown" @input="onTextInput" />
    <div class="-mirror-no-display" />
    <VuetifyCommentSuggestionsBox v-if="useReleaseEmails" :options="filteredSuggestions" :selected-index="selectedIndex"
      :target="textarea" :pos="cursorPos" @select-suggestion="onSelectSuggestion" />
    <FrogButton integrated icon="mdi-close" class="comment-input__button comment-input__button--clear"
      :disabled="!isReplying && !input?.length" @click="handleCloseInput" />
    <FrogButton integrated icon="mdi-send-variant-outline" class="comment-input__button comment-input__button--send"
      :disabled="disabled || !input?.length" @click="handleSendComment(input)" />
  </div>
</template>
<script setup lang="ts">
import { useEventListener, useTextareaAutosize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import useFeatureFlags from '~/composables/useFeatureFlags'
import useNamespaceUsersStore from '~/store/useNamesapceUsersStore'
import VuetifyCommentSuggestionsBox from '../molecules/VuetifyCommentSuggestionsBox.vue'

withDefaults(
  defineProps<{
    isReplying?: boolean
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    isReplying: false,
  },
)

const emit = defineEmits<{
  (e: 'send', comment: string): void
  // should not do
  (e: 'reset'): void
  (e: 'close'): void
}>()

const { textarea, input } = useTextareaAutosize()
const handleSendComment = (msg: string) => {
  emit('send', msg)
  nextTick(() => (input.value = ''))
}

const handleCloseInput = () => {
  input.value = ''
  emit('close')
}

/**
 * COMMENT @ Mentions
 */
const { useReleaseEmails } = useFeatureFlags()
const namespaceUsersStore = useNamespaceUsersStore()
const { users: namespaceUsers } = storeToRefs(namespaceUsersStore)
const selectedIndex = ref<number>(-1)

/** Fetch users when clicked inside the comment input */
const cleanUp = useEventListener(textarea, 'mousedown', async () => {
  if (!useReleaseEmails) return
  await namespaceUsersStore.fetchUsers()
})
onUnmounted(() => cleanUp)

/** Press or select a suggestion from the list and attach the content to textarea */
const onSelectSuggestion = (e: number) => {
  if (e === -1) return
  const selectedOption = filteredSuggestions.value[e]
  const lastIndexOfAt = input.value.lastIndexOf('@')
  input.value =
    input.value.slice(0, lastIndexOfAt) + '@' + selectedOption.username + ' '
  selectedIndex.value = -1
  textarea.value?.focus()
}
/** Reactive list for the available suggestions based on input text */
const filteredSuggestions = computed(() => {
  if (!useReleaseEmails) return []
  const lastIdxOfAt = input.value ? input.value.lastIndexOf('@') : -1
  if (lastIdxOfAt === -1 || !namespaceUsers.value.length) return []
  const query = input.value.slice(lastIdxOfAt + 1).toLowerCase()
  return namespaceUsers.value.filter((o) => {
    const usernameRoot = o.username?.split('@')[0]
    return (
      usernameRoot.toLowerCase().includes(query) ||
      o.displayName.toLowerCase().includes(query)
    )
  })
})

const cursorPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })

watch(filteredSuggestions, (ch) => {
  if (ch && ch.length) {
    const pos = cursorCoordinates()
    if (pos) {
      cursorPos.value.x = pos.x
      cursorPos.value.y = pos.y
    }
  }
})

/** Reset selection with every new input */
const onTextInput = () => {
  if (!useReleaseEmails) return
  selectedIndex.value = -1
}

/** Event handler to detect up & down & Enter key presses while in the text area  */
const onKeydown = (e: KeyboardEvent) => {
  if (!useReleaseEmails) return
  if (filteredSuggestions.value.length <= 0) return
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    scrollList('up')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    scrollList('down')
  } else if (e.key === 'Enter' && selectedIndex.value !== -1) {
    e.preventDefault()
    onSelectSuggestion(selectedIndex.value)
  }
}

const scrollList = (dir: 'up' | 'down') => {
  const suggestionBox = document.querySelector('ul.comment-suggestions-box')
  const listItems = document.querySelectorAll('ul.comment-suggestions-box li')

  const itemHeight = 48
  const visible = 3.5
  const containerHeight = visible * itemHeight

  if (suggestionBox) {
    let newIndex = selectedIndex.value + (dir === 'up' ? -1 : 1)

    // Ensure circular navigation
    if (newIndex < 0) newIndex = listItems.length - 1
    if (newIndex >= listItems.length) newIndex = 0

    // Check if scrolling is needed
    const currentScrollTop = suggestionBox.scrollTop
    const selectedTop = newIndex * itemHeight
    const selectedBottom = (newIndex + 1) * itemHeight

    if (selectedTop < currentScrollTop) {
      // Scroll up if the new selected item is above the visible area
      suggestionBox.scrollTop = selectedTop
    } else if (selectedBottom > currentScrollTop + containerHeight) {
      // Scroll down if the new selected item is below the visible area
      suggestionBox.scrollTop = selectedBottom - containerHeight
    }
    // If the new selected item is already visible, don't scroll
    // Update the selected index
    selectedIndex.value = newIndex
    // Update classes for all items
    listItems.forEach((i, idx) => {
      if (idx === selectedIndex.value) i.classList.add('-selected')
      else i.classList.remove('-selected')
    })
  }
}

/**
 * Reference: https://phuoc.ng/collection/mirror-a-text-area/calculate-the-coordinates-of-the-current-cursor-in-a-text-area/
 */
const cursorCoordinates = () => {
  const cloneEl = document.querySelector('.-mirror-no-display')
  if (textarea?.value && cloneEl) {
    cloneEl.textContent = textarea?.value?.value

    const cursorPos = textarea?.value?.selectionStart
    const textUpToCursor = input?.value?.substring(0, cursorPos)
    const textAfterCursor = input?.value?.substring(cursorPos)

    const upToCursorTxtNode = document.createTextNode(textUpToCursor)
    const afterCursorTxtNode = document.createTextNode(textAfterCursor)
    const caretEl = document.createElement('span')
    caretEl.innerHTML = '&nbsp;'
    cloneEl.innerHTML = ''
    cloneEl.append(upToCursorTxtNode, caretEl, afterCursorTxtNode)
    const txtAreaBound = textarea?.value.getBoundingClientRect()
    const caretBound = caretEl.getBoundingClientRect()
    const res = {
      x: caretBound.x - txtAreaBound.x,
      y: caretBound.y - txtAreaBound.x,
    }
    return res
  }
}
</script>

<style scoped lang="scss">
@use '../../styles/helpers.scss' as *;
@use '../../styles/mixins/flex.scss' as Flex;
@use '../../styles/abstract' as *;

.comment-input {
  position: relative;

  &__button {
    position: absolute;
    bottom: 0;

    &--clear {
      right: 3rem;
    }

    &--send {
      right: 0;
    }
  }

  .-no-display {
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
    color: transparent;
  }
}


.comment-input-textarea {
  position: relative;
}

textarea,
.-mirror-no-display {
  resize: none;
  -ms-overflow-style: none;
  scrollbar-width: none;
  //background-color: #EEEEEE; // rgb(var(--v-theme-primary)); // grey-lighten-3
  border: 0;
  border-bottom: rem(1px) solid rgb(var(--v-border-color)); // var(--neutral__enabled__front__default);
  //color: rgb(var(--v-theme-on-primary)); // var(--neutral__enabled__front__default);

  padding: rem(12px) rem(16px) rem(12px) rem(16px);
  padding-right: 6rem;
  width: 100%;
  resize: none;
  line-height: 1.5;
  vertical-align: top;

  &::placeholder {
    opacity: 0.5;
  }

  &:hover {
    background-color: #E0E0E0; // rgb(var(--v-theme-primary), var(--v-hover-opacity)); // grey-lighten-2 //FIXME var(--neutral__enabled__fill__hovered);
  }

  &:active {
    background-color: #BDBDBD; // rgb(var(--v-theme-primary), var(--v-activated-opacity)); //grey-lighten-1 //FIXME var(--neutral__enabled__fill__pressed);
  }

  &:focus {
    background-color: #BBDEFB; // rgb(var(--v-theme-primary), var(--v-focus-opacity)); // blue-lighten-4 //FIXME var(--neutral__focused__fill__default);
    border-bottom-color: rgb(var(--v-border-color), var(--v-focus-opacity)); //FIXME var(--neutral__focused__front__default);
    outline: none;
  }

  &:disabled {
    border-bottom-color: rgb(var(--v-border-color), var(--v-disabled-opacity)); // grey-darken-1//FIXME var(--neutral__disabled__front__default);
    pointer-events: none;

    +label::before {
      color: rgb(var(--v-theme-on-primary-color), var(--v-disabled-opacity)); // grey-darken-1//FIXME var(--neutral__disabled__front__default);
    }

    &::placeholder {
      color: rgb(var(--v-theme-on-primary-color), var(--v-disabled-opacity)); // grey-darken-1//FIXME var(--neutral__disabled__front__default);
    }
  }
}

textarea::-webkit-scrollbar {
  display: none;
}

textarea.comment-input-textarea {
  position: relative;
}

.-mirror-no-display {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
