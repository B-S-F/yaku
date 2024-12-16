<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Line ref="lineChartRef" :data="data" :options="options" />
</template>

<script setup lang="ts">
import {
  type ComplexFillTarget,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Legend,
  TimeScale,
  CoreChartOptions,
  type ActiveElement,
} from 'chart.js'
import 'chartjs-adapter-spacetime'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { type ChartComponentRef, type ChartProps, Line } from 'vue-chartjs'
import { useColorScheme } from '~/composables'

/**
 * The component does not rely on the time serie of chart js to avoid supplementary date formatter dependencies. See a required one: https://github.com/chartjs/awesome#adapters
 *
 */
const props = defineProps<{
  points: Array<{ x: Date; y: number }>
  range: [Date, Date]
  mode?: 'week' | 'month' | 'quarter' | 'half' | 'year'
}>()

const emit =
  defineEmits<
    (
      e: 'hover-point',
      payload:
        | {
            canvas: HTMLCanvasElement | undefined
            element: ActiveElement
            point: (typeof props)['points'][number]
          }
        | undefined,
    ) => void
  >()

ChartJS.register(
  CategoryScale,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Legend,
  Filler,
)

const { colorScheme } = useColorScheme()
const LIGHT_THEME = {
  TEXT_COLOR: '#979EA4', // Schemes/Primary background/Plain/Disabled front default
  LINE_COLOR: '#56B0FF', // Schemes/Primary background/Minor signal neutral/Enabled fill pressed
  GRADIENT_20: '#9DC9FFFF',
  GRADIENT_80: '#FFFFFFA0',
  POINT_BORDER_COLOR: '#FFFFFF',
  COLOR_TRANSPARENT: '#FFFFFFFF',
}
const DARK_THEME = {
  TEXT_COLOR: '#595e62', // Schemes/Primary background/Plain/Disabled front default
  LINE_COLOR: '#007bc0', // Schemes/Primary background/Minor signal neutral/Enabled fill pressed
  GRADIENT_20: '#007bc0FF',
  GRADIENT_80: '#00629a00',
  POINT_BORDER_COLOR: '#1A1C1D',
  COLOR_TRANSPARENT: '#00000000',
}

const theme = computed(() =>
  colorScheme.value === 'light' ? LIGHT_THEME : DARK_THEME,
)
const yMax = computed(() =>
  props.points.reduce((acc, p) => (acc < p.y ? p.y : acc), 0),
)

const CHART_Y_MIN = 0
/** the chart Y max value is always 5% higher than the highest point. */
const chartYMax = computed(() => Math.trunc(yMax.value * 1.05) + 1)
/** set 4 different steps in total (each step is 25%) */
const findingStep = computed(() => Math.ceil(chartYMax.value * 0.25))

const data = computed<ChartProps<'line'>['data']>(() => ({
  datasets: [
    {
      // force type casting as the Date object is not allowed for ChartProps in ts file declarations
      data: props.points as unknown as { x: number; y: number }[],
      backgroundColor: theme.value.LINE_COLOR as string | CanvasGradient,
      borderWidth: 2,
      borderColor: theme.value.LINE_COLOR,
      pointBackgroundColor: theme.value.LINE_COLOR,
      pointBorderWidth: 2,
      pointBorderColor: theme.value.POINT_BORDER_COLOR,
      pointRadius: 5,
      pointHitRadius: 8,
      fill: {
        // above property is defined at runtime
        target: 'origin',
      },
    },
  ],
}))

const formatXaxis = (x: string | number) => {
  if (props.mode === 'year')
    return new Date(x).toLocaleString('default', { month: 'short' })
  else if (props.mode === 'week')
    return new Date(x).toLocaleString('default', { weekday: 'short' })

  return new Date(x).toLocaleString('default', {
    day: '2-digit',
    month: 'short',
  })
}

const windowWidth = ref(window.innerWidth)
const updateWindowWidth = () => (windowWidth.value = window.innerWidth)
const showCursive = computed(
  () => windowWidth.value < 1210 && (props.mode === 'half' || props.mode),
)

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

const options = computed<ChartProps<'line'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'point',
  },
  onHover(event, elements, chart) {
    if (event.type === 'mousemove') handlePointTooltip(event, elements, chart)
  },
  plugins: {
    legend: {
      display: false,
    },
    title: {
      align: 'start',
      color: theme.value.TEXT_COLOR,
      display: true,
      text: '# Findings',
      padding: { bottom: 12 },
    },
  },
  scales: {
    x: {
      type: 'time',
      // monkey patch the wrong expected types as a date type works
      min: props.range[0] as unknown as string,
      max: props.range[1] as unknown as string,
      grid: {
        display: false,
      },
      ticks: {
        /** optimize the amount of ticks to format */
        sampleSize: props.mode === 'week' ? 7 : 12,
        /** set the amount of ticks to display */
        maxTicksLimit: props.mode === 'week' ? 7 : 12,
        color: theme.value.TEXT_COLOR,
        autoSkip: false,
        align: 'inner',
        callback: formatXaxis,
        font: {
          style: showCursive.value ? 'italic' : 'normal',
        },
        minRotation: showCursive.value ? 45 : 0,
        maxRotation: showCursive.value ? 45 : 0,
      },
    },
    y: {
      min: CHART_Y_MIN,
      max: chartYMax.value,
      ticks: {
        color: theme.value.TEXT_COLOR,
        stepSize: findingStep.value,
        callback: (v) => {
          return Math.round(Number(v))
        },
      },
      border: {
        display: false,
      },
    },
  },
}))

const lineChartRef = ref<ChartComponentRef<'line'>>()
/** trigger the watcher when the DOM is set **and** the properties of the chart are set, so flush: 'post'. */
watch(
  [lineChartRef, theme, props],
  ([newLineChart, newTheme], [_, oldTheme]) => {
    const chart = newLineChart?.chart
    if (!chart) return

    const canvas = chart.canvas
    const gradient = chart.ctx.createLinearGradient(
      0,
      0,
      0,
      canvas.offsetHeight,
    )
    // the top 20% is not transparent
    gradient.addColorStop(0, theme.value.LINE_COLOR)
    // 20-80% gets a progressive transparency
    gradient.addColorStop(0.2, theme.value.GRADIENT_20)
    gradient.addColorStop(0.8, theme.value.GRADIENT_80)
    // the last 20% is totally transparent (no fill color)
    gradient.addColorStop(1, theme.value.COLOR_TRANSPARENT)
    ;(data.value.datasets[0].fill as ComplexFillTarget).above = gradient

    // if the user change the theme, update the chart gradient accordingly
    if (oldTheme.LINE_COLOR !== newTheme.LINE_COLOR) chart.update()
  },
  { flush: 'post' },
)

const handlePointTooltip: CoreChartOptions<'line'>['onHover'] = (
  _event,
  elements,
  _chart,
) => {
  const canvas = lineChartRef.value?.chart?.canvas
  if (!canvas) return
  const isHoveringAPoint = elements.length > 0
  canvas.style.cursor = isHoveringAPoint ? 'pointer' : 'default'
  if (!isHoveringAPoint) {
    emit('hover-point', undefined)
  } else {
    const element = elements[0]
    const point = props.points[element.index]
    emit('hover-point', { canvas, element, point })
  }
}
</script>
