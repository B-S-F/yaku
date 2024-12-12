<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="mo-comment" :class="{
    'mo-comment--thread-starter': isThreadStarter,
    'mo-comment--thread-expanded': isThreadStarter && isThreadExpanded,
    'mo-comment--highlighted': highlighted,
  }">
    <div class="left">
      <VuetifyAvatar :name="displayUserName(comment.createdBy)" bg="bg-background" />
      <div v-if="isThreadStarter" class="mo-comment__status-icon bg-grey-lighten-3">
        <FrogIcon :icon="icon" />
      </div>
    </div>
    <div class="right bg-grey-lighten-3">
      <div class="mo-comment__header-ctr">
        <div class="mo-comment__header-info">
          <div class="mo-comment__title">
            <FrogPopover trigger-on-hover tooltip-alike attached arrowPlacementClass="-without-arrow-top"
              :label="displayUserName(comment.createdBy)" class="mo-comment__name-wrapper">
              <h5 class="name highlighted">
                {{ displayUserName(comment.createdBy) }}
              </h5>
            </FrogPopover>
            <slot name="reference" />
          </div>
          <span class="time text-sm-caption">{{
            useRecentDateFormat(comment.creationTime)
          }}</span>
        </div>
        <div class="mo-comment__header-actions">
          <template v-if="isThreadStarter && !readOnly">
            <span v-if="showRepliesCount && breakpoints.from640">{{
              showRepliesCount
            }}</span>
            <FrogButton v-if="repliesCount && repliesCount > 0" :aria-expanded="isThreadExpanded"
              :icon="isThreadExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" integrated
              @click.stop="emit('toggleCollapse')" @keypress.enter="emit('toggleCollapse')" />
          </template>
          <template v-if="comment.todo && !readOnly">
            <FrogPopover v-if="status && status === 'created'" v-bind="TOOLTIP_CONFIG">
              <template #content> Resolve </template>
              <FrogButton icon="mdi-check-circle-outline" integrated :disabled="readOnly"
                @click.stop="emit('resolve', comment.id)" />
            </FrogPopover>
            <FrogPopover v-else-if="status && status === 'resolved'" v-bind="TOOLTIP_CONFIG">
              <template #content> Unresolve </template>
              <FrogButton class="resolved-button" integrated :disabled="readOnly"
                @click.stop="emit('reset', comment.id)">
                <VuetifyResolvedCheck />
              </FrogButton>
            </FrogPopover>
          </template>
          <template v-else-if="comment.status === 'resolved'">
            <VuetifyStatusPill rounded :label="undefined" color="Success">
              <template #icon>
                <FrogIcon icon="mdi-check-circle-outline" />
              </template>
            </VuetifyStatusPill>
          </template>
          <FrogPopover v-if="!readOnly" ref="commentOptionsRef" attached tooltip-alike
            arrow-placement-class="-top-right" pophoverClass="comments-option-popover" :show="showCommentOptions"
            class="mo-comment__options-btn">
            <FrogButton :icon="showCommentOptions ? 'mdi-close' : 'mdi-dots-horizontal'" integrated
              @click="showCommentOptions = !showCommentOptions" />
            <template #content>
              <div class="mo-comment__options-menu">
                <FrogButton integrated disabled icon="mdi-file-edit-outline" @click="emit('edit')">
                  Edit
                </FrogButton>
                <FrogButton integrated disabled icon="mdi-share-outline" @click="emit('share', comment.id)">
                  Share
                </FrogButton>
                <FrogButton integrated icon="mdi-delete-outline" @click="emit('delete', comment.id)">
                  Delete
                </FrogButton>
              </div>
            </template>
          </FrogPopover>
        </div>
      </div>
      <div class="mo-comment__content">
        <VuetifyMarkdown tag="p" :source="useReleaseEmails
          ? formattedComment(comment.content)
          : comment.content
          " />
        <FrogButton v-if="!noReply" tertiary @click="emit('reply')">
          Reply
        </FrogButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { ReleaseComment } from '~/api'
import { useRecentDateFormat } from '~/composables'
import { useBreakpoints } from '~/composables/useBreakPoints'
import useFeatureFlags from '~/composables/useFeatureFlags'
import { displayUserName } from '~/helpers/displayUserName'
import { TOOLTIP_CONFIG } from '~/helpers/getTooltipConfig'
import useKeycloakStore from '~/store/useKeycloakStore'

/**
 * Props
 */
const props = withDefaults(
  defineProps<{
    comment: ReleaseComment
    isThreadStarter?: boolean
    isThreadExpanded?: boolean
    targetLabel?: string
    targetUrl?: string
    status?: 'resolved' | 'created'
    noReply?: boolean
    repliesCount?: number
    icon?: string
    readOnly?: boolean
    highlighted?: boolean
  }>(),
  {
    isThreadStarter: false,
    noReply: false,
    icon: 'mdi-message-processing-outline',
    readOnly: false,
  },
)
/**
 * Emits
 */
