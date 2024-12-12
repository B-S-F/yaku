<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div>
    <slot />
  </div>
</template>

<style scoped lang="scss">
/**
* Force the content to be centered in a grid layout. Used specially for Safari.
* Usaged from the .a-box--model of the frok.
*/
div {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
