<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="o-release-history">
    <div class="o-release-history__header">
      <div class="o-release-history__filters">
        <ul class="semantic-list">
          <li v-for="item in FILTERS" :key="item.value">
            <FrogChip :id="item.value" :label="item.label" :selected="releaseHistoryState.activeFilter === item.value"
              class="text-black" :class="{ 'bg-background': releaseHistoryState.activeFilter === item.value }"
              @click="handleSelectFilter(item.value)" />
          </li>
        </ul>
      </div>
      <VuetifyYakuDropdown id="findings-group-by" v-model="selectedSortBy" v-model:open="showSortBy" dynamicWidth
        :icon="selectedSortBy.value == 'DESC' ? 'mdi-sort-alphabetical-descending' : 'mdi-sort-alphabetical-ascending'"
        data-cy="sort-by" label="Sort By" :options="SORT_BY_OPTIONS" />
    </div>
    <div v-if="releaseHistoryState.isLoading" class="o-release-history__loading-indicator">
      <FrogActivityIndicator />
    </div>
    <VuetifyNoItems v-else-if="releaseHistoryState.items.length < 1" label="No items" />
    <div v-else ref="containerRef" class="o-release-history__items bg-background">
      <ul class="semantic-list">
        <li v-for="item in releaseHistoryState.items" :key="item.timestamp">
          <VuetifyCommentsThread v-if="item.type === 'comment' && getCommentsData(item)" :key="item.timestamp"
            :no-reply="isClosed" context="history" :thread="getCommentsData(item) as ReleaseComment"
            :reference="getCommentReference(item)" :read-only="isClosed" @reply="handleReplyComment($event)"
            @resolve="handleResolveComment($event)" @reset="handleResetComment($event)"
            @delete="handleDeleteComment($event)"
            @delete-reply="handleDeleteReplyComment($event, (getCommentsData(item) as ReleaseComment).id)" />
          <VuetifyReleaseHistoryItem v-else :actor="displayUserName((item.data as ReleaseHistoryEventObject).actor)"
            :action="(item.data as ReleaseHistoryEventObject).action" :created-at="item.timestamp"
            :type="item.type as ReleaseHistoryFilter" :comment="(item.data as ReleaseHistoryEventObject).comment"
            :color="(item.data as ReleaseHistoryEventObject).newManualColor" :reference="getHistoryReference(item)" />
        </li>
      </ul>
    </div>
    <FrogNotificationBar :show="!!releaseHistoryState.apiError && !releaseHistoryState.isLoading" variant="banner"
      type="error" full-width with-icon center-icon>
      <VuetifyBannerContent :label="releaseHistoryState.apiError" @close="releaseHistoryState.apiError = undefined" />
    </FrogNotificationBar>
  </div>
</template>
<script setup lang="ts">
import { SelectItem } from '@B-S-F/frog-vue'
import { useScroll, watchThrottled } from '@vueuse/core'
import { computed, onMounted, ref, toRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ReleaseComment } from '~/api'
import { SortOrder } from '~/api/common'
import { useApiReleases } from '~/composables/api/useApiReleases'
import useReleaseComments from '~/composables/releaseDetails/useReleaseComments'
import useReleaseDetailsRunReport from '~/composables/releaseDetails/useReleaseDetailsRunReport'
import { contentIdNormalizer } from '~/helpers'
import { displayUserName } from '~/helpers/displayUserName'
import { useReleaseHistoryStore } from '~/store/useReleaseHistoryStore'
import type {
  ReleaseHistoryEventObject,
  ReleaseHistoryFilter,
  ReleaseHistoryItem,
} from '~/types/Release'

/**
 * Props
 */
const props = defineProps<{
  releaseId: number
  isClosed: boolean
}>()

/**
 * Dependencies
 */
const { getReleaseHistoryNext } = useApiReleases()
/**
 * Constants
 */
