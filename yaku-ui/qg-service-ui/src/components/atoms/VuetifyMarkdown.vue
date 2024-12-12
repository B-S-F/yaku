<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<!-- eslint-disable vue/no-v-html -->
<template>
    <component :is="tag" v-if="tag">
      <div :title="renderedMarkdown" class="md-content" v-html="renderedMarkdown" />
    </component>
    <VueMarkdown v-else :source="source" :options="{ mdOptions, ...options }" />
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { computed } from 'vue'
import { Options } from 'vue-markdown-render'
import { mdOptions } from '~/utils/getMdRendererOptions'
import VueMarkdown from 'vue-markdown-render'

const props = defineProps<{
  source: string | null | undefined
  options?: Options
  tag?: string
}>()

const renderedMarkdown = computed(() => {
  const md = new MarkdownIt({ ...mdOptions })

  // check if element is inline
  const inlineElements = ['span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  if (props.tag && inlineElements.includes(props.tag)) {
    return props.source ? md.renderInline(props.source) : ''
  }

  // default rendering for block elements
  return props.source ? md.render(props.source) : ''
})
</script>

<style lang="scss">
.md-content {
  li {
    list-style-type: none !important;
  }

  .a-list--dot li:before, ul>li:before {
    top: .45rem;
    width: .4rem;
    height: .4rem;
    margin-left: 6px;
    background-color: #eff1f2; // FIXME: --plain__enabled__front__default
  }

  p {
    margin: 0;
  }
}

.text-overflow > .md-content {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.requirement-heading > .md-content,
.requirement-heading > .md-content * {
  font-size: 1rem !important;
  line-height: 1.5;
}
</style>
