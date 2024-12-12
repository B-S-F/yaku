<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <v-menu offset-y max-height="50%" width="100%" :close-on-content-click="false" transition="slide-y-transition"
    activator="parent" location="bottom" @update:modelValue="(value) => emit('update:modelValue', value)">
    <v-container>
      <v-list elevation="10">
        <v-row no-gutters>
          <v-col v-if="smAndDown ? !submenu && !subsubmenu : true" cols="12" md="4">
            <v-list lines="one">
              <FrogNavigationItem v-for="entry in navigation" :key="entry.label" :entry="entry"
                @open="onOpenSubmenu(entry)" />
            </v-list>
            <v-list-item key="language selector">
              <div class="d-flex align-center ga-4">
                <a href="https://www.example.com/websites-worldwide/" target="_blank">
                  <FrogIcon icon="globe" title="globe" />
                  <span>{{ label }}</span>
                </a>
                <FrogDropdown v-if="languages.length > 0" id="languages" v-model="selectedLanguage"
                  class="d-inline-block frog-lang-dropdown" :items="languageOptions" />
              </div>
            </v-list-item>
          </v-col>
          <v-col v-if="smAndDown ? !!submenu && !subsubmenu : true" md="4" cols="12">
            <v-list lines="one">
              <v-list-item v-if="smAndDown" key="level1-back-button">
                <FrogButton icon="mdi-arrow-left-thin" integrated @click="onCloseSubmenu()" />
              </v-list-item>
              <v-list-item v-if="submenuLabel" :key="submenuLabel">
                <a href="/" target="_self">
                  <span class="font-weight-bold">{{ submenuLabel }} overview</span>
                </a>
              </v-list-item>
              <FrogNavigationItem v-for="entry in submenu" :key="entry.label" :entry="entry"
                @open="onOpenSubSubmenu(entry)" />
            </v-list>
          </v-col>
          <v-col v-if="smAndDown ? !!subsubmenu : true" md="4" cols="12">
            <v-list lines="one">
              <v-list-item v-if="smAndDown" key="level1-back-button">
                <FrogButton icon="mdi-arrow-left-thin" integrated @click="onCloseSubmenu()" />
              </v-list-item>
              <v-list-item v-if="subsubmenuLabel" :key="subsubmenuLabel">
                <a href="/" target="_self">
                  <span class="font-weight-bold">{{ subsubmenuLabel }} overview</span>
                </a>
              </v-list-item>
              <FrogNavigationItem v-for="entry in subsubmenu" :key="entry.label" :entry="entry" />
            </v-list>
          </v-col>
        </v-row>
      </v-list>
    </v-container>
  </v-menu>
</template>

<script setup lang="ts">
import FrogIcon from 'src/atoms/FrogIcon.vue'
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import FrogButton from '../../../atoms/FrogButton.vue'
import FrogDropdown from '../../../atoms/FrogDropdown.vue'
import type { SelectItem } from '../../../types'
import type { NavigationEntry } from '../types'
import FrogNavigationItem from './FrogNavigationItem.vue'

type NavigationProps = {
  label?: string
  navigation?: NavigationEntry[]
  selectedLanguage?: string
  languages?: string[]
}
const props = withDefaults(defineProps<NavigationProps>(), {
  label: 'Company Name GmbH',
  navigation: () => [],
  languages: () => []
})

const emit = defineEmits<{
  (e: 'update:selectedLanguage', val: string): void
  (e: 'update:modelValue', val: boolean): void
}>()

const { smAndDown } = useDisplay()
const submenu = ref<NavigationEntry[]>()
const submenuLabel = ref<string>()
const subsubmenu = ref<NavigationEntry[]>()
const subsubmenuLabel = ref<string>()

const onOpenSubmenu = (entry: NavigationEntry) => {
  submenu.value = entry.subNavigation;
  submenuLabel.value = entry.label;
  subsubmenu.value = undefined
  subsubmenuLabel.value = undefined
}
const onCloseSubmenu = () => {
  submenu.value = undefined;
  submenuLabel.value = undefined;
  subsubmenu.value = undefined
  subsubmenuLabel.value = undefined
}
const onOpenSubSubmenu = (entry: NavigationEntry) => {
  subsubmenu.value = entry.subNavigation
  subsubmenuLabel.value = entry.label
}

const languageToOption = (language: string): SelectItem<string> => ({
  label: language,
  value: language,
})


const selectedLanguage = computed({
  get() {
    return props.selectedLanguage ? languageToOption(props.selectedLanguage) : undefined
  },
  set(newVal) {
    if (!newVal) return
    emit('update:selectedLanguage', newVal.value)
  }
})

const languageOptions = computed(() => props.languages?.map(languageToOption))

</script>
<style lang="scss" scoped>
.frog-lang-dropdown {
  width: fit-content;

  &:deep(.v-field__input) {
    min-height: unset;
    padding-top: 0;
    padding-bottom: 0;
  }

  &:deep(.v-field) {
    max-width: fit-content;
  }

  &:deep(.v-input__details) {
    display: none;
  }
}
</style>
