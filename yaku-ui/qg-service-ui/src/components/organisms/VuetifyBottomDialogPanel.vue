<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <dialog ref="dialogRef" class="dialog-panel bottom dialog-reset elevation-1" :class="layout" :open="open">
    <header class="panel-header">
      <div class="panel-header__title">
        <slot name="headline" />
      </div>
      <div class="panel-action-group">
        <FrogButton class="custom-icon-btn" integrated :disabled="layout === 'minimized'" @click="layout = 'minimized'">
          <VuetifyWindowMinimized />
        </FrogButton>
        <FrogButton class="custom-icon-btn" integrated :disabled="layout === 'small'" @click="layout = 'small'">
          <VuetifyWindowSmall />
        </FrogButton>
        <FrogButton class="custom-icon-btn" integrated :disabled="layout === 'maximized'" @click="layout = 'maximized'">
          <VuetifyWindowMaximized />
        </FrogButton>
        <FrogButton integrated icon="mdi-close" @click="emit('update:open', false)" />
      </div>
    </header>
    <template v-if="layout !== 'minimized'">
      <template v-if="error">
        <FrogNotificationBar class="notif-bar" :show="!!error" type="error" full-width with-icon center-icon
          no-content-margin data-cy="error-banner">
          <VuetifyBannerContent :label="error" />
        </FrogNotificationBar>
      </template>
      <template v-else>
        <div v-if="isLoading" class="dialog-panel__loader">
          <FrogActivityIndicator />
        </div>
        <div v-else class="dialog-panel__body">
          <div class="dialog-panel__content">
            <slot name="content" />
          </div>
          <footer>
            <slot name="footer" />
          </footer>
        </div>
      </template>
    </template>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import type { SingleCheck } from '~/api'

const props = defineProps<{
  open: boolean
  isLoading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'rerun-test-run', payload: SingleCheck): void
}>()

const defaultLayout = 'small'

const layout = ref<'minimized' | 'small' | 'maximized'>(defaultLayout)
const dialogRef = ref<HTMLDialogElement>()
watchEffect(
  () => {
    dialogRef.value?.focus()
    if (props.isLoading && layout.value !== 'maximized') {
      layout.value = defaultLayout
    }
  },
  { flush: 'post' },
)
</script>

<style scoped lang="scss">
dialog.dialog-panel[open] {
  position: fixed;
  width: 100%;
  max-width: 70vw;
  max-height: var(--layout-height);
  padding-bottom: $padding-component-m;

  display: flex;
  flex-direction: column;

  // --- Position ---
  &.bottom {
    margin: 0 auto;
    bottom: 0;
  }

  // --- Layout ---
  &.minimized {
    --layout-height: fit-content;
    padding-bottom: 0;

    .panel-header {
      margin-bottom: 0;
    }
  }

  &.small {
    --layout-height: 30vh;
  }

  &.maximized {
    --layout-height: 70vh;
  }

  // --- content layout ---
  // TODO: need a working explanation service to figure out what this does to the dialog remark
  // leave as so for now.
  >*:not(.m-dialog__remark) {
    padding-left: $padding-component-l;
  }

  >*:not(header, .m-dialog__remark) {
    padding-right: $padding-component-l;
  }

  >.test-run-list {
    flex: 1 1 auto;
  }

  >:not(.test-run-list) {
    flex: 0 0 auto;
  }

  .dialog-panel__content {
    :deep(h5) {
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  footer {
    :deep(h5) {
      margin-top: 0;
      margin-bottom: 16px;
    }
  }

  .dialog-panel__loader {
    display: flex;
    justify-content: center
  }

  .v-alert.bg-error {
    margin: 0 $padding-component-l;
  }

  .dialog-panel__body {
    height: 100%;
    overflow-y: auto;
    flex: auto;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  column-gap: 10px;
  border-top: 6px solid #419e98;
  border-bottom: 1px solid #71767c;
  margin-bottom: $space-component-l;

  &__title {
    display: flex;
    align-items: center;
    column-gap: 10px;
  }
}

.heading {
  margin: 0 auto 0 0;
}

.panel-action-group {
  display: flex;
  column-gap: $space-component-buttonGroup;
}

.custom-icon-btn {
  :deep(.v-btn__content) {
    display: flex !important;
    align-items: end;
  }
}

.test-run-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  margin-bottom: $padding-component-m;
  gap: $space-component-s 0;

  header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    column-gap: $space-component-m;
    margin-bottom: $space-component-s;
  }
}

.runtime-clock {
  display: flex;
  column-gap: $space-component-s;
  align-self: end;
  margin-right: auto;
}


.hidden {
  visibility: hidden;
}

:global(#app.-sidebar-open .dialog-panel) {
  --max-dialog-width: 100%;
  left: calc(100vw - var(--view-width));

  @media screen and (max-width: $bp-max-1020) {
    max-width: 50vw !important;
  }
}
</style>
