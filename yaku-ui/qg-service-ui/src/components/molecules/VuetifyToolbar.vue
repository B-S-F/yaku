<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <header class="toolbar bg-background">
    <slot />
  </header>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  padding: 0 $padding-component-m;
  height: 64px;

  &>::slotted(*) {
    display: flex;
  }
}

.toolbar> :slotted(*) {
  display: flex;
  align-items: center;
}

.toolbar> :slotted(*:not(:last-child)) {
  position: relative;
  margin-right: $space-component-l;

  &::after {
    position: absolute;
    content: "";
    right: -$space-component-l;
    width: 1px;
    height: 100%;
    background-color: var(--view-background);
  }
}

.toolbar> :slotted(*+*) {
  margin-left: $space-component-l;
}

.toolbar> :slotted(.toolbar-gap) {
  column-gap: $space-component-buttonGroup;
}
</style>
