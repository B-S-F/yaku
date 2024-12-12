<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogPopover class="pill" :class="{ 'rounded': rounded, [classes]: true }" attached triggerOnHover tooltipAlike
    :arrowPlacementClass="arrowPlacementClass ?? '-without-arrow-top'" :label="tooltip && showTooltip ? tooltip : ''">
    <template v-if="title" #headline>
      <span class="text-body-1">
        {{ title }}
      </span>
    </template>
    <slot name="icon" />
    <div v-if="label">
      {{ label }}
    </div>
  </FrogPopover>
</template>

<script setup lang="ts">
import type { ArrowPlacement } from '@B-S-F/frog-vue'
import { computed } from 'vue'
import type { StatusColors } from '~/types/StatusPillDisplay'

const props = withDefaults(
  defineProps<{
    color: StatusColors
    label?: string
    title?: string
    tooltip?: string
    showTooltip?: boolean
    arrowPlacementClass?: ArrowPlacement
    /** is meant to be used with an icon */
    rounded?: boolean
  }>(),
  {
    showTooltip: true,
  },
)

const classes = computed(() => {
  switch (props.color) {
    case 'Success':
      return 'bg-green-lighten-3'
    case 'MajorWarning':
      // FIXME:  --major-signal-warning__enabled__fill__default --major-signal-warning__enabled__front__default
      return 'bg-yellow-accent-4'
    case 'Warning':
      return 'bg-warning'
    case 'LightError':
      // FIXME:  --minor-signal-error__enabled__fill__default --minor-signal-error__enabled__front__default
      return 'bg-red-lighten-4'
    case 'Error':
      return 'bg-error'
    case 'Unknown':
      // FIXME: --neutral__enabled__fill__default --neutral__enabled__front__default
      return 'bg-grey-lighten-2'
    case 'Info':
      return 'bg-blue-lighten-4'
    default:
      return 'text-white'
  }
})
</script>

<style scoped lang="scss">
.pill {
  display: flex;
  flex-wrap: nowrap;
  max-width: fit-content;
  height: fit-content;
  gap: $space-component-s;
  padding: $padding-component-xxs;

  // adjust the tooltip
  &::before {
    white-space: nowrap;
    width: fit-content;
    transform: translate(#{$space-component-l}, -#{$spacing-8});
  }

  &.rounded {
    padding: $padding-component-xxs;
    gap: 0;
    border-radius: 16px;
  }

  // for custom icons
  :slotted(svg),
  :slotted(i) {
    font-size: $size-icon-m;
    margin: 0;
  }

  :deep(.state) {
    fill: currentColor;
  }

  .-dark-mode &:deep(.state) {
    fill: currentColor;
  }
}
</style>
