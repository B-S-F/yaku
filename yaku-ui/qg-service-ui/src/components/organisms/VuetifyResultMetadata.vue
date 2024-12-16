<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <section class="result">
    <h3 class="text-h6 font-weight-bold">
      Additional information
    </h3>
    <dl>
      <dt>Fulfilled</dt>
      <dd>{{ result.fulfilled ? 'Yes' : 'No' }}</dd>
      <template v-for="data in metadata" :key="data[0]">
        <dt>{{ data[0] }}</dt>
        <dd>{{ data[1] }}</dd>
      </template>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResultReport } from '~/helpers'

const props = defineProps<{
  result: ResultReport
}>()

const metadata = computed(() => Object.entries(props.result.metadata ?? {}))
</script>

<style scoped lang="scss">
.result {
  width: 400px;
  max-height: 40vh;
  overflow: auto;

  h3 {
    margin: 0 0 $space-component-m 0;
  }

  dl {
    margin: 0;
    display: flex;
    flex-direction: column;
    row-gap: $space-component-xs;
  }

  dt {
    font-weight: 600;
  }

  dd {
    margin-left: 0;
    word-break: break-word;
  }
}
</style>