const emit = defineEmits<{
  (e: 'resolve', id: number): void
  (e: 'reset', id: number): void
  (e: 'toggleCollapse'): void
  (e: 'edit'): void
  (e: 'delete', id: number): void
  (e: 'reply'): void
  (e: 'share', id: number): void
}>()
/**
 * State
 */
const showCommentOptions = ref<boolean>(false)
const commentOptionsRef = ref<InstanceType<typeof HTMLElement>>()
/*
 * Computed
 */
const showRepliesCount = computed(() =>
  props.repliesCount
    ? `${props.repliesCount} ${props.repliesCount > 1 ? 'replies' : 'reply'}`
    : undefined,
)

/**
 * Actions
 */
onClickOutside(commentOptionsRef, () => (showCommentOptions.value = false))

/** Mention */
const keycloakStore = useKeycloakStore()
const { user } = storeToRefs(keycloakStore)
const { useReleaseEmails } = useFeatureFlags()
const formattedComment = (comment: string) => {
  const mentionRegex = /@(\w+@\w+\.\w+)/g
  return comment.replace(mentionRegex, (match, username) => {
    if (username.toLowerCase() === user.value.username?.toLowerCase()) {
      return `<span class="-mention -current">${match}</span>`
    } else {
      return `<span class="-mention">${match}</span>`
    }
  })
}

const breakpoints = useBreakpoints()
</script>

<style scoped lang="scss">
@use "../../styles/helpers.scss" as *;
@use "../../styles/mixins/flex.scss" as Flex;
@use "../../styles/abstract" as *;

.mo-comment {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: $spacing-24;

  &__avatar {
    width: $spacing-32r;
    height: $spacing-32r;
    border-radius: 100%;
    margin-top: $spacing-12r;
    /** From the Arrow */
    overflow: hidden;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span.initials {
      font-size: rem(12px);
      font-weight: 600;
    }
  }

  &__status-icon {
    width: rem(32px);
    height: rem(32px);
    border-radius: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99;
  }

  &__header-ctr {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: $space-component-m;
    padding: $spacing-4 $spacing-16;
    position: relative;

    &::before {
      content: "";
      width: $spacing-24;
      height: $spacing-24;
      background-color: #EEEEEE; // grey lighten-3
      position: absolute;
      top: 50%;
      left: 0%;
      transform: translate(-50%, -50%) rotate(45deg);

      .-dark-mode & {
        background-color: #212121 // grey-darken-4
      }
    }
  }

  &__header-info {
    flex: 1;
  }

  &__name-wrapper {
    max-width: 100%;
    @extend %inline-ellipsis;
  }

  &__header-info h5.name {
    font-size: rem(14px);
    margin: 0;
    width: 100%;
    @extend %inline-ellipsis;
  }

  &__title {
    display: grid;
    grid-template-columns: auto minmax(auto, 1fr);
    column-gap: 8px;

    :deep(span) {
      @extend %inline-ellipsis;
      display: inline-block;
      font-size: 14px;
    }

    :deep(.v-icon) {
      font-size: 18px;
    }
  }

  &__header-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;

    .resolved-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 48px;
      height: 48px;
    }
  }

  &__content {
    border-top: 1px solid rgb(var(--v-theme-background));
    padding: $spacing-8 $spacing-8 $spacing-8 $spacing-16;

    :deep(p) {
      font-size: rem(14px);
      margin: 0;
    }

    :deep(span.-mention) {
      font-weight: 700;
    }

    :deep(span.-mention.-current) {
      background-color: #FFD600; // rgb(var(--v-theme-warning))
    }

    :deep(span.v-btn__content) {
      padding: 0;
      font-size: rem(12px);
    }
  }

  &__options-btn {
    display: inline-block;
  }

  &__options-menu {
    display: flex;
    flex-direction: column;
    width: 168px;

    .v-btn {
      position: relative;
    }
  }

  &--thread-starter {
    .left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-top: rem(12px);
    }

    .left .mo-comment__status-icon {
      margin-top: rem(-4px);
      z-index: 100;
    }
  }

  &--thread-starter.mo-comment--thread-expanded {
    :deep(.left .mo-avatar) {
      margin-bottom: rem(16px);
    }
  }
}

:global(.comments-option-popover) {
  --x-shift: 6px;
}

.mo-comment--highlighted .right {
  background-color: #757575; // rgb(var(--v-theme-primary-darken-1));
}

.mo-comment--highlighted .mo-comment__header-ctr::before {
  background-color: #757575; // rgb(var(--v-theme-primary-darken-1));
}
</style>
