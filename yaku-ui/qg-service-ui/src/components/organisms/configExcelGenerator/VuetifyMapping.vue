<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="mapping">
    <VuetifyStepHeading class="step-heading" heading="Choose the sheet and define the range of content"
      description="Choose the correct sheet of the uploaded file and define the content area by setting the start and row with the handles below or the input fields.">
      <template #after>
        <FrogButton secondary class="dialog-trigger" @click="showHelperDialog = true">
          What to do here?
        </FrogButton>
        <VuetifyMappingHelperDialog v-show="showHelperDialog" v-model:hide-initial="hideHelperDialogDefault"
          :show-dialog="showHelperDialog" @close="showHelperDialog = false" />
      </template>
    </VuetifyStepHeading>
    <div class="main">
      <FrogDropzone v-slot="{ dropZoneActive }" @dropped="park">
        <div class="parking-lot" :class="[{ hover: dropZoneActive }, { 'show-lot': showParkingLot }]">
          <FrogChip v-for="item, index in parkingLot" :id="$id(item.label)" :key="item.label" selected draggable="true"
            :label="item.label" :dragged="draggingChip === item.label" class="font-weight-bold"
            @dragstart="startDrag($event, item)">
            <template #after>
              <VuetifyPopoverInfo v-if="item.description" class="chip-tooltip" pophoverClass="chip-tooltip-popover"
                :arrowPlacementClass="index === 0 ? '-top-left' : '-top-center'"
                :deactivate="draggingChip === item.label" :label="item.description" :triggerOnHover="!draggingChip" />
            </template>
          </FrogChip>
          <div class="parking-lot-filter">
            <FrogChip v-if="hasFilterChip && !mappingList.find((x) => x?.label === FILTER_MAPPING_ITEM.label)"
              :id="$id(FILTER_MAPPING_ITEM.label)" :label="FILTER_MAPPING_ITEM.label" selected draggable="true"
              :dragged="draggingChip === FILTER_MAPPING_ITEM.label" @dragstart="startDrag($event, FILTER_MAPPING_ITEM)">
              <template #after>
                <VuetifyPopoverInfo v-if="FILTER_MAPPING_ITEM.description" class="chip-tooltip"
                  pophoverClass="chip-tooltip-popover" :label="FILTER_MAPPING_ITEM.description"
                  :deactivate="draggingChip === FILTER_MAPPING_ITEM.label" />
              </template>
            </FrogChip>
            <!-- hasFilterChip not working -->
            <FrogToggleSwitch id="filter" v-model="hasFilterChip" rightLabel="Enable Filter Column" />
            <VuetifyPopoverInfo v-if="FILTER_MAPPING_ITEM.description" class="chip-tooltip i-color-default"
              pophoverClass="chip-tooltip-popover" arrowPlacementClass="-top-right"
              :label="FILTER_MAPPING_ITEM.description" />
          </div>
        </div>
      </FrogDropzone>
      <div v-if="selectedRows" class="mapping-table-wrapper">
        <VuetifyMappingTable ref="mappingTableRef" :table="selectedHeaderRow.concat(selectedRows)"
          :selected-cols="selectedCols" :row-counter-shift="range.startRow">
          <tr>
            <td class="no-padding-left">
              <div class="drop-area disabled" />
            </td>
            <td v-for="(item, index) in mappingList" :key="index">
              <FrogDropzone v-slot="{ dropZoneActive }" @dropped="dropped($event, index)">
                <div class="drop-area" :class="[{ hover: dropZoneActive }, { active: !!item }]">
                  <FrogChip v-if="!!item" :id="$id(item.label)" :label="item.label" selected draggable="true"
                    class="font-weight-bold" @dragstart="startDrag($event, item, true)" @dragend="endDrag">
                    <template #after>
                      <VuetifyPopoverInfo v-if="item.description" class="chip-tooltip"
                        pophoverClass="chip-tooltip-popover" :label="item.description"
                        :deactivate="draggingChip === item.label" />
                    </template>
                  </FrogChip>
                  <span v-else>Map here</span>
                </div>
              </FrogDropzone>
            </td>
          </tr>
        </VuetifyMappingTable>
      </div>
      <div class="navigation-buttons">
        <FrogButton secondary icon="mdi-arrow-left" @click="emit('back')">
          Change Content
        </FrogButton>
        <FrogNotificationBar class="notif-bar" :show="!!apiError" type="error" full-width with-icon center-icon
          no-content-margin>
          <BannerContent :label="apiError" @close="apiError = undefined" />
        </FrogNotificationBar>
        <FrogPopover class="mapping-popover" attached triggerOnHover arrowPlacementClass="-top-right"
          :label="NEXT_BUTTON_HINT" :deactivate="isAllMappingItemAssigned">
          <FrogButton icon="mdi-arrow-right" icon-right :disabled="!isAllMappingItemAssigned" @click="onNextClick">
            Generate Files
          </FrogButton>
        </FrogPopover>
      </div>
    </div>
    <Teleport to="#app">
      <VuetifyProcessingActionIndicator v-show="mappingState === 'generating'" isIndeterminate
        label="The file is generating..." />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useId } from '@B-S-F/frog-vue'
