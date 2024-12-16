<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <section class="autopilots">
    <header>
      <h2 class="heading text-h6 font-weight-bold">
        Autopilots ({{ autopilots.length }})
      </h2>
      <FrogButton secondary icon="mdi-plus" tertiary @click="emit('create-autopilot')">
        Add Autopilot
      </FrogButton>
    </header>

    <ul v-if="autopilots.length > 0" class="semantic-list autopilot-list">
      <li v-for="autopilot in autopilots" :id="idAttr(autopilot.name)" :key="autopilot.name"
        class="autopilot-item bg-grey-lighten-2 ma-2 px-4">
        <div class="headline">
          <div>
            <p class="name font-weight-bold">
              {{ autopilot.name }}
            </p>
            <VuetifyStatusPill v-if="autopilot.badge" v-bind="autopilot.badge" class="autopilot-badge" />
          </div>
          <div class="autopilot-actions">
            <VuetifyAutopilotActions v-bind="autopilot"
              :trigger-popover-observer-class="autopilotAccordionHasChanged ? 'has-opened-in-list' : 'has-closed-in-list'"
              @create-autopilot="emit('create-autopilot')" @delete-autopilot="emit('delete-autopilot', $event)"
              @edit-autopilot-env="emit('edit-autopilot-env', $event)" @watch-on="emit('watch-on', $event)" />
            <FrogButton v-if="autopilot.apps.length > 0"
              :icon="isContentOpen[autopilot.name] ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              @click="isContentOpen[autopilot.name] = !isContentOpen[autopilot.name]" />
          </div>
        </div>
        <ul v-if="isContentOpen[autopilot.name]" class="semantic-list app-list">
          <li v-for="app, i in autopilot.apps" :key="i" class="app-item">
            <VuetifyAppIcon :name="app.name ?? app" />
            <span class="name" :title="app.name ?? app">{{ app.name ?? app }}</span>
            <VuetifyStatusPill v-if="app.badge" v-bind="app.badge" :title="app.badge.label" class="app-badge" />
            <div class="app-actions">
              <FrogButton v-tooltip="{ label: 'Edit variables' }" integrated icon="mdi-pencil-outline"
                :disabled="!app.parameters" @click="emit('edit-app', { autopilotId: autopilot.name, app })" />
              <FrogButton v-tooltip="{ label: 'Delete app' }" integrated icon="mdi-delete-outline"
                @click="emit('delete-app', { autopilotId: autopilot.name, app })" />
            </div>
          </li>
        </ul>
      </li>
    </ul>
    <p v-else>
      No autopilots are currently defined.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useScrollHighlight } from '~/composables'
import type { Autopilot } from '~/types'
import type { App } from '~/types/AppCatalog'
import type { Env, OnyxConfiguration } from '~/types/OnyxConfiguration'
import {
  MANDATORY_VAR_BADGE,
  formatAppBadge,
  getUnsetRequiredParameters,
  parseAppExecutableFromAutopilotRun,
} from '~helpers'

const props = defineProps<{
  configuration: OnyxConfiguration
  apps: App[]
  target?: Autopilot['name']
}>()

const emit = defineEmits<{
  (e: 'create-autopilot'): void
  (e: 'delete-autopilot', autopilotRef: string): void
  (e: 'edit-autopilot-env', payload: { name: string; env: Env }): void
  (e: 'add-app', payload: { autopilotId: string }): void
  (e: 'delete-app', payload: { autopilotId: string; app: App }): void
  (e: 'edit-app', payload: { autopilotId: string; app: App }): void
  (e: 'watch-on', autopilotId: string): void
}>()
/** ref to update triggerPopoverObserverClass */
const autopilotAccordionHasChanged = ref(false)

const isContentOpen = ref<Record<string, boolean>>({})

