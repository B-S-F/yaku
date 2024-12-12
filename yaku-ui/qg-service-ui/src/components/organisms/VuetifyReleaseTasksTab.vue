<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="o-release-tasks">
    <div class="o-release-tasks__header">
      <div class="o-release-tasks__filters">
        <ul class="semantic-list">
          <li v-for="item in FILTERS" :key="item.value">
            <FrogChip :id="item.value" :label="item.label" :selected="activeFilter === item.value" class="text-black" :class="{ 'bg-background': activeFilter === item.value}"
              @click="handleSelectFilter(item.value)" />
          </li>
        </ul>
      </div>
      <VuetifyYakuDropdown id="findings-group-by" v-model="selectedSortBy" v-model:open="showSortBy" dynamicWidth
      :icon="selectedSortBy.value == 'DESC' ? 'mdi-sort-alphabetical-descending' : 'mdi-sort-alphabetical-ascending'" data-cy="sort-by" label="Sort By" :options="SORT_BY_OPTIONS" />
    </div>
    <div v-if="isLoading" class="o-release-history__loading-indicator">
      <FrogActivityIndicator />
    </div>
    <VuetifyNoItems v-else-if="tasks.length < 1" label="No items" />
    <div v-else ref="containerRef" class="o-release-tasks__items bg-background">
      <ul class="semantic-list">
        <li v-for="task in tasks" :key="task.id">
          <VuetifyReleaseTask :task="task" :release-id="props.releaseId"
            @reopen="async () => handleReopenTask(props.releaseId, task.id)"
            @resolve="async () => handleResolveTask(props.releaseId, task.id)"
            @delete="async () => handleDeleteTask(props.releaseId, task.id)" />
        </li>
      </ul>
    </div>
    <FrogNotificationBar :show="!!apiError && !isLoading" variant="banner" type="error" full-width with-icon
      center-icon>
      <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
    </FrogNotificationBar>
  </div>
</template>
<script setup lang="ts">
import { SelectItem } from '@B-S-F/frog-vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SortOrder } from '~/api/common'
import useReleaseTasksTab from '~/composables/releaseDetails/useReleaseTasksTab'
import useReleaseTasksStore from '~/store/useReleaseTasksStore'
import { TaskFilter } from '~/types/Task'

const props = defineProps<{
  releaseId: number
  isClosed: boolean
}>()

const {
  isLoading,
  apiError,
  handleResolveTask,
  handleDeleteTask,
  handleReopenTask,
} = useReleaseTasksTab()
const tasksStore = useReleaseTasksStore()
const { fetchReleaseTasks } = tasksStore
const { activeFilter, activeSort, sortedTasks: tasks } = storeToRefs(tasksStore)
const router = useRouter()
const route = useRoute()

/**
 * Constants
 */
const FILTERS: SelectItem<TaskFilter>[] = [
  {
    value: 'open',
    label: 'Open',
  },
  {
    value: 'closed',
    label: 'Completed',
  },
  {
    value: 'assigned',
    label: 'Assigned to me',
  },
  {
    value: 'overdue',
    label: 'Overdue',
  },
]

const SORT_BY_OPTIONS: SelectItem<SortOrder>[] = [
  {
    value: 'DESC',
    label: 'Descending',
  },
  {
    value: 'ASC',
    label: 'Ascending',
  },
]
/**
 * State
 */
const selectedSortBy = computed({
  get() {
    const v = activeSort.value
    return SORT_BY_OPTIONS.find((opt) => opt.value === v) ?? SORT_BY_OPTIONS[0]
  },
  async set(v) {
    router.replace({
      query: {
        ...route.query,
        sortOrder: v.value,
      },
    })
    activeSort.value = v.value
  },
})
const handleSelectFilter = async (filter: TaskFilter) => {
  if (!filter) return
  activeFilter.value = filter && filter === activeFilter?.value ? '' : filter
  router.replace({
    query: {
      ...route.query,
      filter: activeFilter.value,
    },
  })
}
const showSortBy = ref<boolean>(false)

onMounted(async () => {
  const { filter, sortOrder } = route.query
  activeFilter.value = filter as string
  activeSort.value = sortOrder as SortOrder
  await fetchReleaseTasks(props.releaseId)
})
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as Tokens;
@use '../../styles/mixins/flex.scss' as Flex;

.o-release-tasks {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  row-gap: Tokens.$spacing-16;
  height: 100%;

  @media screen and (max-width: Tokens.$bp-max-1020) {
    column-gap: Tokens.$spacing-16;
  }

  &__header {
    @include Flex.flexbox($justify: space-between);

    @media screen and (max-width: Tokens.$bp-max-1020) {
      flex-wrap: wrap;
      row-gap: Tokens.$spacing-16;
    }
  }

  &__filters ul.semantic-list {
    @include Flex.flexbox;
    column-gap: Tokens.$spacing-16;
  }

  &__items {
    padding: 24px;
    overflow-y: auto;

    ul.semantic-list li {
      margin-bottom: $space-component-m;
    }
  }

  &__loading-indicator {
    @include Flex.flexbox($justify: center);
    margin-top: 64px;
  }

  :deep(.empty-state) {
    height: 500px;
  }

  :deep(.a-notification.-error) {
    z-index: 100;
  }
}
</style>
