<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div :key="x" class="onboarding-target">
    <FrogPopover class="onboarding-highlight" attached :show="!!onboardingStep && isActive" closeable
      :arrowPlacementClass="onboardingStep?.arrowPlacement" pophoverClass="onboarding-context" @close="stop">
      <template #headline>
        <h1 v-if="onboardingStep" class="text-subtitle-1 font-weight-bold">
          {{ onboardingStep.heading }}
        </h1>
      </template>
      <template #content>
        <template v-if="onboardingStep">
          <div ref="onboardingRef" class="onboarding-step" :style="{ maxWidth: maxWidth }">
            <!-- eslint-disable vue/no-v-html -->
            <p v-html="onboardingStep.description" />
            <img v-if="onboardingStep.imagePath" :src="onboardingStep.imagePath">
            <div class="bottom-bar">
              <span class="text-body-2 text">{{ step + 1 }}/{{ totalSteps }}</span>
              <div class="actions">
                <FrogButton v-if="hasPrev" secondary icon="mdi-chevron-left" data-cy="onboarding-prev"
                  @click.prevent="prev">
                  Previous
                </FrogButton>
                <FrogButton v-if="hasNext" primary icon="mdi-chevron-right" icon-right data-cy="onboarding-next"
                  @click.prevent="next">
                  Next
                </FrogButton>
                <FrogButton v-else secondary icon="mdi-close" data-cy="onboarding-stop" @click.prevent="stop">
                  Close
                </FrogButton>
              </div>
            </div>
          </div>
        </template>
      </template>
    </FrogPopover>
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useIsOnboardingActive } from '~/composables/onboarding/useIsOnboardingActive'
import { useOnboardElement } from '~/composables/onboarding/useOnboardElement'

const { isActive } = useIsOnboardingActive()
const onboardingRef = ref()
onClickOutside(onboardingRef, (e) => {
  e.stopPropagation()
  stop()
})

const {
  elementRect,
  onboardingStep,
  step,
  totalSteps,
  hasNext,
  next,
  hasPrev,
  prev,
  stop,
} = useOnboardElement()
const toPx = (n: number) => `${n}px`

const x = computed(() => toPx(elementRect.value.x.value))
const y = computed(() => toPx(elementRect.value.y.value))
const height = computed(() => toPx(elementRect.value.height.value))
const width = computed(() => toPx(elementRect.value.width.value))
const maxWidth = computed(() => onboardingStep.value?.maxWidth ?? '700px')
</script>

<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as *;

.onboarding-target {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: grid;
  grid-template-rows: v-bind(y) v-bind(height) auto;
  grid-template-columns: v-bind(x) v-bind(width) auto;

  >*:not(.onboarding-highlight) {
    pointer-events: all;
    background-color: #6f757b40;
    backdrop-filter: blur(2px);
  }
}

.onboarding-highlight {
  grid-row: 2 / 3;
  grid-column: 2 / 3;
}

.onboarding-step {
  .bottom-bar {
    @include flexbox(row, space-between, center);
  }
}

h1 {
  margin: 0;
}

img {
  width: 100%;
  height: auto;
  padding-bottom: $spacing-16;
}

.onboarding-step {
  .bottom-bar {
    .actions {
      display: flex;
      column-gap: $space-component-l;
      justify-content: end;

      .v-btn {
        margin-bottom: inherit;
      }
    }
  }
}


:global(.onboarding-context .actions) {
  display: flex;
  column-gap: $space-component-l;
  justify-content: end;
}

:global(.onboarding-context .v-btn) {}
</style>
