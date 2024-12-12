<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-layout>
    <v-navigation-drawer v-model="isOpen" rail-width="3rem" :width="smAndDown && isOpen ? width : undefined" permanent
      :rail="mdAndUp && !userOpen" aria-label="Side Navigation" :aria-hidden="false"
      @update:modelValue="onModelValueChange">
      <v-list-item>
        <v-list-item-title class="font-weight-bold">
          {{ userOpen ? appName : '' }}
        </v-list-item-title>
        <template #append>
          <FrogButton :icon="userOpen ? 'mdi-close' : 'mdi-menu'" integrated @click="onClickToOpen" />
        </template>
      </v-list-item>

      <!-- Navigation Sidebar -->
      <v-list v-if="!$slots['sidenavigation-nav-items']" role="menubar"
        @update:selected="(items: any) => { selectedItem = items[0] }">
        <template v-for="(menuItem, idx) in menuItems" :key="`menu-item-${idx}`">
          <template v-if="menuItem.subItems">
            <FrogMenuItem :value="menuItem.label" :iconName="menuItem.icon" hasArrowDown :label="menuItem.label" />
            <v-expansion-panels :model-value="selectedItem === menuItem.label ? [0] : []" flat>
              <v-expansion-panel>
                <v-expansion-panel-text>
                  <v-list>
                    <v-list-item v-for="subItem in menuItem.subItems" :key="subItem.label" :href="subItem.href"
                      :aria-disabled="subItem.isDisabled" :title="subItem.label" />
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </template>
          <template v-else>
            <FrogMenuItem :value="menuItem.label" :iconName="menuItem.icon" :label="menuItem.label" />
          </template>
        </template>
      </v-list>
      <v-list v-else role="menubar">
        <slot name="sidebar-nav-items" />
      </v-list>
      <template #append>
        <slot name="after-items" />
      </template>
    </v-navigation-drawer>
  </v-layout>
</template>

<script setup lang="ts">
import type { SideNavigationProps } from '../types'
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import FrogButton from '../atoms/FrogButton.vue'
import FrogMenuItem from '../atoms/FrogMenuItem.vue'

const props = defineProps<SideNavigationProps>()

const emit = defineEmits<(e: 'update:isOpen', newVal: boolean) => void>()

const { mdAndUp, smAndDown, width } = useDisplay()
const selectedItem = ref<string>()
const userOpen = ref<boolean>(false)
const isOpen = computed({
  get() {
    return (
      userOpen.value ||
      (smAndDown.value && props.isOpen) ||
      (mdAndUp.value && !userOpen.value)
    )
  },
  set() {},
})

watch(
  () => props.isOpen,
  (val) => {
    if (smAndDown) userOpen.value = val
  },
)

const onModelValueChange = (val: boolean) => {
  emit('update:isOpen', val)
}
const onClickToOpen = () => {
  userOpen.value = !userOpen.value
  emit('update:isOpen', userOpen.value)
}
</script>
