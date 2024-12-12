<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyInlineOrContext class="inline-context-layout" @click.stop="">
    <template #default>
      <template v-for="item in autopilotActions" :key="item.label">
        <FrogPopover attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top" :label="item.label"
          :class="triggerPopoverObserverClass">
          <FrogButton v-if="item.action" integrated :icon="item.icon" :disabled="item.disabled"
            @click.stop="item.action" />
          <RouterLink v-else :to="item.to">
            <FrogButton integrated :icon="item.icon" tabindex="-1" />
          </RouterLink>
        </FrogPopover>
      </template>
    </template>
    <template #secondary-actions>
      <FrogMenuItem v-for="item in autopilotActions" :key="item.label" class="" :iconName="item.icon"
        :label="item.label" :onClick="() => item.action ? item.action() : router.push(item.to)" />
    </template>
  </VuetifyInlineOrContext>
</template>

<script setup lang="ts">
import type { Env } from '~/types/OnyxConfiguration'
import type { App } from '~/types/AppCatalog'
import type { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { serializeAutopilotDefJump } from '~composables'
import VuetifyInlineOrContext from '~/components/layouts/VuetifyInlineOrContext.vue'

/**
 * All properties of an autopilot of AutopilotsView
 */
const props = defineProps<{
  /** Special class to trigger useMutationObserver re-calculation */
  triggerPopoverObserverClass?: string
  run: string
  config?: string[] | undefined
  env?: Env | undefined
  name: string
  apps: App[]
}>()

const emit = defineEmits<{
  (e: 'create-autopilot'): void
  (e: 'delete-autopilot', autopilotRef: string): void
  (e: 'edit-autopilot-env', payload: { name: string; env: Env }): void
  (e: 'add-app', payload: { autopilotId: string }): void
  (e: 'watch-on', autopilotId: string): void
}>()

const router = useRouter()

type ActionBtn = {
  label: string
  icon: string
  action: CallableFunction
  disabled: boolean
  to: undefined
}
type ActionLink = {
  label: string
  icon: string
  action: undefined
  to: RouteLocationRaw
}
const autopilotActions = computed<Array<ActionBtn | ActionLink>>(() => [
  {
    label: 'Add app',
    icon: 'mdi-plus',
    action: () => emit('add-app', { autopilotId: props.name }),
    disabled: false,
    to: undefined,
  },
  {
    label: props.env ? 'Edit variables' : 'No variable to edit',
    icon: 'mdi-pencil-outline',
    disabled: !props.env,
    action: () =>
      props.env
        ? emit('edit-autopilot-env', { name: props.name, env: props.env })
        : undefined,
  },
  {
    label: 'Filter by autopilot',
    icon: 'mdi-magnify',
    disabled: false,
    action: () => emit('watch-on', props.name),
  },
  {
    label: 'Jump to code',
    icon: 'mdi-application-brackets-outline',
    disabled: false,
    action: undefined,
    to: {
      query: {
        content: serializeAutopilotDefJump({ autopilotId: props.name }),
        editor: 'code',
      },
    },
  },
  {
    label: 'Delete autopilot',
    icon: 'mdi-delete-outline',
    disabled: true,
    action: () => emit('delete-autopilot', props.name),
  },
])
</script>


<style scoped lang="scss">
.inline-context-layout {
  :deep(.menu-button) {
    padding: 0;
  }
}
</style>
