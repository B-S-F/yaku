<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogNotificationBar :show="true" type="neutral">
        Default notification bar
      </FrogNotificationBar>
    </Variant>
    <Variant title="default with icon">
      <FrogNotificationBar :show="true" type="neutral" :withIcon="true" customIcon="mdi-home">
        Default notification bar with icon
      </FrogNotificationBar>
    </Variant>
    <Variant title="full width">
      <FrogNotificationBar :show="true" type="neutral" fullWidth>
        Full width notification bar
      </FrogNotificationBar>
    </Variant>
    <Variant title="warning with icon">
      <FrogNotificationBar :show="true" type="warning" fullWidth :withIcon="true">
        Warning notification bar with icon
      </FrogNotificationBar>
    </Variant>
    <Variant title="error with icon">
      <FrogNotificationBar :show="true" type="error" fullWidth :withIcon="true">
        Error notification bar with icon
      </FrogNotificationBar>
    </Variant>
    <Variant title="success with icon">
      <FrogNotificationBar :show="true" type="success" fullWidth :withIcon="true">
        Success notification bar with icon
      </FrogNotificationBar>
    </Variant>
    <Variant title="success with custom icon">
      <FrogNotificationBar :show="true" type="success" fullWidth :withIcon="true" customIcon="mdi-home">
        Success notification bar with custom icon
      </FrogNotificationBar>
    </Variant>
    <Variant title="success with centered icon">
      <FrogNotificationBar :show="true" type="success" fullWidth :withIcon="true" centerIcon>
        Success notification bar with centered icon.
        Longer text showing that the icon is centered.
        This text is looooooooooooooooooooooooooooooooooong.
      </FrogNotificationBar>
    </Variant>
    <Variant title="variant banner">
      <FrogNotificationBar :show="true" type="neutral" fullWidth variant="banner">
        Notification banner
      </FrogNotificationBar>
    </Variant>
    <Variant title="variant banner with icon">
      <FrogNotificationBar :show="true" type="neutral" fullWidth withIcon customIcon="mdi-home" variant="banner">
        Notification banner with icon
      </FrogNotificationBar>
    </Variant>
    <Variant title="variant banner success with icon">
      <FrogNotificationBar :show="true" type="success" fullWidth :withIcon="true" variant="banner">
        Success notification banner with icon
      </FrogNotificationBar>
    </Variant>
    <Variant title="variant banner warning with icon">
      <FrogNotificationBar :show="true" type="warning" withIcon fullWidth variant="banner">
        Warning notification banner with icon
      </FrogNotificationBar>
    </Variant>
    <Variant title="variant banner error with icon">
      <FrogNotificationBar :show="true" type="error" fullWidth :withIcon="true" variant="banner">
        Error notification banner with icon
      </FrogNotificationBar>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogNotificationBar from '../FrogNotificationBar.vue'
</script>
