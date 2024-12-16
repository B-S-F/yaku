<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <ol class="semantic-list logs">
    <li v-for="(line, i) in sanitizedLogs" :key="i">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="line" />
    </li>
  </ol>
</template>

<script setup lang="ts">
import { parse } from 'ansicolor'
import DOMPurify from 'dompurify'
import { computed } from 'vue'

const props = defineProps<{
  withLineNumber?: boolean
  logs: string[]
}>()

const convertToUnicodeCodePoint = (s: string) =>
  unescape(s.replaceAll('\\u', '%u'))
const removeEscapeCharacters = (s: string) => s.replaceAll(`\\`, '')
const ansiToStyledSpans = (s: string) =>
  parse(s).spans.map(({ css, text }) =>
    css ? `<span style="${css}">${text}</span>` : text,
  )
const merge = (s: string[]): string => s.join('')

const sanitizedLogs = computed(() =>
  props.logs
    .map((l) => l.replaceAll(`\\t`, '    '))
    .map(convertToUnicodeCodePoint)
    .map(ansiToStyledSpans)
    .map(merge)
    .map(removeEscapeCharacters)
    .map(DOMPurify.sanitize),
)
</script>

<style scoped lang="scss">
ol.logs {
  overflow-y: auto;
  padding: 16px 16px 16px 8px;
  margin-bottom: 0;

  li {
    margin-bottom: 0;
    padding-left: 2.75rem;
    min-height: 1.5rem;
    white-space: break-spaces;
    word-wrap: break-word;

    &::before {
      content: counter(item);
      font-weight: 200;
      min-width: 1.75rem;
      display: flex;
      justify-content: end;
    }
  }
}
</style>
