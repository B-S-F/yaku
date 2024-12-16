<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="m-approver-item">
    <div class="m-approver-item__info bg-grey-lighten-3">
      <div class="left">
        <VuetifyAvatar :name="username" bg="bg-background" />
        <FrogPopover trigger-on-hover tooltip-alike attached arrowPlacementClass="-without-arrow-top" :label="username"
          class="username">
          <span class="username font-weight-bold text-caption">{{ username }}</span>
        </FrogPopover>
      </div>
      <div class="right">
        <slot name="actions" />
      </div>
    </div>
    <slot name="status" />
  </div>
</template>
<script setup lang="ts">
defineProps<{
  username: string
}>()
</script>
<style scoped lang="scss">
@use "../../styles/tokens.scss" as *;
@use '../../styles/abstract' as *;

.m-approver-item {
  display: flex;
  flex-direction: column;
  row-gap: 1px;
  margin-bottom: $spacing-12;

  &>div {
    padding: $spacing-12 $spacing-12;
  }

  &__info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: $space-component-m;
    height: 56px;


    .left {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      column-gap: $space-component-m;

      .username {
        @extend %inline-ellipsis;
        flex: 1;
      }
    }
  }
}
</style>
