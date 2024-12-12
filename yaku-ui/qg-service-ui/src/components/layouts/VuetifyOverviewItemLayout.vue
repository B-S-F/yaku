<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <component :is="!!to ? 'RouterLink' : 'div'" class="overview-item-layout bg-background"
    :class="{ 'overview-item-layout--link transparent-link': to }" :to="to">
    <header class="header text-light-blue-darken-2">
      <div class="pill" :class="{ 'with-fallback': icon }">
        <slot name="pill">
          <FrogIcon v-if="icon" :icon="icon" class="fallback-icon" />
        </slot>
      </div>
      <div v-if="hasSecondPill" class="pill" :class="{ 'with-fallback': icon }">
        <slot name="second-pill">
          <FrogIcon v-if="icon" :icon="icon" class="fallback-icon" />
        </slot>
      </div>
      <div class="heading-container">
        <span class="heading font-weight-bold" :data-placeholder="name">
          {{ name }}
        </span>
        <div class="badge-and-info">
          <slot name="badge" />
          <VuetifyPopoverInfo v-if="description" class="heading-info" pophoverClass="overview heading-info-popover"
            arrowPlacementClass="-right-center">
            <template #content>
              <VuetifyMarkdown tag="span" :source="description" />
            </template>
          </VuetifyPopoverInfo>
        </div>
      </div>
    </header>
    <div class="main">
      <div class="details">
        <slot />
      </div>
      <VuetifyInlineOrContext class="actions">
        <slot name="actions" />
        <template #secondary-actions>
          <slot name="secondary-actions" />
        </template>
      </VuetifyInlineOrContext>
    </div>
  </component>
</template>

<script setup lang="ts">
import type { RouteLocationNamedRaw } from 'vue-router'
import VuetifyInlineOrContext from './VuetifyInlineOrContext.vue'

defineProps<{
  name: string
  icon?: string
  description?: string | undefined
  to?: RouteLocationNamedRaw
  hasSecondPill?: boolean
}>()
</script>

<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as *;

.overview-item-layout {
  display: flex;
  flex-direction: column;
  margin: $focus-width;

  .heading-container {
    @include flexbox(row, space-between, center);
    flex: 1;
    padding-right: 8px;

    :deep(.badge-and-info) {
      @include flexbox;
      column-gap: 8px;
    }
  }

  &:hover,
  &:focus-within {
    .actions {
      opacity: $reveal-end;
    }

    .heading-container {
      color: #01579B; // light-blue-darken-4
    }
  }

  &--link.transparent-link {

    // delegate the link visual behavior to the heading
    .heading {
      cursor: pointer;
      color: var(--heading-link-color, #0288D1); // light-blue-darken-2;
    }

    &:hover,
    &:focus {

      .heading {
        text-decoration: underline 2px;
        --heading-link-color: #01579B; // light-blue-darken-4
      }
    }

    &:active .heading {
      --heading-link-color: #0D47A1; // blue-darken-4
    }
  }
}

.header {
  --_header-height: 40px;
  display: flex;
  align-items: center;
  column-gap: $space-component-s;
  min-height: var(--_header-height);

  // other states are handled by the overview-item-layout--link

  &:active {
    color: #0D47A1; // blue-darken-4
  }
}

.pill {
  aspect-ratio: 1;
  flex: 0 0 var(--_header-height);

  &.with-fallback {
    display: grid;
    place-content: center;
  }

  .fallback-icon {
    font-size: $size-icon-m;
  }

  // status pill layout adjustment
  :slotted(>.pill) {
    height: 100%;
    aspect-ratio: 1;
    display: grid;
    place-content: center;
  }

  &:not(:first-of-type) {
    margin-left: -7px;
  }
}

.heading {
  display: flex;
  align-items: center;
}

.heading-info {
  margin: auto 0;
}

.heading-info.popover-info:deep(i) {
  color: #007BC0;
}

:global(.overview.heading-info-popover) {
  max-width: 40rem;
}

.main {
  border-top: 2px solid var(--view-background);
  display: flex;
}

.details {
  display: flex;
  column-gap: $spacing-24;

  >:slotted(*) {
    display: flex;
    flex-flow: column nowrap;
    flex-grow: 1;
    row-gap: $space-component-s;
    line-height: 1.2875;
    width: 250px;
    padding: $padding-component-s;
  }

  >:slotted(*+*) {
    border-left: 2px solid var(--view-background);
  }

  @media screen and (max-width: $bp-max-768) {
    :deep(.run-overview-item-section) {
      width: 25vw;
    }
  }
}

.actions {
  transition: $reveal-effect;
  opacity: $reveal-start;
  flex-grow: 1;
  flex-shrink: 1;
}

@media (min-width: 1200px) {
  .details {
    column-gap: $space-component-xl;
  }
}

@media (min-width: 1780px) {
  .details {
    >:slotted(*) {
      width: 300px;
    }
  }
}
</style>
