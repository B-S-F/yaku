<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
    <g>
      <path class="run"
        d="M144,104c.53,0,1.07,.02,1.6,.04l12.2-7.84L33,16V176.4l73.99-47.55c5.98-14.57,20.32-24.85,37.01-24.85ZM42,32.4l99.2,63.8-99.2,63.7V32.4Z" />
      <path class="state"
        d="M140,157.7l-10.8-10.8,5.7-5.7,5.2,5.2,13.2-13.2,5.7,5.7-19,18.8h0Zm36-13.7c0,17.6-14.4,32-32,32s-32-14.4-32-32,14.4-32,32-32,32,14.4,32,32Zm-8,0c0-13.2-10.8-24-24-24s-24,10.8-24,24,10.8,24,24,24,24-10.8,24-24Z" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
@use './style.css';

.state {
  fill: #2E7D32 // green-darken-3
}
</style>
