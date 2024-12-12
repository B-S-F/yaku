<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <header :class="{ 'sr-only': semanticHeader }">
    <component :is="headingTag" class="heading font-weight-bold text-h6">
      {{ headingLabel }}
    </component>
    <span v-if="headingDesc">{{ headingDesc }}</span>
  </header>
  <ol class="navi-list semantic-list">
    <li v-if="withAutopilots">
      <RouterLink :to="AUTOPILOTS_ITEM.to" class="navi-box" :class="{ 'active': isSelected(AUTOPILOTS_ITEM) }">
        <span class="font-weight-bold">{{ AUTOPILOTS_ITEM.name }}</span>
        <span>{{ AUTOPILOTS_ITEM.description }}</span>
      </RouterLink>
    </li>
    <li v-if="withGlobalVariables">
      <RouterLink :to="GLOBAL_VARIABLE_ITEM.to" class="navi-box"
        :class="{ 'active': isSelected(GLOBAL_VARIABLE_ITEM) }">
        <span class="font-weight-bold">{{ GLOBAL_VARIABLE_ITEM.name }}</span>
        <span>{{ GLOBAL_VARIABLE_ITEM.description }}</span>
      </RouterLink>
    </li>
    <li v-for="item in contentItems" :key="item.id" data-cy="navi-item">
      <RouterLink class="navi-box" :to="item.to" :class="{ 'active': isSelected(item) }" @click="toggleOpen(item.id)">
        <VuetifyStatusPill v-if="item.badge" v-bind="item.badge" class="pill" />
        <div class="navi-header">
          <VuetifyMarkdown tag="span" class="font-weight-bold text-overflow" :source="`${item.id} ${item.name}`" />
          <FrogButton v-if="item.subItems.length > 0" integrated
            :icon="areOpen.includes(item.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'" class="navi-header__button"
            @click.stop.prevent="toggleOpen(item.id)" />
        </div>
      </RouterLink>
      <ul v-if="areOpen.includes(item.id)" class="semantic-list">
        <li v-for="subItem in item.subItems" :key="`${item.id}-${subItem.id}`" class="sub-navi-item"
          data-cy="sub-navi-item">
          <RouterLink :to="subItem.to" class="sub-navi-item-layout" :class="{
            'active': isSelected(subItem),
            'with-pill': subItem.badge
          }">
            <VuetifyStatusPill v-if="subItem.badge" v-bind="subItem.badge" class="pill" />
            <span class="font-weight-bold">{{ subItem.id }}</span>
            <VuetifyMarkdown tag="span" :source="subItem.name" />
          </RouterLink>
        </li>
      </ul>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router'
import type { Badge } from '~/types'

type ContentNavigationRouterLink = RouteLocationRaw & {
  query: { content: NonNullable<LocationQueryRaw[string | number]> }
}

type ContentItem = {
  badge?: Badge
  id: string
  name: string
  to: ContentNavigationRouterLink
}

const props = defineProps<{
  semanticHeader?: boolean
  headingLabel: string
  headingTag: 'h1' | 'h2' | 'h3'
  headingDesc?: string
  /** the query content parameter of the active naviItem or subItem */
  selected: string | undefined
  contentItems: Array<ContentItem & { subItems: ContentItem[] }>
  withGlobalVariables?: boolean
  withAutopilots?: boolean
}>()

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

const GLOBAL_VARIABLE_ITEM = {
  name: 'Global Variables',
  description: 'Description of variables',
  to: {
    query: { editor: 'visual', content: 'globals' },
  } satisfies ContentNavigationRouterLink,
}

const AUTOPILOTS_ITEM = {
  name: 'Autopilots',
  description: 'Automation of checks',
  to: {
    query: { editor: 'visual', content: 'autopilots' },
  } satisfies ContentNavigationRouterLink,
}
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
  text-decoration: none;

  display: flex;
  flex-direction: column;
  column-gap: $space-label-s;
  padding: $padding-component-s;
  background-color: #E0E0E0; // grey-lighten-2
  color: #000000;

  .-dark-mode & {
    background-color: #212121; // grey-darken-4
    color: #FFFFFF;
  }

  span {
    text-decoration: none;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  &:hover,
  &:focus {
    background-color: #BDBDBD; // grey-lighten-1

    .-dark-mode & {
      background-color: #424242; // grey-darken-3
    }
  }

  &.active {
    background-color: #BDBDBD; // grey-lighten-1

    .-dark-mode & {
      background-color: #424242; // grey-darken-3
    }
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
  font-size: 0.75rem;
  text-decoration: none;

  a:not(:hover) {
    color: inherit;
  }

  a.active {
    background-color: #F5F5F5; // grey-lighten-4

    .-dark-mode & {
      background-color: #212121; // grey-darken-4
    }
  }

  * {
    text-decoration: none;
  }

  /** set the border-bottom on sub-navi-item execpt on the last element */
  &:not(:last-child) {
    border-bottom: 1px solid #71767c;
  }
}

.sub-navi-item-layout {
  width: 100%;
  display: grid;
  column-gap: $space-component-s;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  padding: $padding-component-s $padding-component-s $padding-component-s $padding-component-l;

  &.with-pill {
    row-gap: $space-component-xs;
  }

  .pill {
    grid-column: 2 / 3;
  }
}

.pill {
  margin-bottom: 4px;
  padding: 0 10px;
  border-radius: 16px;
  font-size: 0.75rem;
}
</style>
