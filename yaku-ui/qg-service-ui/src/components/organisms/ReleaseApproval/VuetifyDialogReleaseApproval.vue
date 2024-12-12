<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="manageReleaseApproval" title="Manage approval" open maxWidth="75%" @close="emit('close')">
      <template #body>
        <div class="dialog-release-approval">
          <div class="dialog-release-approval__status">
            <VuetifyStatusPill rounded v-bind="getVuetifyReleaseStatusPillInfo(status)"
              :color="getVuetifyReleaseStatusPillInfo(status).color" :tooltip="getVuetifyReleaseStatusPillInfo(status).tooltip"
              :label="undefined">
              <template #icon>
                <FrogIcon v-if="!getVuetifyReleaseStatusPillInfo(status).iconComponent"
                  :icon="getVuetifyReleaseStatusPillInfo(status).icon ?? ''" />
                <component :is="getVuetifyReleaseStatusPillInfo(status).iconComponent" v-else />
              </template>
            </VuetifyStatusPill>
            <span class="highlight -size-s">{{ status }}</span>
          </div>
          <div class="dialog-release-approval__grid">
            <div class="left">
              <div class="approver-list">
                <h5 class="-size-s">
                  Approver
                </h5>
                <div v-if="!closed" class="a-dropdown add-approver" :class="{
                  'a-dropdown--disabled': !usersToSelect.length,
                }">
                  <select v-model="selectedUser" :disabled="closed" @change="onSelectUser($event)">
                    <option disabled value="">
                      Add approver
                    </option>
                    <option v-for="approver in usersToSelect" :key="approver.value" :value="approver.value">
                      {{ approver.label }}
                    </option>
                  </select>
                </div>
                <ul v-if="approvers" class="approvers-list semantic-list">
                  <li v-for="approver in approvers" :key="approver.id + approver.state">
                    <VuetifyApproverListItem :username="displayUserName(approver.user)">
                      <template v-if="approver.state" #status>
                        <VuetifyApproverStatus :state="approver.state" :current-user="currentUser === approver.user.username"
                          :closed="closed" @open:dialog="onSelectUpdateStatus(approver)" />
                      </template>
                      <template #actions>
                        <FrogPopover attached arrow-placement-class="-left-center"
                          :show="showApproverOptions === String(approver.id)" class="mo-comment__options-btn">
                          <FrogButton v-if="!closed"
                            :icon="showApproverOptions === String(approver.id) ? 'mdi-close' : 'mdi-dots-horizontal'" integrated
                            @click="showApproverOptions = showApproverOptions ? undefined : String(approver.id)" />
                          <template #content>
                            <div class="approver-menu">
                              <FrogButton integrated icon="mdi-trash-can-outline"
                                @click="approver.id && handleRemoveApprover(approver.id)">
                                Delete
                              </FrogButton>
                            </div>
                          </template>
                        </FrogPopover>
                      </template>
                    </VuetifyApproverListItem>
                  </li>
                </ul>
              </div>
            </div>
            <div class="right">
              <div class="dialog-release-approval__comments">
                <div>
                  <h5 class="-size-s">
                    Comments
                  </h5>
                  <VuetifyCommentInput v-if="!closed" placeholder="Add a comment, @ to mention..." :disabled="closed"
                    @send="handleSendComment($event)" />
                </div>
                <div v-if="comments" class="threads">
                  <VuetifyCommentsThread v-for="comment in comments" :id="`thread-${comment.id}`" :key="comment.id"
                    :thread="comment" :no-reply="closed || !comment.todo" :read-only="closed"
                    :requested-comment-id="commentId" :requested-parent-comment-id="parentCommentId"
                    @reply="handleReplyComment($event)" @resolve="handleResolveComment($event)"
                    @reset="handleResetComment($event)" @delete="handleDeleteComment($event)"
                    @delete-reply="handleDeleteReplyComment($event, comment.id)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #actions>
        <FrogNotificationBar :show="!!apiError" variant="bar" type="error" full-width with-icon center-icon
          no-content-margin>
          <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
        </FrogNotificationBar>
        <FrogButton secondary @click="emit('close')">
          Close
        </FrogButton>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NamespaceUser } from '~/api'
