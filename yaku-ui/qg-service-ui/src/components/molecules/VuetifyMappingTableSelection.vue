<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogDropzone class="mapping-table-selection" :class="{ 'dragging': dragging }"
    :style="{ '--scrollOffset': `${scrollTop}px` }" @mousemove="onHandleMove" @mouseup="dragging = undefined"
    @dragover="checkAndScroll">
    <VuetifyTableHandle class="table-handle table-handle--start" label="Start Row" label-pos="bottom"
      @mousedown="dragging = 'start'" />
    <VuetifyTableHandle class="table-handle table-handle--end" label="End Row" label-pos="top"
      @mousedown="dragging = 'end'" />
    <VuetifyMappingTable ref="mappingTableRef" v-bind="attrs" hide-headline-names :table="table"
      :range="[minRange, maxRange]" />
  </FrogDropzone>
</template>

<script setup lang="ts">
import {
  computed,
  onActivated,
  onMounted,
  onUnmounted,
  ref,
  Ref,
  useAttrs,
} from 'vue'
import type MappingTable from '~/components/molecules/MappingTable.vue'
import { useBorderScroll } from '~composables'

const props = defineProps<{
  table: Array<Array<string>>
  range: { startRow: number; endRow: number }
}>()

const emit =
  defineEmits<
    (ev: 'update:range', payload: { startRow: number; endRow: number }) => void
  >()

const attrs = useAttrs()

// Sort the ranges
const minRange = computed(() => Math.min(...Object.values(props.range)))
const maxRange = computed(() => Math.max(...Object.values(props.range)))

const mappingTableRef = ref<InstanceType<typeof MappingTable>>()
const tableContainerRef = computed(() => mappingTableRef.value?.containerRef)
const scrollTop = ref(0)
const onTableScroll = () => {
  scrollTop.value = tableContainerRef.value?.scrollTop ?? 0
}

const minRangeHandlePos = computed(() =>
  minRange.value === 0 ? 0 : minRange.value - 1,
)

// passive to render the UI first, improve smooth scrolling
onMounted(() =>
  tableContainerRef.value?.addEventListener('scroll', onTableScroll, {
    passive: true,
  }),
)
onUnmounted(() =>
  tableContainerRef.value?.removeEventListener('scroll', onTableScroll),
)
onActivated(() => tableContainerRef.value?.scrollTo({ top: scrollTop.value }))

const dragging = ref<'start' | 'end'>()
const canMoveUpdate = ref(true) // bounce during dragging to avoid too much computation
const onHandleMove = (ev: MouseEvent) => {
  if (
    !canMoveUpdate.value ||
    dragging.value === undefined ||
    !tableContainerRef.value
  )
    return
  canMoveUpdate.value = false

  const rowContentHeight = tableContainerRef.value.children[0].clientHeight
  const rowCounts = tableContainerRef.value.querySelectorAll('tbody > *').length
  const heightPerElement = rowContentHeight / rowCounts
  const newYPos =
    scrollTop.value + (ev.y - tableContainerRef.value.getBoundingClientRect().y)
  const newPos = Math.trunc(newYPos / heightPerElement)

  const draggedHandle = dragging.value
  const startRow = draggedHandle === 'start' ? newPos + 1 : minRange.value // +1 for a more intuitive position
  const endRow = draggedHandle === 'end' ? newPos : maxRange.value

  setTimeout(() => (canMoveUpdate.value = true), 16)
  emit('update:range', { startRow, endRow })
}

const { checkAndScroll } = useBorderScroll({
  speed: 7,
  offset: 80,
  axis: 'y',
  scrollingElRef: tableContainerRef as Ref<HTMLDivElement>, // defined because used after onMounted
  isFireable: dragging,
})
onMounted(() =>
  tableContainerRef.value?.parentElement?.addEventListener(
    'mouseover',
    checkAndScroll,
  ),
)
onUnmounted(() =>
  tableContainerRef.value?.parentElement?.removeEventListener(
    'mouseover',
    checkAndScroll,
  ),
)
</script>

<style scoped lang="scss">
// similar to the container in MappingTable
.mapping-table-selection {
  position: relative;
  overflow: hidden;
  max-height: 100%;
  height: 100%;
  min-height: calc($rowHeight * 7);
  margin-left: -$tableHandleLabelLength;
  padding-left: calc($tableHandleLabelLength + 40px);
  padding-right: $scrollBtnSize;

  @media screen and (min-width: $mdScreenWidth) {
    padding-left: $tableHandleLabelLength;
  }

  &:last-child>* {
    margin-top: calc(-2 * #{$handleHeight});
  }
}


.table-handle {
  position: relative;
  overflow: visible;
  left: -2.25rem; // $handleWidth

  @media screen and (min-width: $mdScreenWidth) {
    white-space: nowrap;
  }

  &--start {
    top: calc(#{$rowHeaderHeight} - #{$handleHeightMiddle} + #{$rowHeight} * v-bind(minRangeHandlePos) - var(--scrollOffset));
  }

  &--end {
    top: calc(#{$rowHeaderHeight} - #{$handleHeightMiddle} + #{$rowHeight} * v-bind(maxRange) - var(--scrollOffset));
  }
}

.dragging {
  cursor: grabbing;
  user-select: none;
  -webkit-user-select: none; // safari
}
</style>
