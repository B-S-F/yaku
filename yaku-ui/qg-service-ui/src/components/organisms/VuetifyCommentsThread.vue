<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="threadRef" class="thread" :class="{
    'thread--expanded': expandThread || shouldExpandThread,
  }">
    <div class="thread__header">
      <VuetifyComment :comment="thread" :status="thread.status" is-thread-starter :read-only="readOnly"
        :is-thread-expanded="expandThread || shouldExpandThread" :icon="context === 'history' && thread.reference.type === 'check'
          ? 'mdi-nut'
          : undefined
          " :noReply="noReply" :repliesCount="thread.replies?.length ?? 0"
        :highlighted="shouldHighlightComment(thread.id)" @toggleCollapse="handleToggleCollapseReplies"
        @reply="handleReply" @resolve="emit('resolve', thread.id)" @delete="emit('delete', thread.id)"
        @reset="emit('reset', thread.id)">
        <template #reference>
          <VuetifyRouterLink v-if="reference" class="-icon -no-underline" :to="{
            name: ROUTE_NAMES.RELEASE_DETAILS_CHECKS,
            params: { ...urlContext, ...reference.params },
            query: { ...reference.query },
          }">
            <!--- No outline icon available -->
            <FrogIcon size="small" icon="mdi-nut" />
            <span>{{ reference.title }}</span>
          </VuetifyRouterLink>
        </template>
      </VuetifyComment>
    </div>
    <!-- Render replies if any-->
    <template v-if="showReplies || shouldExpandThread">
      <ul v-if="thread.replies && thread.replies.length > 0" class="thread__replies semantic-list">
        <li v-for="(comment, idx) in thread.replies" :key="idx">
          <VuetifyComment :id="`reply-${comment.id}`" :comment="comment"
            :highlighted="shouldHighlightComment(comment.id)" />
        </li>
      </ul>
      <div v-if="!noReply && showReplyInput" class="thread__reply-field" :class="{
        'to-replies': thread.replies && thread.replies.length,
      }">
        <VuetifyCommentInput key="reply" placeholder="Reply..." is-replying @send="handleSendReply(thread.id, $event)"
          @close="handleCloseInput" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CommentsThread } from '~/api'
import { useUrlContext } from '~/composables'
import { ROUTE_NAMES } from '~/router'

/**
 * Props
 */
const props = withDefaults(
  defineProps<{
    thread: CommentsThread
    noReply?: boolean
    reference?: {
      params: { [key: string]: string | number }
      query?: { [key: string]: string | number }
      title: string
    }
    requestedCommentId?: number | null
    requestedParentCommentId?: number | null
    context?: 'default' | 'history'
    readOnly?: boolean
  }>(),
  {
    noReply: false,
    context: 'default',
    readOnly: false,
  },
)
/**
 * Events
 */
const emit = defineEmits<{
  (e: 'reply', payload: { id: number; comment: string }): void
  (e: 'resolve', id: number): void
  (e: 'reset', id: number): void
  (e: 'delete', id: number): void
  (e: 'delete-reply', id: number): void
}>()
/**
 * State
 */
const showReplies = ref<boolean>(props?.readOnly)
const expandThread = computed(
  () => !!(showReplies.value && props?.thread?.replies?.length > 0),
)

const shouldExpandThread = computed(() => {
  return props.thread.id === props.requestedParentCommentId
})

const shouldHighlightComment = (commentId: number) => {
  return commentId === props.requestedCommentId
}

const threadRef = ref<HTMLDivElement>()
const showReplyInput = ref<boolean>(true)

const handleToggleCollapseReplies = () => {
  showReplies.value = !showReplies.value
}

const handleReply = () => {
  if (!showReplies.value) {
    showReplies.value = true
  }
  showReplyInput.value = true

  // focus the replay input
  setTimeout(() => {
    ;(
      threadRef.value?.querySelector(
        'textarea.comment-input-textarea',
      ) as HTMLTextAreaElement
    ).focus()
  }, 100)
}

const handleSendReply = (threadId: number, comment: string) => {
  emit('reply', { id: threadId, comment })
}

const handleCloseInput = () => {
  showReplyInput.value = false
  if (showReplies.value && !props.thread.replies?.length) {
    showReplies.value = false
  }
}

const { urlContext } = useUrlContext()
</script>

<style scoped lang="scss">
@use "../../styles/helpers.scss" as *;
@use 'vuetify' as vuetify;
$avatar-and-gap: calc(32px + $spacing-24);
$margin-left-reply-comment: calc($avatar-and-gap * 2);
$margin-left-thread-comment: $avatar-and-gap;

.thread {
  position: relative;
  margin-bottom: 20px;

  &--expanded {
    &::before {
      position: absolute;
      content: "";
      bottom: 0;
      width: 1px;
      background-color: #a4abb3; // FIXME was always hardcoded
      left: rem(16px);
      top: 70px;
    }
  }

  &__replies {
    margin-top: rem(12px);
    margin-left: calc($avatar-and-gap + 32px - 8px); // avatar width + gap bebtween avatar and comment header

    .thread--expanded & {
      margin-left: $margin-left-thread-comment;
    }

    >li:not(:last-child) {
      margin-bottom: rem(12px);
    }

    :deep(.mo-avatar) {
      margin-top: rem(12px);
    }
  }

  &__reply-field {
    margin-top: 12px;
    margin-left: $avatar-and-gap;

    &.to-replies {
      margin-left: $margin-left-reply-comment;
    }
  }

  &:last-child:not(:first-child) {
    margin-bottom: 60px;
  }
}

.-no-underline {
  text-decoration: none;
}
</style>