import { useApiCore } from '~/composables/api'
import useReleaseComments from '~/composables/releaseDetails/useReleaseComments'
import { displayUserName } from '~/helpers/displayUserName'
import { getVuetifyReleaseStatusPillInfo } from '~/helpers/getPillInfo'
import useKeycloakStore from '~/store/useKeycloakStore'
import { useReleaseCommentsStore } from '~/store/useReleaseCommentsStore'
import { useReleaseHistoryStore } from '~/store/useReleaseHistoryStore'
import { SelectItem } from '~/types'
import { ReleaseApprover } from '~/types/Release'

const props = defineProps<{
  releaseId: number
  closed?: boolean
  status: string
  approvers: ReleaseApprover[]
}>()
const emit = defineEmits<{
  (e: 'save-changes'): void
  (e: 'close'): void
  (
    e: 'approve-release',
    { userId, comment }: { userId: string; comment: string },
  ): void
  (e: 'add-approver', approver: { user: string }): void
  (e: 'remove-approver', approverId: number): void
  (
    e: 'reset-approval',
    { userId, comment }: { userId: string; comment: string },
  ): void
  (
    e: 'update-status',
    { userId, status }: { userId: string; status: string },
  ): void
}>()
/**
 * Common
 */
const route = useRoute()
const apiError = ref<string>()
const commentsStore = useReleaseCommentsStore()
const { comments } = storeToRefs(commentsStore)

const commentId = computed(() => {
  const id = Number(route.query.commentId)
  return isNaN(id) ? undefined : id
})

const parentCommentId = computed(() => {
  const id = Number(route.query.parentCommentId)
  return isNaN(id) ? undefined : id
})

onMounted(async () => {
  try {
    await commentsStore.fetchComments(props.releaseId)
  } catch (error) {
    apiError.value = error as string
  }
})
const {
  addCommentToARelease,
  replyComment,
  resolveComment,
  resetComment,
  deleteComment,
  deleteReply,
} = useReleaseComments(comments)
const handleSendComment = async (comment: string) => {
  try {
    await addCommentToARelease(props.releaseId, comment)
    await releaseHistoryStore.fetchHistory(props.releaseId)
  } catch (error) {
    apiError.value = error as string
  }
}
const handleReplyComment = async ({
  id,
  comment,
}: { id: number; comment: string }) => {
  try {
    await replyComment(props.releaseId, { commentId: id, comment })
    await releaseHistoryStore.fetchHistory(props.releaseId)
  } catch (error) {
    apiError.value = error as string
  }
}

const handleResolveComment = async (commentId: number) => {
  try {
    if (!props.releaseId) return
    await resolveComment(props.releaseId, commentId)
    await releaseHistoryStore.fetchHistory(props.releaseId)
  } catch (error) {
    apiError.value = error as string
  }
}

const handleResetComment = async (commentId: number) => {
  try {
    if (!props.releaseId) return
    await resetComment(props.releaseId, commentId)
    await releaseHistoryStore.fetchHistory(props.releaseId)
  } catch (error) {
    apiError.value = error as string
  }
}

const handleDeleteComment = async (commentId: number) => {
  try {
    if (!props.releaseId) return
    await deleteComment(props.releaseId, commentId)
    await releaseHistoryStore.fetchHistory(props.releaseId)
  } catch (error) {
    apiError.value = error as string
  }
}

const handleDeleteReplyComment = async (
  commentId: number,
  parentCommentId: number,
) => {
  try {
    if (!props.releaseId) return
    await deleteReply(props.releaseId, commentId, parentCommentId)
    await releaseHistoryStore.fetchHistory(props.releaseId)
  } catch (error) {
    apiError.value = error as string
  }
}

const keycloakStore = useKeycloakStore()
const { user } = storeToRefs(keycloakStore)
const currentUser = computed(() => user.value?.username)

/**
 * ADD / REMOVE APPROVER
 */
const namespaceUsers = ref<NamespaceUser[]>([])
const { getNamespaceUsers } = useApiCore()
onMounted(async () => {
  const getUsers = await getNamespaceUsers()
  if (getUsers.ok) {
    const usersResp = await getUsers.json()
    namespaceUsers.value = usersResp?.data.map((user: NamespaceUser) => {
      if (user && !user.displayName) {
        return {
          displayUserName: user.id,
          id: user.id,
          username: user.id,
        }
      } else return user
    })
  } else {
    apiError.value = (await getUsers.json())?.message
  }
})

