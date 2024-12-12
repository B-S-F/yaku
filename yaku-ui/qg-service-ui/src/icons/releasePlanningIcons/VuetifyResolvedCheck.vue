<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C6.48596 2 2 6.48596 2 12C2 17.514 6.48596 22 12 22C17.514 22 22 17.514 22 12C22 6.48596 17.514 2 12 2ZM10.5 15.7071L7.14642 12.3536L7.85358 11.6464L10.5 14.2929L16.1464 8.64642L16.8536 9.35358L10.5 15.7071Z"
      fill="white" />
    <path
      d="M16.1465 8.64642L16.8536 9.35358L10.5001 15.7071L7.14648 12.3536L7.85364 11.6464L10.5001 14.2929L16.1465 8.64642Z"
      fill="black" />
  </svg>
</template>

<style scoped lang="scss">
svg {
  path:first-of-type {
    fill: #69F0AE; // rgb(var(--v-theme-resolved-status)) // green-accent-2
  }

  path:last-of-type {
    fill: #000000; // black
  }
}
</style>
