<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="mo-release-history-item">
    <div class="left">
      <VuetifyAvatar :name="actor" :src="actionText.img" />
      <div class="mo-release-history-item__status-icon -secondary" :class="{
        'bg-error': action.includes('reset'),
        'bg-success': action.includes('approved')
      }">
        <FrogIcon v-if="actionText.icon" :icon="actionText.icon ?? ''" />
      </div>
    </div>
    <div class="right -secondary">
      <div class="mo-release-history-item__header-ctr">
        <div class="mo-release-history-item__header-info">
          <div class="mo-release-history-item__header-info--header">
            <h5 class="name highlight">
              {{ actionText?.actor || actionText.message }}
            </h5>
            <RouterLink v-if="reference" class="a-link -icon -no-underline"
              :to="{ name: ROUTE_NAMES.RELEASE_DETAILS_CHECKS, params: { ...urlContext, ...reference.params }, query: { ...reference.query } }">
              <FrogIcon size="x-small" icon="mdi-nut" />
              <span>{{ reference.title }}</span>
            </RouterLink>
          </div>
          <span class="time text-caption">{{ useRecentDateFormat(createdAt) }}</span>
        </div>
      </div>
      <div v-if="actionText?.actor && actionText.message" class="mo-release-history-item__content">
        <p>{{ actionText.message }}</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { ReleaseComment } from '~/api'
import YakuImg from '~/assets/images/yaku.png'
import { useRecentDateFormat, useUrlContext } from '~/composables'
import { textMap } from '~/helpers'
import { ROUTE_NAMES } from '~/router'
import { CheckColor, ReleaseHistoryFilter } from '~/types/Release'

/**
 * Props
 */
const props = defineProps<{
  createdAt: string
  action: string
  actor: string
  type: ReleaseHistoryFilter
  // override props
  comment?: ReleaseComment | string
  color?: CheckColor
  reference?: {
    params: { [key: string]: string | number }
    query?: { [key: string]: string | number }
    title: string
  }
}>()
/**
 * Computed values
 */
const actionText = computed(() => {
  if (props.type === 'event') {
    const action = props.action.toLocaleLowerCase()
    if (action === 'release approved') {
      return {
        icon: 'mdi-check-circle-outline',
        message: 'The release was approved.',
      }
    } else if (action === 'release reset') {
      return {
        icon: 'mdi-alert-circle-outline',
        message: 'The release was rejected',
      }
    }
    // override status
    if (action.includes('removed override')) {
      return {
        icon: 'mdi-nut',
        message: props.actor + ' reverted the check state to automatically ',
      }
    }
    if (
      (action.includes('updated override') ||
        action.includes('added override')) &&
      !!props.color
    ) {
      return {
        icon: 'mdi-nut',
        actor:
          props.actor +
          ' manually changed the check state to "' +
          textMap.get(props.color) +
          '"',
        message: props.comment,
      }
    }
  }
  const actionStr = props.action.split(' ')
  const actor = props.actor
  switch (actionStr[0]) {
    case 'added':
      if (actionStr.length > 1) {
        return {
          icon: 'mdi-plus-circle-outline',
          message: props.action + ' as an approver',
        }
      } else {
        return {
          icon: 'mdi-plus-circle-outline',
          message: props.action,
        }
      }
    case 'reset':
      return {
        actor: props.comment
          ? props.actor + ' ' + ' rejected the release'
          : undefined,
        icon: 'mdi-alert-circle-outline',
        message:
          typeof props.comment !== 'string' && props.comment
            ? props.comment.content
            : props.actor + ' ' + ' rejected the release',
      }
    case 'approved':
      return {
        actor: props.comment
          ? props.actor + ' ' + 'approved the release'
          : undefined,
        icon: 'mdi-check-circle-outline',
        message:
          typeof props.comment !== 'string' && props.comment
            ? props.comment.content
            : props.actor + ' ' + 'approved the release',
      }
    case 'closed':
      return {
        icon: 'mdi-archive-outline',
        message: 'Closed the release',
      }
    case 'removed':
      if (actionStr.length > 1) {
        return {
          icon: 'mdi-minus-circle-outline',
          message: props.action + ' as an approver',
        }
      } else
        return {
          icon: 'mdi-minus-circle-outline',
          message: props.action,
        }
    case 'run':
      return {
        actor: actor === 'SYSTEM_ACTOR' ? 'Yaku update' : actor,
        icon: 'mdi-rocket-outline',
        message: props.action,
        img: YakuImg,
      }
    default:
      return {
        icon: 'mdi-comment-processing-outline',
        message: props.action ?? '',
      }
  }
})

const { urlContext } = useUrlContext()
</script>
<style scoped lang="scss">
@use '../../styles/helpers.scss' as *;
@use '../../styles/mixins/flex.scss' as Flex;
@use '../../styles/abstract' as *;

.mo-release-history-item {
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
    background-color: #EEEEEE;

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

    .-dark-mode & {
      background-color: #616161;
    }
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
      content: '';
      width: $spacing-24;
      height: $spacing-24;
      background-color: #EEEEEE;
      position: absolute;
      top: 50%;
      left: 0%;
      transform: translate(-50%, -50%) rotate(45deg);

      .-dark-mode & {
        background-color: #616161;
      }
    }
  }

  &__header-info {
    &--header {
      display: flex;
      flex-wrap: nowrap;
      column-gap: $spacing-8;

      :deep(.a-link) {
        @include Flex.flexbox;
        width: 100%;
        @extend %inline-ellipsis;
      }

      :deep(.a-link span) {
        @extend %inline-ellipsis;
        display: inline-block;
        font-size: 14px;
      }

      :deep(.a-icon) {
        font-size: 18px;
      }

      h5.name {
        margin: 0;
        font-size: rem(14px);
        flex: 0 0 auto;

        &::first-letter {
          text-transform: uppercase;
        }
      }
    }
  }

  &__header-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__content {
    border-top: 1px solid white;
    padding: $spacing-8 $spacing-8 $spacing-8 $spacing-16;

    p {
      font-size: rem(14px);
      margin: 0;
    }

    :deep(span.a-button__label) {
      padding: 0;
      font-size: rem(12px);
    }
  }



  .left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-top: rem(12px);
  }

  .left .mo-release-history-item__status-icon {
    margin-top: rem(-4px);
    z-index: 100;

    :deep(svg) {
      width: 24px;
    }
  }
}

.-no-underline {
  text-decoration: none;
}
</style>
