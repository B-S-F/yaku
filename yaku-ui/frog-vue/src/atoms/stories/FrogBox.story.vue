<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
      <Variant title="Box">
        <FrogBox class="story-wrapper" style="width:50vw;height:200px"
          @backgroundClicked="logEvent('backgroundClicked', undefined)" />
      </Variant>

      <Variant title="Modal Box">
        <div class="story-wrapper">
          <Button @click="showModal = true">
            Click here
          </Button>
          <FrogBox class="story-wrapper" :show="showModal" style="width:50vw;height:50vh"
            @backgroundClicked="logEvent('backgroundClicked', undefined); showModal = false">
            <div
              style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--background)">
              click outside to close
            </div>
          </FrogBox>
        </div>
      </Variant>
    </Story>
  </template>

  <script setup lang="ts">
import { ref } from 'vue'
import { logEvent } from 'histoire/client'
import Button from '../Button.vue'
import Box from '../Box.vue'
import FrogBox from '../FrogBox.vue'

const showModal = ref(false)
</script>

  <style scoped lang="scss">
  .story-wrapper {
    margin: 2rem;
  }
  </style>
