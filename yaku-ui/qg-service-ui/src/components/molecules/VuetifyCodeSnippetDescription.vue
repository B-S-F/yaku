<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <dl>
    <dt>
      Autopilots
    </dt>
    <dd>
      Generic term for the automation of checks.
      You can include more than one autopilot.
    </dd>
    <dt>Apps</dt>
    <dd>
      Usually a command line application called from within the code. Again, more than one app can be included in the
      file. There are usually 3 types of apps: fetcher, evaluators and finalizer.
    </dd>
  </dl>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
dl {
  margin: 0; // reset default styling
  max-width: 400px;
  display: flex;
  flex-flow: column nowrap;
  row-gap: 4px;
}

dt {
  font-style: normal;
  margin-bottom: 0.125rem;

  &:not(:first-of-type) {
    margin-top: 8px;
  }
}

dd {
  margin-left: 8px;
}
</style>