import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import {
  computed,
  onDeactivated,
  onMounted,
  onUnmounted,
  Ref,
  ref,
  watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'
import type MappingTable from '~/components/molecules/MappingTable.vue'
import { useDebugMode } from '~/composables/useDebugMode'
import { FILTER_MAPPING_ITEM } from '~/config/configurationCreation'
import { provideRequestError } from '~/helpers'
import { useWorkbookStore } from '~/store/useWorkbookStore'
import type { Config, Mapping } from '~/types'
import { useApiCore, useApiNetworkError } from '~api'
import {
  useBorderScroll,
  useConfigFileGenerator,
  useUrlContext,
} from '~composables'

const emit = defineEmits<{
  (e: 'next'): void
  (e: 'back'): void
  (e: 'error', error: string): void
}>()

const { $id } = useId()
const { urlContext } = useUrlContext()

type MappingState = 'idle' | 'generating'
const mappingState = ref<MappingState>('idle')

const NEXT_BUTTON_HINT =
  'All chips must be distributed to the columns before the file can be generated!'
const {
  relatedConfig,
  selectedHeaderRow,
  selectedRows,
  selectedSheet,
  range,
  file,
  unassignedMappingItems: parkingLot,
  assignedMappingItems: mappingList,
  isFilterMappingActive: hasFilterChip,
} = storeToRefs(useWorkbookStore())

const mappingTableRef = ref<InstanceType<typeof MappingTable> | null>()
const showParkingLot = ref(false)

/** apply a dragging effect on a chip and scroll the table on drag too */
const draggingChip = ref<Mapping['label']>()
const clearDraggingChip = () => (draggingChip.value = undefined)

const scrollingElRef = computed(() => mappingTableRef.value?.containerRef)
const { checkAndScroll } = useBorderScroll({
  axis: 'x',
  scrollingElRef: scrollingElRef as Ref<HTMLDivElement>, // defined because used after onMounted
  isFireable: draggingChip,
})
onMounted(() => {
  document.addEventListener('dragend', clearDraggingChip)
  scrollingElRef.value?.addEventListener('dragover', checkAndScroll)
})
onUnmounted(() => {
  document.removeEventListener('dragend', clearDraggingChip)
  scrollingElRef.value?.removeEventListener('dragover', checkAndScroll)
})

const hideHelperDialogDefault = useLocalStorage(
  'use-case-1-step-3-hide-helper-default',
  false,
)
const showHelperDialog = ref(false)
const isAllMappingItemAssigned = computed(() => parkingLot.value.length === 0)

const selectedCols = computed(
  () =>
    mappingList.value
      .map((x, i) => (x ? i : null))
      .filter((x) => x !== null) as unknown as number[],
)

const dropped = (e: DragEvent, index: number) => {
  clearDraggingChip()

  const label = e.dataTransfer?.getData('label') ?? ''
  const description = e.dataTransfer?.getData('description') ?? ''

  const mappingListIndex = mappingList.value.findIndex(
    (item) => item?.label === label,
  )
  const parkingLotIndex = parkingLot.value.findIndex(
    (item) => item?.label === label,
  )

  // when coming from parkingLot remove item from parkingLot
  // if alrdy an item in the mapped cell return the cell item to the parkingLot
  if (parkingLotIndex >= 0) {
    parkingLot.value.splice(parkingLotIndex, 1)

    if (mappingList.value[index]) {
      parkingLot.value.push(mappingList.value[index]!)
    }

    mappingList.value[index] = { label, description }
    return
  }

  // when already a mapping, swap the mappings
  if (mappingList.value[index]) {
    mappingList.value[mappingListIndex] = mappingList.value[index]
  } else if (mappingListIndex >= 0) {
    // when already in mapping list remove it
    mappingList.value[mappingListIndex] = null
  }

  mappingList.value[index] = { label, description }
}

const park = (e: DragEvent) => {
  const label = e.dataTransfer?.getData('label') ?? ''
  const description = e.dataTransfer?.getData('description') ?? ''
  const mappingListIndex = mappingList.value.findIndex(
    (item) => item?.label === label,
  )
  const parkingLotIndex = parkingLot.value.findIndex(
    (item) => item?.label === label,
  )

  if (parkingLotIndex < 0) {
    mappingList.value[mappingListIndex] = null
    if (label !== FILTER_MAPPING_ITEM.label) {
      parkingLot.value.push({ label, description })
    }
  }
}

const startDrag = (event: DragEvent, item: Mapping, showLot?: boolean) => {
  if (!event.dataTransfer) return

  if (showLot) {
    showParkingLot.value = true
  }

  draggingChip.value = item.label
  ;(event.target as HTMLElement)?.setAttribute('dragged', 'true')
  event.dataTransfer.dropEffect = 'move'
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('label', item.label)
  event.dataTransfer.setData('description', item.description ?? '')
}

const endDrag = (event: DragEvent) => {
  showParkingLot.value = false
  clearDraggingChip()
  ;(event.target as HTMLElement)?.removeAttribute('dragged')
}

// remove FILTER_MAPPING_ITEM if it is disabled
watchEffect(() => {
  if (hasFilterChip.value) return

  const indexCandidate = mappingList.value.findIndex(
    (v) => v?.label === FILTER_MAPPING_ITEM.label,
  )
  if (indexCandidate === -1) return
  mappingList.value[indexCandidate] = null
})

const api = useApiCore()
const apiError = ref<string>()
useDebugMode({ errorState: apiError })
onDeactivated(() => (apiError.value = undefined))

const router = useRouter()

const onApiErrorProcess = async (
  errorMsg = 'The configuration file could not be generated due to an unknown error.',
) => {
  if (!relatedConfig.value) return
  const r = await api.deleteConfig({ configId: relatedConfig.value.id })
  if (r.ok) relatedConfig.value = null
  emit('error', errorMsg)
}

const createConfig = async () => {
  const r = await api.postConfig({
    name: file.value?.name ?? '',
    description: '',
  })
  if (r.ok) {
    relatedConfig.value = await r.json()
  } else {
    onApiErrorProcess('The processing of the mapping failed. Please try again.')
  }
  return r.ok
}

const onNextClick = async () => {
  mappingState.value = 'generating'
  const configFile = useConfigFileGenerator({
    filename: file.value?.name ?? '',
    sheetName: selectedSheet.value.value.toString(),
    startRow: range.value.startRow,
    endRow: range.value.endRow,
    mappingList: mappingList.value,
  }).file.value
  try {
    // if no config is set at this point, create one. If everything run smoothly, one is created from step 1.
    if (!relatedConfig.value) {
      const isOk = await createConfig()
      if (!isOk) {
        onApiErrorProcess(
          'The processing of the mapping failed. Please try again',
        )
        return
      }
    }
    // if there is still no related configuration after trying to create one, abort
    if (!relatedConfig.value) return
    const configId = relatedConfig.value.id
    // delete placeholder file if there is one
    let r = await api.deleteFileInConfig({
      configId,
      filename: 'qg-config.yaml',
    })
    if (!r.ok) {
      onApiErrorProcess(
        'The processing of the mapping failed. Please try again.',
      )
      return
    }
    // generate the configuration
    r = await api.initConfigFromExcel({
      configId: relatedConfig.value.id,
      xlsx: file.value?.file as File,
      configFile,
    })
    if (!r.ok) {
      onApiErrorProcess(await provideRequestError(r))
      return
    }
    // update the config stored in the frontend
    r = await api.getConfig({ configId })
    if (!r.ok) {
      onApiErrorProcess(await provideRequestError(r))
      return
    }
    relatedConfig.value = (await r.json()) as Config
    // open this config if everything is all right
    router.push({
      name: 'EditConfig',
      params: { ...urlContext.value, id: configId },
    })
  } catch (err) {
    apiError.value = useApiNetworkError()
  } finally {
    mappingState.value = 'idle'
  }
}
</script>

<style scoped lang="scss">
.mapping {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);

  .main {
    height: 100%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
}

.dialog-trigger {
  padding: 0 2rem;
  height: fit-content;
}

.parking-lot {
  margin-bottom: 20px;
  height: 50px;
  width: 100%;
  padding: 9px 0px;
  box-sizing: border-box;
  border: 1px dashed transparent;
  position: relative;
  display: flex;
  gap: 1em;
  align-items: center;

  &.show-lot {
    background-color: #FAFAFA; // grey-lighten-5
    border-color: #757575; // grey-darken-1
    color: #757575; // grey-darken-1

    .-dark-mode & {
      background-color: #212121; // grey-darken-4
      border-color: #BDBDBD; // grey-lighten-1
      color: #BDBDBD; // grey-lighten-1
    }

    &::after {
      content: 'Park here';
      font-style: italic;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    &.hover {
      background-color: var(--v-theme-background);
      border-color: #1E88E5; // blue-darken-1
    }
  }

  &-filter {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}

.v-chip {
  gap: 8px;
  background-color: #1E88E5; // blue-darken-1
  color: #FFFFFF;
}

// tooltip icon as chips have a blue background, thus make the icon white
.chip-tooltip {
  width: calc(1.5rem + 8px);

  &:not(.i-color-default) :deep(i) {
    color: var(--v-theme-background);
  }
}

// enforce popover width
:global(.chip-tooltip-popover),
:global(.mapping-popover) {
  --width: 24rem;
}

:global(.chip-tooltip-popover) {
  --x-shift: -4px;
}

:global(.chip-tooltip-popover--sm) {
  --x-shift: calc(-100% + 24px);
}

tr td.no-padding-left {
  padding-left: 0;
}

.mapping-table-wrapper {
  position: relative;
  height: inherit;
  overflow: hidden;
  width: 100%;
  height: 100%;
  padding-right: $scrollBtnSize;

  td {
    padding: 4px;
    border-bottom: 0;

    >* {
      height: 100%;
    }

    .drop-area,
    &.drop-area {
      background-color: #FAFAFA; // grey-lighten-5
      border: 1px dashed #757575; // grey-darken-1
      color: #757575; // grey-darken-1
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 0 4px;

      .-dark-mode & {
        background-color: #212121; // grey-darken-4
        border: 1px dashed #BDBDBD; // grey-lighten-1
        color: #BDBDBD; // grey-lighten-1
      }

      &.active {
        border-style: solid;
        border: 1px solid #1E88E5; // blue-darken-1 //
        background-color: var(--v-theme-background); // var(--background);
      }

      &.disabled {
        border: none;
      }

      &.hover,
      &:hover {
        border: 1px solid #1E88E5; // blue-darken-1 //
        background-color: var(--v-theme-background); // var(--background);
      }

    }
  }
}

.navigation-buttons {
  column-gap: 24px;
  // rest in parent component
}

.notif-bar {
  flex-grow: 1;
  align-items: center;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