const FILTERS: SelectItem<ReleaseHistoryFilter>[] = [
  {
    value: 'event',
    label: 'Events',
  },
  {
    value: 'resolved',
    label: 'Resolved',
  },
  {
    value: 'unresolved',
    label: 'Unresolved',
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
 * Routing
 */
const route = useRoute()
const router = useRouter()
/**
 * State
 */
const releaseHistoryState = useReleaseHistoryStore()
const selectedSortBy = computed({
  get() {
    const v = releaseHistoryState.activeSort
    return SORT_BY_OPTIONS.find((opt) => opt.value === v) ?? SORT_BY_OPTIONS[0]
  },
  async set(v) {
    router.replace({
      query: {
        ...route.query,
        sortOrder: v.value,
      },
    })
    await releaseHistoryState.fetchHistory(props.releaseId, { sort: v.value })
  },
})
const handleSelectFilter = async (filter: ReleaseHistoryFilter) => {
  if (!filter) return
  router.replace({
    query: {
      ...route.query,
      filter:
        filter && filter === releaseHistoryState.activeFilter
          ? undefined
          : filter,
    },
  })
  await releaseHistoryState.fetchHistory(props.releaseId, { filter })
}
const showSortBy = ref<boolean>(false)
/**
 * History comments
 */
const _comments = computed(() => {
  const comments: ReleaseComment[] = []
  if (!releaseHistoryState.items || releaseHistoryState.items.length < 1)
    return comments
  else {
    const typeComments = releaseHistoryState.items.filter(
      (item) => item.type === 'comment',
    )
    if (typeComments.length > 0) {
      typeComments.forEach((c) => comments.push(c.data as ReleaseComment))
      return comments
    }
    return comments
  }
})

const commentsFromHistory = toRef(_comments)
const getCommentsData = (item: ReleaseHistoryItem) => {
  if (!item || commentsFromHistory.value.length < 1) return undefined
  else
    return commentsFromHistory.value.find(
      (c) => c.id.toString() === (item.data as ReleaseComment).id.toString(),
    )
}

const getCommentReference = (item: ReleaseHistoryItem) => {
  const reference = (item.data as ReleaseComment)?.reference
  if (!reference) return
  else {
    const checkIdx = checks.value.findIndex(
      (c) =>
        c.id === reference.check &&
        c.chapterId === reference.chapter &&
        c.requirementId === reference.requirement,
    )
    if (checkIdx === -1) return
    const { chapterId, requirementId, id, title } = checks.value[checkIdx]
    return {
      query: { content: contentIdNormalizer(chapterId, requirementId, id) },
      params: {
        id: props.releaseId,
      },
      title,
    }
  }
}

const getHistoryReference = (item: ReleaseHistoryItem) => {
  const reference = (item.data as ReleaseHistoryEventObject)?.reference
  if (!reference) return
  else {
    const checkIdx = checks.value.findIndex(
      (c) =>
        c.id === reference.check &&
        c.chapterId === reference.chapter &&
        c.requirementId === reference.requirement,
    )
    if (checkIdx === -1) return
    const { chapterId, requirementId, id, title } = checks.value[checkIdx]
    return {
      query: { content: contentIdNormalizer(chapterId, requirementId, id) },
      params: {
        id: props.releaseId,
      },
      title,
    }
  }
}

const {
  replyComment,
  resolveComment,
  resetComment,
  deleteComment,
  deleteReply,
} = useReleaseComments(commentsFromHistory)
const handleReplyComment = async ({
  id,
  comment,
}: { id: number; comment: string }) => {
  try {
    await replyComment(props.releaseId, { commentId: id, comment })
  } catch (error) {
    releaseHistoryState.apiError = error as string
  }
}

const handleResolveComment = async (commentId: number) => {
  try {
    await resolveComment(props.releaseId, commentId)
    await releaseHistoryState.fetchHistory(props.releaseId)
  } catch (error) {
    releaseHistoryState.apiError = error as string
  }
}

const handleResetComment = async (commentId: number) => {
  try {
    await resetComment(props.releaseId, commentId)
    await releaseHistoryState.fetchHistory(props.releaseId)
  } catch (error) {
    releaseHistoryState.apiError = error as string
  }
}

const handleDeleteComment = async (commentId: number) => {
  try {
    await deleteComment(props.releaseId, commentId)
    await releaseHistoryState.fetchHistory(props.releaseId)
  } catch (error) {
    releaseHistoryState.apiError = error as string
  }
}

const handleDeleteReplyComment = async (
  commentId: number,
  parentCommentId: number,
) => {
  try {
    await deleteReply(props.releaseId, commentId, parentCommentId)
  } catch (error) {
    releaseHistoryState.apiError = error as string
  }
}
/**
 * Hooks
 */
onMounted(() => {
  const { filter, sortOrder } = route.query
  releaseHistoryState.fetchHistory(props.releaseId, {
    filter: filter as ReleaseHistoryFilter,
    sort: sortOrder as SortOrder,
    reset: true,
  })
})
const containerRef = ref<HTMLDivElement>()
const { arrivedState } = useScroll(containerRef)
watchThrottled(
  arrivedState,
  async (newVal) => {
    if (newVal.bottom && releaseHistoryState.next) {
      const r = await getReleaseHistoryNext(releaseHistoryState.next)
      if (r.ok) {
        const rjson = await r.json()
        if (rjson?.data && rjson?.data?.length > 0) {
          releaseHistoryState.items = [
            ...releaseHistoryState.items,
            ...rjson.data,
          ]
        }
        if (rjson?.links?.next) {
          releaseHistoryState.next = rjson.links.next
        }
      }
    }
  },
  { throttle: 500 },
)

/**
 * Checks
 */
const { getReleaseRunReport, checks } = useReleaseDetailsRunReport(
  props.releaseId,
)
onMounted(async () => getReleaseRunReport())
</script>
<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as *;
@use '../../styles/tokens.scss' as *;

.o-release-history {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  row-gap: $spacing-16;
  height: 100%;

  @media screen and (max-width: $bp-max-1020) {
    column-gap: $spacing-16;
  }

  &__header {
    @include flexbox($justify: space-between);

    @media screen and (max-width: $bp-max-1020) {
      flex-wrap: wrap;
      row-gap: $spacing-16;
    }
  }

  &__filters ul.semantic-list {
    @include flexbox;
    column-gap: $spacing-16;
  }

  &__items {
    padding: $space-component-m;
    overflow-y: auto;

    ul.semantic-list li {
      margin-bottom: $spacing-24;
    }
  }

  &__loading-indicator {
    @include flexbox($justify: center);
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