const autopilots = computed(() =>
  Object.entries(props.configuration.autopilots)
    .map(([name, autopilot]) => ({
      name,
      apps: parseAppExecutableFromAutopilotRun(autopilot.run, props.apps),
      ...autopilot,
    }))
    // enrich the parsed autopilot with UI informations (badges)
    .map((autopilot) => {
      let isMissingInfo = false
      // enrich the apps
      const apps = autopilot.apps.map((app) => {
        if (typeof app == 'object') {
          const missingParameters = getUnsetRequiredParameters(autopilot, app)
          const badge =
            missingParameters.length > 0
              ? formatAppBadge(missingParameters.length)
              : undefined
          isMissingInfo = badge ? true : isMissingInfo
          return {
            ...app,
            badge,
          }
        } else return app
      })
      return {
        ...autopilot,
        badge: isMissingInfo ? MANDATORY_VAR_BADGE : undefined,
        apps,
      }
    }),
)

const idAttr = (id: string) => `autopilot-${id}`
const { scrollTo } = useScrollHighlight()

watchEffect(() => {
  if (props.target) scrollTo(idAttr(props.target))
})
</script>

<style scoped lang="scss">
.autopilot-item {
  .headline {
    flex: 1;
    display: flex;
    align-items: center;
    column-gap: $space-component-l;
    justify-content: space-between;
  }
}

.heading {
  margin: 0;
}

.autopilot-list {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-l;

  :deep(.v-btn) {
    outline-offset: -1px;
    /** The outline on focus appear to be clipped sometimes */
  }
}

li.autopilot-item {
  +.autopilot-item {
    margin-top: $space-component-s;
  }

  :deep(.v-btn) {
    transition: $reveal-effect;
    opacity: $reveal-start;
  }

  &:hover,
  &:focus,
  &:focus-within {
    :deep(.v-btn) {
      opacity: $reveal-end;
    }
  }
}

.autopilot-actions {
  margin-right: -$space-component-m;
  display: flex;
  column-gap: $space-component-xs;
  align-items: center;

  :deep(.items) {
    padding-right: 0;
    column-gap: $space-component-xs;
  }
}

.autopilot {
  padding: $padding-component-s;
  border-top: 0;

  &:deep(.v-expansion-panel--open) {
    :deep(.v-expansion-panel-title) {
      border-bottom: .0625rem solid rgb(var(--v-border-color));
    }

    // adjust the position of the actions context menu if one is displayed from AutopilotActions
    --context-menu-y: 58%;
  }

  :deep(.v-expansion-panel-title) {
    display: grid;
    grid-template-columns: repeat(var(--n-col-start, 1), minmax(0, auto)) minmax(4rem, 1fr) auto;
    column-gap: $space-component-m;
    padding: 0;
    overflow: hidden;
  }

  :deep(.v-expansion-panel-title) {
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 10px;
  }

  &.--badge :deep(.v-expansion-panel-title) {
    --n-col-start: 2;
  }

  &.v-expansion-panel--open:deep(.v-expansion-panel-title) {
    padding: 0 0 $padding-component-s 0;
  }

  :deep(.v-expansion-panel-title_icon .v-btn__content) {
    padding: .75rem 0.75rem;
  }

  :deep(.v-expansion-panel-text) {
    padding: 0;
  }

  .v-btn {
    transition: $reveal-effect;
    opacity: $reveal-start;
  }

  &:hover,
  &:focus,
  &:focus-within {
    .v-btn {
      opacity: $reveal-end;
    }
  }
}

.autopilot-badge,
.app-badge {
  padding: 0 8px;
  border-radius: 16px;
  line-height: 1.25;
  margin-right: auto;
  overflow: hidden;
  width: 100%;

  :deep(>div) {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}

.app-list {
  display: flex;
  flex-direction: column;
  margin-top: $space-component-m;
}

.app-item {
  display: flex;
  align-items: center;
  column-gap: $space-component-m;
}

.app-actions {
  display: flex;
  column-gap: $space-component-xs;
  margin-left: auto;
}

.name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-tooltip]:hover::before {
  $btnSize: 48px;
  $tooltipWidth: 6.5rem;
  text-align: center;
  width: $tooltipWidth;

  left: calc(#{-$tooltipWidth * 0.5} + #{$btnSize * 0.5});
}
</style>
