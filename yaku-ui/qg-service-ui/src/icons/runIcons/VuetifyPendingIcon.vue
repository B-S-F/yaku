<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
    <path class="state"
      d="M96,16c-44.18,0-80,35.82-80,80s35.82,80,80,80,80-35.82,80-80S140.18,16,96,16Zm0,152c-39.7,0-72-32.3-72-72S56.3,24,96,24s72,32.3,72,72-32.3,72-72,72Zm-15.94-71.13h0c0,3.89-3.22,7.11-7.11,7.11s-7.11-3.11-7.11-7.11,3.11-7.11,7.11-7.11,7.11,3.22,7.11,7.11Zm23,0h0c0,3.89-3.22,7.11-7.11,7.11s-7.11-3.11-7.11-7.11,3.11-7.11,7.11-7.11,7.11,3.22,7.11,7.11Zm23,0h0c0,3.89-3.22,7.11-7.11,7.11s-7.11-3.11-7.11-7.11,3.11-7.11,7.11-7.11,7.11,3.22,7.11,7.11Z" />
  </svg>
</template>

<style scoped lang="scss">
@use './style.css';

.state {
  fill: #757575 // grey-darken-1
}

.-dark-mode .state {
  fill: #BDBDBD // grey-lighten-1
}
</style>
