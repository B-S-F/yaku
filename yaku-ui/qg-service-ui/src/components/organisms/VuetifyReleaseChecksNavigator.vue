<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <header :class="{ 'sr-only': semanticHeader }">
    <component :is="headingTag" class="heading -size-l">
      {{ headingLabel }}
    </component>
    <span v-if="headingDesc">{{ headingDesc }}</span>
  </header>
  <ol class="navi-list semantic-list">
    <li v-for="chapter in contentItems" :key="chapter.id">
      <RouterLink class="navi-box" :to="{}" :class="{ 'active': isSelected(chapter) }" @click="toggleOpen(chapter.id)">
        <VuetifyStatusPill v-if="chapter.badge" v-bind="chapter.badge" class="pill -secondary" />
        <div class="navi-header">
          <VuetifyMarkdown tag="span" class="highlight text-overflow" :source="`${chapter.id} ${chapter.name}`" />
          <FrogButton v-if="chapter.requirements.length > 0" integrated
            :icon="areOpen.includes(chapter.id) ? 'up' : 'down'" class="navi-header__button"
            @click.stop.prevent="toggleOpen(chapter.id)" />
        </div>
      </RouterLink>
      <ul v-if="areOpen.includes(chapter.id)" class="semantic-list">
        <li v-for="requirement in chapter.requirements" :key="`${chapter.id}-${requirement.id}`" class="sub-navi-item"
          data-cy="sub-navi-item">
          <h5 class="text">
            <VuetifyMarkdown tag="span" :source="`<span><span class='highlight'>${requirement.id}</span> ${requirement.name} </span>`" />
          </h5>

          <ul v-if="requirement.checks.length" class="semantic-list checks-list">
            <li v-for="check in requirement.checks" :key="`${chapter.id}-${requirement.id}-${check.id}`">
              <RouterLink :to="check.to" class="sub-navi-item-layout" :class="{
                'active': isSelected(check),
                'with-pill': check.badge
              }" @click.stop.prevent="emit('select-check', check)">
                <VuetifyStatusPill v-if="check.badge" v-bind="check.badge" class="pill -secondary" />
                <span class="highlight index">{{ check.id }}</span>
                <VuetifyMarkdown tag="span" :source="` ${check.name}`" />
              </RouterLink>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { DOUBLE_HYPHEN } from '~/config/app'
import {
  ContentItem,
  ContentNavigationRouterLink,
  Requirement,
} from '~/types/Release'

const props = defineProps<{
  semanticHeader?: boolean
  headingLabel: string
  headingTag: 'h1' | 'h2' | 'h3'
  headingDesc?: string
  /** the query content parameter of the active naviItem or subItem */
  selected: string | undefined
  contentItems: Array<ContentItem & { requirements: Requirement[] }>
}>()

const emit = defineEmits<(e: 'select-check', check: ContentItem) => void>()

const areOpen = ref<string[]>([])
const toggleOpen = (id: string) => {
  const isOpenAt = areOpen.value.findIndex((v) => v === id)
  if (isOpenAt === -1) {
    areOpen.value.push(id)
  } else {
    areOpen.value.splice(isOpenAt, 1)
  }
}

const isSelected = ({ to }: { to: ContentNavigationRouterLink }) =>
  to.query.content === props.selected
watch(
  () => props.selected,
  (newVal) => {
    if (!newVal) return
    const [, chapter] = newVal.split(DOUBLE_HYPHEN)
    if (!areOpen.value.includes(chapter)) areOpen.value.push(chapter)
  },
)
</script>

<style scoped lang="scss">
.heading {
  margin: 0 0 $space-heading 0;
}

.navi-list {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-s;
  overflow: auto;
}

.navi-box {
  color: inherit;
  text-decoration: none;

  display: flex;
  flex-direction: column;
  column-gap: $space-label-s;
  padding: $padding-component-s;
  background-color: rgb(var(--v-theme-background));

  span {
    text-decoration: none;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  &:hover,
  &:focus {
    background-color: rgb(var(--v-theme-background));
  }

  &.active {
    background-color: rgb(var(--v-theme-background));
  }
}

.navi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.5rem;
}

.sub-navi-item {
  display: flex;
  text-decoration: none;
  flex-direction: column;

  a:not(:hover) {
    color: inherit;
  }

  a.active {
    background-color: rgb(var(--v-theme-background));
  }

  * {
    text-decoration: none;
    font-size: 0.75rem;
  }

  /** set the border-bottom on sub-navi-item execpt on the last element */
  &:not(:last-child) {
    border-bottom: 1px solid rgb(var(--v-theme-background));
  }

  h5 {
    margin: 0;
    padding: $spacing-12;
  }
}

.sub-navi-item-layout {
  width: 100%;
  display: grid;
  column-gap: $space-component-s;
  grid-template-columns: minmax(30px, auto) 1fr;
  grid-template-rows: auto 1fr;
  padding: $padding-component-s;
  padding-left: $spacing-16;

  &.with-pill {
    row-gap: $space-component-xs;
  }

  .pill {
    grid-column: 2 / 3;
  }

  span.index {
    text-align: right;
  }
}

.pill {
  margin-bottom: 4px;
  padding: 0 10px;
  border-radius: 16px;
  font-size: 0.75rem;
}

.semantic-list {
  span {
    max-width: 100%;
    word-break: break-word;
  }
}

.checks-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  li {
    width: 100%;
  }
}

:global(.m-popover .navi-header__button.a-button--integrated) {
  position: relative;
}
</style>
