<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <component :is="tag" class="code-editor-layout"
    :class="{ 'show-error': showError, 'resizing': isResizing, 'expand-right-panel': expandRightPanel }">
    <div class="left-panel">
      <slot name="left-panel" />
    </div>
    <div class="editor">
      <slot name="editor" />
    </div>
    <div v-if="showError" class="error">
      <slot name="error" />
    </div>
    <div v-if="expandRightPanel" class="right-panel">
      <slot name="right-panel" />
    </div>

    <Teleport to="#app">
      <slot name="teleport" />
    </Teleport>
  </component>
</template>

<script setup lang="ts">
defineProps<{
  tag: string
  showError?: boolean
  expandRightPanel: boolean
  isResizing?: boolean
}>()
</script>

<style scoped lang="scss">
.code-editor-layout {
  display: grid;
  grid-template-columns: var(--edit-panel-width, auto) minmax(0, 1fr) var(--code-panel);
  grid-template-rows: minmax(0, 1fr) auto;
  gap: $spacing-32 $spacing-32;

  --code-panel: calc(24px + 2 * .6875rem);

  &.resizing * {
    user-select: none;
    -webkit-user-select: none; // safari
  }

  @media screen and (max-width: $bp-max-1020) {
    grid-template-columns: minmax(0, 1fr);
  }

  &.expand-right-panel {
    --code-panel: var(--code-panel-width, 0);

    @media screen and (max-width: $bp-max-1020) {
      grid-template-columns: minmax(0, 1fr) var(--code-panel);
    }

    .right-panel {
      grid-area: 1 / 3 / -1 / 4;

      @media screen and (max-width: $bp-max-1020) {
        grid-area: 1 / 2 / -1 / 3;
      }
    }

    .editor,
    .error {
      grid-column: 2 / 3;

      @media screen and (max-width: $bp-max-1020) {
        grid-column: 1 / 2;
      }
    }
  }

  &.show-error {
    .editor {
      grid-row: 1 / 2;
    }

    &:not(.expand-right-panel) .error {
      grid-row: 2 / 3;
      grid-column: 2 / 4;
    }
  }
}

.left-panel {
  grid-area: 1 / 1 / -1 / 2;

  @media screen and (max-width: $bp-max-1020) {
    display: none;
  }
}

.editor {
  grid-area: 1 / 2 / -1 / 4;
  // TODO maybe move this into the CodeEditor
  display: flex;
  flex-flow: column;

  @media screen and (max-width: $bp-max-1020) {
    grid-area: 1 / 1 / -1 / 2;
  }
}

.right-panel {
  grid-area: 1 / 3 / -1 / 4;
}
</style>
