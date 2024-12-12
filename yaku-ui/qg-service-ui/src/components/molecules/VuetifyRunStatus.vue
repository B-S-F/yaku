<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogPopover class="run-status" attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
    pophoverClass="run-status-popover" :popoverStyles="popoverStyles" :deactivate="deactivatePopover" :label="label">
    <FrogIcon v-if="icon" :icon="icon" />
    <component :is="iconComponent" v-else-if="iconComponent" />
  </FrogPopover>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { RunState } from '~/types'
import { useRunStatusVuetify } from '~/composables/useRunStatus'
import { getRunLabel } from '~/helpers/getPillInfo'

const props = defineProps<{
  state: RunState
  deactivatePopover?: boolean
}>()

const state = computed(() => props.state) // make the prop state reactive behind a proxy
const { bgColor, color, icon, iconComponent } = toRefs(
  useRunStatusVuetify(state),
)

const popoverStyles = computed(() => ({
  backgroundColor: bgColor.value,
}))

const label = computed(() => getRunLabel(props.state))
</script>

<style scoped lang="scss">
$iconSize: 28px;

:global(.run-status-popover) {
  --x-shift: calc(50% - #{$iconSize * 0.5});
}

.run-status {
  line-height: 1;
}

.run-status :deep(svg),
.run-status :deep(i) {
  font-size: #{$iconSize}
}

.run-status :deep(i) {
  color: v-bind(color);
}

// specific styles for custom icons
.run-status .run {
  fill: v-bind(color);
}
</style>
