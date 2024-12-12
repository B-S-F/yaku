// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { OnboardingStep } from '~/types'
import { ref, computed, watch } from 'vue'
import { useIsOnboardingActive } from './useIsOnboardingActive'
import { onboardingTour } from './useOnboarding'
import { useElementBounding } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { useUrlContext } from '~/composables/useUrlContext'
import { useMockServiceWorker } from '~/composables/useMockServiceWorker'
import { ROUTE_NAMES } from '~/router'

export const onboardElement = ref<HTMLElement>()

export const useOnboardElement = () => {
  const INACTIVE_STEP_VALUE = -1
  const step = ref(INACTIVE_STEP_VALUE)
  const onboardingStep = ref<OnboardingStep>()

  const { urlContext } = useUrlContext()

  const { isActive } = useIsOnboardingActive()
  const elementRect = computed(() => useElementBounding(onboardElement.value))

  const router = useRouter()
  const route = useRoute()

  const mockServiceWorker = useMockServiceWorker()

  const setOnboardingToStep = (nextOnboardingStep: OnboardingStep) => {
    const el = document.querySelector(
      `[data-onboarding="${nextOnboardingStep.selector}"]`,
    ) as HTMLElement | null

    if (!el) {
      console.error(
        `The element "${nextOnboardingStep.selector}" can not be selected for the onboarding.`,
      )
      return
    }
    onboardElement.value = el
    onboardingStep.value = nextOnboardingStep

    if (!el.classList.contains('onboarding-element-without-focus')) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const start = async () => {
    await mockServiceWorker.start()

    step.value = 0
    const onboardingStep = onboardingTour.value?.at(step.value)
    if (onboardingStep) setOnboardingToStep(onboardingStep)
  }
  watch(
    isActive,
    (newIsActive) => {
      if (newIsActive) start()
    },
    { immediate: true },
  )

  const stop = async () => {
    isActive.value = false
    onboardElement.value = undefined

    if (ROUTE_NAMES.RUN_RESULTS !== route.name) {
      await mockServiceWorker.stop()
    } else {
      watch(
        () => route.name,
        async () => {
          await mockServiceWorker.stop()
        },
      )
    }
  }

  const navigateToElement = async (direction: 'next' | 'prev') => {
    const link = onboardingTour.value?.at(step.value)
    switch (direction === 'next' ? link?.linkToNext : link?.linkToPrev) {
      case 'lastRun':
        return `${route.fullPath}/1/results`
      case 'runs-overview':
        return `/${urlContext.value.serverSlug}/${urlContext.value.namespaceSlug}/runs`
      case 'lastRelease':
        return `/${urlContext.value.serverSlug}/${urlContext.value.namespaceSlug}/releases/1/details/checks`
      case 'releases-overview':
        return `/${urlContext.value.serverSlug}/${urlContext.value.namespaceSlug}/releases`
      case 'history':
        return `/${urlContext.value.serverSlug}/${urlContext.value.namespaceSlug}/releases/1/details/history`
    }
  }

  const next = async () => {
    const linkToNext = onboardingTour.value?.at(step.value)?.linkToNext
    if (linkToNext) {
      if (linkToNext === 'lastRun') {
        await router.push(
          `/${urlContext.value.serverSlug}/${urlContext.value.namespaceSlug}/runs`,
        )
      }
      await router.push(`${await navigateToElement('next')}`)
    }
    handleDirections(1)
  }

  const prev = async () => {
    if (onboardingTour.value?.at(step.value)?.linkToPrev) {
      await router.push(`${await navigateToElement('prev')}`)
    }
    handleDirections(-1)
  }

  const handleDirections = (direction: number) => {
    step.value += direction
    const onboardingStep = onboardingTour.value?.at(step.value)
    if (onboardingStep) setOnboardingToStep(onboardingStep)
  }

  return {
    isActive,
    elementRect,
    onboardingStep,
    step,
    totalSteps: computed(() => onboardingTour.value?.length),
    start,
    hasNext: computed(
      () => step.value < (onboardingTour.value?.length ?? 0) - 1,
    ),
    next,
    hasPrev: computed(
      () =>
        INACTIVE_STEP_VALUE + 1 < step.value &&
        step.value < (onboardingTour.value?.length ?? 0),
    ),
    prev,
    stop,
  }
}