const usersToSelect = computed<SelectItem[]>(() => {
  const existingApprovers = props.approvers.map((a) => String(a.user.username))
  const nonExistingApprovers = namespaceUsers.value.filter(
    (u) => !existingApprovers.includes(u.username),
  )
  return nonExistingApprovers.map((r) => ({
    value: r.id,
    label:
      r.displayName && r.displayName !== ' '
        ? r.displayName
        : (r.username ?? r.id),
  }))
})
const selectedUser = ref<string>('')

const showApproverOptions = ref<string | undefined>()
const handleRemoveApprover = async (approverId: number) => {
  emit('remove-approver', approverId)
  showApproverOptions.value = undefined
}

const onSelectUser = (evt: Event) => {
  const eventTarget = evt?.target as HTMLSelectElement
  const findUser = namespaceUsers.value.find(
    (user) => user.id === eventTarget.value,
  )
  if (!findUser) return
  selectedUser.value = ''
  emit('add-approver', { user: findUser.id as string })
}

const onSelectUpdateStatus = (approver: ReleaseApprover) => {
  showApproverOptions.value = undefined
  emit('update-status', { userId: String(approver.id), status: approver.state })
}

/**
 * Sync History
 */
const releaseHistoryStore = useReleaseHistoryStore()

/**
 * QUERIED Release comments
 */
watch(commentId, (newCommentId) => {
  if (!newCommentId) return
  scrollToComment(newCommentId)
})

onMounted(() => {
  if (commentId.value) {
    scrollToComment(commentId.value)
  }
})

const scrollToComment = (commentId: number) => {
  nextTick(() => {
    setTimeout(() => {
      const commentElement =
        document.querySelector(`#thread-${commentId}`) ||
        document.querySelector(`#reply-${commentId}`)
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 1000)
  })
}
</script>

<style lang="scss" scoped>
@use '../../../styles/tokens.scss' as *;
@use '../../../styles/helpers.scss' as *;


.dialog-release-approval {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  row-gap: $spacing-32;

  &__grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    column-gap: $spacing-32;
    grid-template-rows: minmax(0, 500px);
  }

  &__comments {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    row-gap: $space-component-l;
    height: 100%;

    h5 {
      margin-top: 0;
      margin-bottom: $spacing-12;
    }

    .threads {
      overflow-y: auto;
    }
  }

  &__status {
    display: flex;
    align-items: center;
    column-gap: $spacing-12;

    span {
      text-transform: capitalize;
    }
  }

  .approver-list {
    display: grid;
    row-gap: $spacing-12;
    grid-template-rows: auto auto 1fr;
    height: 100%;
    overflow-y: hidden;

    h5 {
      margin: 0;
    }
  }

  .approvers-list {
    overflow-y: auto;
  }

  .left {
    display: grid;
    row-gap: $spacing-24;
    grid-template-rows: auto 1fr;
  }

  :deep(.a-notification.-error .a-button) {
    display: none;
    pointer-events: none
  }

  .dialog-release-approval__comments {
    .a-notification {
      min-height: 32px;
      height: auto;
      padding: 0 1rem;

      :deep(.a-notification__content) {
        align-self: center;
      }
    }
  }
}

#manageReleaseApproval {
  --max-dialog-width: 1152px;
  margin-top: 48px; // never overflow the app header
  max-height: $dialogMaxHeight;
  overflow-y: auto;

  :deep(.m-dialog__headline) {
    display: none;
  }
}

:global(#app.-sidebar-open #manageReleaseApproval) {
  --max-dialog-width: 100%;
  left: calc(100vw - var(--view-width));
}

.add-approver {
  cursor: pointer;

  &::after {
    content: var(--ui-ic-search);
  }
}

.approver-menu {
  display: flex;
  flex-direction: column;
  width: 168px;

  .a-button.a-button--integrated {
    position: relative
  }
}

:global(.m-popover__content:has(.approver-menu)) {
  padding: 0;
}

.m-dialog__actions .a-notification.-error {
  flex: 1;

  :deep(.banner-content .a-button) {
    display: none;
  }
}
</style>
