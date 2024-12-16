<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="containerRef" class="table-container">
    <table class="m-table"
      :class="{ 'with-range': range, 'with-col-selection': selectedCols && selectedCols.length > 0 }"
      aria-label="mapping-table">
      <thead v-for="row, index in table.slice(0, 1)" :key="index">
        <!-- the mapping control should get inserted in the slot -->
        <slot />
        <tr>
          <th />
          <th v-for="(col, i) in row" :key="i">
            {{ `(${columnIds[i]}) ${!hideHeadlineNames && col ? col : ''}` }}
          </th>
          <th v-for="(_, i) in new Array(Math.max(0, maxColAmount - row.length))" :key="i">
            {{ `(${columnIds[i + row.length]})` }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in table.slice(hideHeadlineNames ? 0 : 1)" :key="index"
          :class="{ 'in-range': isInRange(index), 'header': isHeader(index) }">
          <td>({{ rowCounterShift + index }})</td>
          <td v-for="(col, i) in row" :key="i" :title="col" :class="{ 'selected-col': selectedCols?.includes(i) }">
            {{ col }}
          </td>
          <td v-for="(_, i) in new Array(maxColAmount - row.length)" :key="i"
            :class="{ 'selected-col': selectedCols?.includes(row.length + i) }" />
        </tr>
      </tbody>
    </table>
  </div>
  <FrogScrollbar v-if="showScrollbarX" axis="x" :progress="scrollbarXProgress" :size="scrollbarXThumbSize"
    class="frog-scrollbar-x" @scroll="onScrollXProgress($event)" @first-btn-click="scrollFarLeft"
    @last-btn-click="scrollFarRight" />
  <FrogScrollbar v-if="showScrollbarY" axis="y" :progress="scrollbarYProgress" :size="scrollbarYThumbSize"
    @scroll="onScrollYProgress($event)" @first-btn-click="scrollFarTop" @last-btn-click="scrollFarBottom" />
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { sheetColumnNameIterator } from '~/utils/sheetColumnName'
import { useScrollbar } from '~composables'

const props = withDefaults(
  defineProps<{
    table: Array<Array<string>>
    hideHeadlineNames?: boolean
    /** range[0] is the lower bound and range[1] the upper bound */
    range?: [number, number]
    /** the first row starts at 1. */
    rowCounterShift?: number
    selectedCols?: number[]
  }>(),
  {
    rowCounterShift: 1,
  },
)

const maxColAmount = computed(() =>
  props.table?.reduce((acc, row) => Math.max(acc, row.length), 0),
)
const containerRef = ref<HTMLDivElement>()

const columnIds = computed(() => {
  const columnNameGenerator = sheetColumnNameIterator()
  return new Array(maxColAmount.value)
    .fill(undefined)
    .map(() => columnNameGenerator.next().value)
})

const isHeader = (index: number) => props.range && props.range[0] === index + 2
const isInRange = (index: number) =>
  props.range && props.range[0] <= index + 1 && index + 1 <= props.range[1]

const onTableChangeToggle = ref<number>(0)
watchEffect(() => {
  if (props.table) {
    onTableChangeToggle.value += 1
  }
})
const {
  scrollPos: scrollTop,
  scrollbarProgress: scrollbarYProgress,
  onScrollProgress: onScrollYProgress,
  scrollToStart: scrollFarTop,
  scrollToEnd: scrollFarBottom,
  thumbSize: scrollbarYThumbSize,
  isScrollable: showScrollbarY,
} = useScrollbar({
  axis: 'y',
  container: containerRef,
  childSelector: 'table',
  forceRefresh: onTableChangeToggle,
})
const {
  scrollPos: scrollLeft,
  scrollbarProgress: scrollbarXProgress,
  onScrollProgress: onScrollXProgress,
  scrollToStart: scrollFarLeft,
  scrollToEnd: scrollFarRight,
  thumbSize: scrollbarXThumbSize,
  isScrollable: showScrollbarX,
} = useScrollbar({
  axis: 'x',
  container: containerRef,
  childSelector: 'table',
  forceRefresh: onTableChangeToggle,
})

defineExpose({
  containerRef,
  scrollTop,
  scrollLeft,
})
</script>

<style scoped lang="scss">
$buttonSize: 24px;
$borderWidth: 0.06rem;

.table-container {
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  position: relative;
  padding: 0 $buttonSize $buttonSize 0;

  /** Hide native scrollbars */
  -ms-overflow-style: none; // IE
  scrollbar-width: none; // Firefox

  &::-webkit-scrollbar {
    display: none; // Chromium
  }
}

.m-table thead th {
  border-color: #E0E0E0; // grey-lighten-2 ;
}

thead {
  position: sticky;
  top: -1px; // avoid overflow from the tbody cells
  background-color: #FFFFFF;

  .-dark-mode & {
    background-color: #000000; // grey-darken-3
  }

  font-weight: 400;
  z-index: 1; // selection bars are hidden
}

td,
th {
  text-overflow: ellipsis;
  overflow-x: clip;
  white-space: nowrap;
  min-width: 100px;
  max-width: 600px;
  width: 100%;
  min-height: $rowHeight;
  max-height: $rowHeight;
  height: $rowHeight;
}

th {
  text-align: left;
}

td {
  border-right-width: $borderWidth;
}

tbody tr td:first-child {
  font-weight: 700;
}

%cell-greyed {
  background-color: #F5F5F5; // grey-lighten-4

  .-dark-mode {
    background-color: #424242; // grey-darken-3
  }
}

%cell-disabled {
  @extend %cell-greyed;
  color: #EEEEEE; // grey-lighten-3

  .-dark-mode {
    background-color: #212121; // grey-darken-4
  }
}

.with-range tbody tr {
  $lineHeight: 4px;

  // rows not in range are greyed
  &:not(.in-range):not(.header) {
    @extend %cell-disabled;
  }

  // line above the first boundary line is bold
  &.header td {
    font-weight: 700;
    @extend %cell-greyed;
  }

  // avoid bold layout shift if the row gets .header class
  td[title]::after {
    content: attr(title);
    height: 0;
    visibility: hidden;
    overflow: hidden;
    font-weight: 900;
  }

  // make the first column sticky so the row number is always visible
  td:first-of-type {
    position: sticky;
    left: 0;
    // the border is not sticky
    box-shadow: inset -#{$borderWidth} 0 0 #000000;
    border-right: none;
  }

  // Boundaries of the range have a dedicated border:
  // select the first row in range
  &:not(.in-range)+tr.in-range,
  // select the first row in range (special first row)

  &.in-range:first-of-type,
  // select the row after the last row in-range

  &.in-range+tr:not(.in-range),
  // select the row after the last row in-range (special last row)
  &.in-range:last-of-type {
    position: relative;
    overflow-y: visible; // display the bar in the middle

    td:last-of-type:before {
      position: absolute;
      content: "";
      width: 100%;
      top: 1px; // avoid thin selection bar if start row = 1
      left: 0;
      height: $lineHeight;
      background-color: #2196F3; // blue
      transform: translateY(-#{$lineHeight * 0.5}); // put in exactly between two cells, on the border
    }
  }

  &.in-range td:first-of-type {
    background-color: var(--v-theme-background);
  }

  &:not(.in-range) td:first-of-type {
    background-color: #FAFAFA; // grey-lighten-5
  }

  // on the last line, put it at the last bottom border
  &.in-range:last-of-type>td:last-of-type:before {
    top: 100%;
  }
}

.with-col-selection tbody {
  tr td:not(.selected-col):not(:first-of-type) {
    @extend %cell-disabled;
  }
}

.frog-scrollbar-x {
  position: absolute;
  bottom: 0 !important;
  left: 0;
  width: 100%;
}
</style>
