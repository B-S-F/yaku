<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogPopover :id="id" v-on-click-outside="onClickOutsideHandler" class="popover-info"
    :class="{ 'popover-open': show }" attached :arrowPlacementClass="arrowPlacementClass" :show="show"
    :triggerOnHover="triggerOnHover" :label="label" :deactivate="deactivate" :pophoverClass="`${pophoverClass} ${id}`">
    <FrogIcon :icon="icon" tabindex="0" @click.prevent="toggle" @keydown.prevent.space="toggle"
      @keydown.prevent.enter="toggle" />
    <template #content>
      <slot name="content" />
    </template>
  </FrogPopover>
</template>

<script setup lang="ts">
import { useId, type ArrowPlacement } from '@B-S-F/frog-vue'
import { vOnClickOutside } from '@vueuse/components'
import { OnClickOutsideHandler, OnClickOutsideOptions } from '@vueuse/core'
import { ref } from 'vue'

withDefaults(
  defineProps<{
    icon?: string
    label?: string
    deactivate?: boolean
    arrowPlacementClass?: ArrowPlacement
    pophoverClass?: string
    triggerOnHover?: boolean
  }>(),
  {
    icon: 'mdi-information-outline',
    triggerOnHover: true,
  },
)

const id = useId().$id('popover-info')
const show = ref(false)
const toggle = () => (show.value = !show.value)

const onClickOutsideHandler: [OnClickOutsideHandler, OnClickOutsideOptions] = [
  () => {
    if (show.value) show.value = false
  },
  { ignore: [`#${id}`, `.${id}`] },
]
</script>

<style scoped lang="scss">
.popover-info {
  background: none;
  border: none;
  padding: 0;
  height: 1.5rem;
  cursor: pointer;
  position: relative;

  i {
    padding: 0;
    // FIXME: --plain__enabled__front__default
    color: #007BC0;
  }
}
</style>
