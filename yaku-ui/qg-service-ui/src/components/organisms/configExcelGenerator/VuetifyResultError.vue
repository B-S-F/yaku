<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="result">
    <FrogIcon icon="mdi-file-document-alert-outline" />
    <div class="main">
      <FrogNotificationBar type="error" show full-width with-icon center-icon no-content-margin>
        <span>{{ errorMsg }}</span>
      </FrogNotificationBar>
      <div class="actions">
        <FrogButton :id="$id('namespace-button')" class="center" icon="mdi-arrow-left" @click="emit('back')">
          Change Mapping
        </FrogButton>
        <RouterLink :to="{ name: ROUTE_NAMES.CONFIGS_OVERVIEW, params: urlContext }">
          <FrogButton :id="$id('namespace-button')" class="w-100" secondary>
            Open Configuration Overview
          </FrogButton>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useId } from '@B-S-F/frog-vue'
import FrogIcon from '@B-S-F/frog-vue/src/atoms/FrogIcon.vue'
import { useUrlContext } from '~/composables'
import { ROUTE_NAMES } from '~/router'

defineProps<{
  errorMsg: string
}>()
const emit = defineEmits<(e: 'back') => void>()

const { $id } = useId()
const { urlContext } = useUrlContext()
</script>

<style scoped lang="scss">
$itemSpace: 16px;

.result {
  height: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}

.error-indication {
  max-height: 70%;
  max-width: 70vw; // specially for $mdScreenWidth
  display: block;
  margin: auto;
}

.main {
  display: flex;
  flex-direction: column;
  gap: $itemSpace;
  margin-top: $itemSpace;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $itemSpace;
}

.w-100 {
  width: 100%;
}

/** for button size exception */
.center {
  display: flex;
  justify-content: center;
  align-items: center; // for responsive view
}

a:-webkit-any-link {
  text-decoration: none; // for chrome and Safari
}
</style>
