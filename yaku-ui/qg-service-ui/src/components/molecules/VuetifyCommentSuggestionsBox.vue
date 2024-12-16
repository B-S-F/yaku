<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <ul v-if="options && options.length > 0" class="comment-suggestions-box semantic-list" role="listbox">
    <li v-for="(option, idx) in options" :key="option.id" :class="{ '-selected': idx === selectedIndex }" role="option"
      :title="option?.displayName ?? option?.id" @click.prevent="$emit('select-suggestion', idx)">
      <span class="text-black">
        {{ displayUserName(option?.username) }}
        <small v-if="!option?.displayName?.includes('undefined')">
          {{ option?.displayName }}
        </small>
      </span>
    </li>
  </ul>
</template>
<script setup lang="ts">
import { computed } from 'vue'

type suggestionOption = {
  id: string
  username: string
  displayName?: string
}
const props = withDefaults(
  defineProps<{
    options: suggestionOption[]
    selectedIndex: number
    limit?: number
    target?: HTMLTextAreaElement
    pos: { x: number; y: number }
  }>(),
  {
    limit: 3,
  },
)

defineEmits<(e: 'select-suggestion', idx: number) => void>()

const displayUserName = (u: string) => {
  const [beforeAt] = u.split('@')
  return beforeAt ?? u
}

const top = computed(() => props.pos.y)
const left = computed(() => props.pos.x)
</script>
<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;
@use '../../styles/abstract' as *;

.comment-suggestions-box {
  width: 320px;
  position: absolute;
  background-color: rgb(var(--v-theme-background));
  top: v-bind(top);
  left: v-bind(left);
  z-index: 99999999999999;
  max-height: 168px;
  /** 48*3 + 24 (1/2) ~~~ 3 and 1/2 */
  overflow-y: auto;

  li {
    height: 48px;
    @include Flex.flexbox($justify: center);
    cursor: pointer;

    span {
      width: 288px;
      @extend %inline-ellipsis;
      font-weight: 700;

      small {
        font-weight: 400;
      }
    }

    &:hover {
      background: #EEEEEE; // rgb(var(--v-theme-primary), var(--v-hover-opacity));
    }

    &.-selected {
      background: #1976D2; // rgb(var(--v-theme-primary), var(--v-selected-opacity));
    }
  }
}
</style>
