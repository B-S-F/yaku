<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <section>
    <header>
      <h2 class="heading text-h6 font-weight-boldd">
        Autopilots
      </h2>
      <!-- <FrogButton secondary icon="embed" @click="emit('update:expand', !expand)" /> -->
    </header>
    <FrogTextInput v-if="expand" id="code-search" v-model="search" class="search-input" type="search"
      placeholder="Search for autopilots" data-cy="autopilot-search" />
    <div v-if="expand" class="content">
      <FrogPopover class="code-info" pophoverClass="code-info-popover" attached triggerOnHover
        arrowPlacementClass="-right-top">
        <FrogIcon icon="mdi-information-outline" tabindex="1" />
        <template #content>
          <VuetifyCodeSnippetDescription />
        </template>
      </FrogPopover>
      <h3 class="sr-only">
        Autopilots
      </h3>
      <ul class="code-snippet-list semantic-list" data-cy="autopilots-list">
        <li v-for="autopilot in filteredAutopilots" :key="autopilot.name">
          <VuetifyCodeCard headlineTag="h4" :headline="autopilot.name" :description="autopilot.description"
            icon="mdi-file-code-outline" @add="emit('add-autopilot', autopilot)">
            <template #description>
              <section class="env-section">
                <h5 class="text text-subtitle-1 font-weight-bold" style="margin: 0">
                  env:
                </h5>
                <ul class="semantic-list env-list">
                  <li
                    v-for="env in autopilot.apps.reduce((acc, app) => { acc.push(...app.envs); return acc }, [] as AppParameter[])"
                    :key="env.name" class="env-item">
                    <span>
                      {{ env.name }}
                      <span v-if="env.example" class="example">: {{ env.example }}</span>
                      <span v-if="env.optional"> // Optional</span>
                    </span>
                    <span class="description">{{ env.description }}</span>
                  </li>
                </ul>
              </section>
            </template>
          </VuetifyCodeCard>
        </li>
      </ul>
    </div>
    <FrogButton class="resize-btn bg-grey-lighten-2" integrated arial-label="resize panel"
      icon="mdi-arrow-split-vertical" @mousedown="emit('drag-resizer')" />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSimpleSearch } from '~/composables/useSimpleSearch'
import { autopilots } from '~/config/autopilots'
import type { AppParameter } from '~/types/App'
import type { Autopilot } from '~/types/Autopilot'

defineProps<{
  expand: boolean
}>()

const emit = defineEmits<{
  // (e: 'update:expand', newVal: boolean): boolean
  (e: 'drag-resizer'): void
  (e: 'add-autopilot', autopilot: Autopilot): void
}>()

const search = ref('')
const { results: filteredAutopilots } = useSimpleSearch<Autopilot>({
  search,
  candidates: autopilots,
  searchIn: ['name'],
})
</script>

<style scoped lang="scss">
$rowSpace: 0.75rem;
$containerPadding: 16px;

section,
.content {
  height: 100%;
}

section {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: $containerPadding;
}

header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  min-height: 3rem;
}

.heading {
  margin: 0;
}

.search-input {
  width: 100%;
}

.content {
  padding: 16px 0;
  display: flex;
  flex-flow: column nowrap;
  row-gap: $rowSpace;
  min-height: 0;

  .-dark-mode & {
    background-color: #424242; // grey-darken-3
  }
}

.code-info {
  align-self: end;
}

:global(.code-info-popover) {
  --y-shift: -2px;
}

.code-snippet-list {
  display: flex;
  flex-flow: column nowrap;
  row-gap: $rowSpace;
  margin-right: -12px; // align with the searchbar for now
  margin-left: -12px;
  overflow: scroll;
}

.env-section {
  margin-top: 12px;
  row-gap: 12px;
}

ul.env-list {
  display: flex;
  flex-flow: column nowrap;
  row-gap: 12px;
  padding-left: 8px;
}

.env-item {
  display: flex;
  flex-flow: column nowrap;

  li {
    margin-left: 1em;
  }

  .description {
    color: #9E9E9E; // grey

    .-dark-mode & {
      color: #616161; // grey-darken-2
    }
  }

  .description,
  .example {
    font-size: 0.925rem;
  }
}

.resize-btn {
  $width: 0.9rem;
  $height: 5.4rem;
  padding-top: 5rem;
  padding-bottom: 5rem;
  position: absolute;
  left: 0;
  top: calc(50% - #{$height * 0.5});
  width: $width;
  height: $height;
  cursor: ew-resize;
  border: none;
  border-radius: 4px;
  font-size: xx-small;

  --handle-color: #0D47A1; // blue-darken-4

  &:hover {
    --handle-color: #000000;
  }

  &:active {
    --handle-color: #000000;
  }

  &::before,
  &::after {
    $handleHeight: 0.5rem;
    display: block;
    position: absolute;
    width: 1px;
    height: $handleHeight;
    background-color: var(--handle-color);
    transform: translate(calc($width * 0.5 + var(--from-x-center)), #{($height - $handleHeight) * 0.5})
  }

  &::before {
    --from-x-center: -2px;
  }

  &::after {
    --from-x-center: 0px;
  }
}
</style>
