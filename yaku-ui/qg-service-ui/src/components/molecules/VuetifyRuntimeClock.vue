<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <div>
      <FrogIcon icon="mdi-timer-outline" />
      <span :key="runtimeClock.counter.value">{{ getRuntime(run) }}</span>
    </div>
</template>

<script setup lang="ts">
import type { TestRun, Run } from '~/types'
import { useInterval } from '@vueuse/core'
import { onUnmounted, watchEffect } from 'vue'
import { getTimeFromMs } from '~/utils'

const props = defineProps<{
  run: Run | TestRun
}>()

const formatTime = (start: Date, end: Date) => {
  const elapsedTime = new Date(end).getTime() - new Date(start).getTime()
  const { minutes, seconds } = getTimeFromMs(elapsedTime)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const getRuntime = (run: (typeof props)['run']) => {
  const { status, creationTime } = run
  if (status === 'running') {
    return formatTime(new Date(creationTime), new Date())
  } else if (status === 'completed' && run.completionTime) {
    return formatTime(new Date(creationTime), new Date(run.completionTime))
  } else {
    return '--:--'
  }
}

const runtimeClock = useInterval(1000, {
  controls: true,
})
onUnmounted(runtimeClock.pause)
watchEffect(() => {
  const tickAction =
    props.run.status === 'running' ? runtimeClock.resume : runtimeClock.pause
  tickAction()
})
</script>
