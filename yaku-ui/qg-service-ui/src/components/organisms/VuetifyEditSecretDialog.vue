<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogDialog id="edit-secret-dialog" ref="editSecretDialogRef" open :title="actionLabel" @close="emit('close')">
    <template #body>
      <div class="inputs" data-cy="secret-inputs">
        <FrogTextInput id="config-name" ref="nameInput" v-model="localName" label="Name" />
        <FrogTextarea id="config-description" ref="descInput" v-model="localDesc" class="description-textarea"
          label="Description (optional)" />
        <FrogTextInput id="secret-value" ref="secretInput" v-model="localSecret" type="password" class="secret-textarea"
          label="Value"
          :placeholder="actionType === 'update' ? 'The current secret is hidden due to security reasons' : undefined" />
        <FrogNotificationBar v-if="!!localErrorMsg" :show="!!localErrorMsg" variant="bar" type="error" full-width
          with-icon center-icon no-content-margin>
          <VuetifyBannerContent :label="localErrorMsg" />
        </FrogNotificationBar>
      </div>
    </template>

    <template #actions>
      <FrogPopover class="hint-popover" attached triggerOnHover arrowPlacementClass="-bottom-center"
        :label="disablePrimaryActionWithLabel" :deactivate="!disablePrimaryActionWithLabel">
        <FrogButton :disabled="!!disablePrimaryActionWithLabel" data-cy="confirm-button" @click="onConfirm">
          {{ actionLabel }}
        </FrogButton>
      </FrogPopover>
      <FrogButton secondary @click="emit('close')">
        Cancel
      </FrogButton>
    </template>
  </FrogDialog>
</template>

<script setup lang="ts">
import type { FrokComponents } from '@B-S-F/frog-vue'
import { onClickOutside } from '@vueuse/core'
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import type { SecretPost, SecretUpdate } from '~/api'
import { ERROR_SECRET_TOO_LONG } from '~/config/secrets'

type EditSecretDialogProps = {
  actionType: 'create' | 'update'
  name?: string
  description?: string
  errorMsg?: string
}
const props = withDefaults(defineProps<EditSecretDialogProps>(), {
  name: '',
  description: '',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', payload: SecretPost): void
  (e: 'update', payload: SecretUpdate): void
  (e: 'update:errorMsg', newVal: undefined): void
}>()

/** Assuming there is no special characters such as emojis */
const MAX_SECRET_LENGTH = 65535

const actionLabel = computed(() =>
  props.actionType === 'create' ? 'Create Secret' : 'Update Secret',
)

const disablePrimaryActionWithLabel = computed(() => {
  const trimmedSecret = localSecret.value.trim()
  const isSecretValueProvided = trimmedSecret.length > 0
  const isNameProvided = localName.value.trim().length > 0
  const isNameUpdated = isNameProvided && props.name !== localName.value

  if (isSecretTooLong.value) return 'The secret value is too long.'
  if (
    props.actionType === 'create' &&
    (!isNameProvided || !isSecretValueProvided)
  )
    return 'To create a secret, the name and value has to be provided!'
  if (props.actionType === 'update' && isNameUpdated && !isSecretValueProvided)
    return 'To update a secret, the name and value has to be provided!'
  return ''
})

const editSecretDialogRef = ref<HTMLDivElement>()
onClickOutside(editSecretDialogRef, () => emit('close'))

const localName = ref(props.name)
watchEffect(() => (localName.value = props.name))
watchEffect(() => {
  localName.value = localName.value.replace(' ', '_')
})
const nameLabelId = ref('')
const localDesc = ref(props.description)
watchEffect(() => (localDesc.value = props.description))
const descLabelId = ref('')

/** input only, it is never displayed on edition */
const localSecret = ref('')
const secretLabelId = ref('')

const nameInput = ref<InstanceType<FrokComponents['FrogTextInput']>>()
const descInput = ref<InstanceType<FrokComponents['FrogTextarea']>>()
const secretInput = ref<InstanceType<FrokComponents['FrogTextarea']>>()

onMounted(() => {
  nameLabelId.value = nameInput.value!.localId
  descLabelId.value = descInput.value!.localId
  secretLabelId.value = secretInput.value!.localId
})

const localErrorMsg = ref(props.errorMsg)

watch(
  () => props.errorMsg,
  (newErrorMsg) => {
    localErrorMsg.value = newErrorMsg
  },
)

const isSecretTooLong = computed(() => {
  const [trimmedSecret, trimmedName] = [
    localSecret.value.trim(),
    localName.value.trim(),
  ]
  return (
    trimmedSecret.length > MAX_SECRET_LENGTH ||
    trimmedName.length > MAX_SECRET_LENGTH
  )
})
watchEffect(() => {
  if (isSecretTooLong.value) {
    localErrorMsg.value = ERROR_SECRET_TOO_LONG
  } else if (
    !isSecretTooLong.value &&
    localErrorMsg.value === ERROR_SECRET_TOO_LONG
  ) {
    localErrorMsg.value = undefined
  }
})

const onConfirm = () => {
  const payload = {
    name: localName.value,
    description: localDesc.value,
    secret: localSecret.value,
  }
  if (props.actionType === 'create') emit('create', payload)
  else if (props.actionType === 'update') emit('update', payload)
}
</script>

<style scoped lang="scss">
#edit-secret-dialog {
  :deep(.m-dialog__content) {
    padding-top: 0.5rem;
  }

  :deep(.m-dialog__content > :last-child) {
    margin-bottom: 1rem;
  }

  :deep(.m-dialog__actions) {
    margin-top: 1rem;
  }
}

.close {
  position: absolute;
  top: 0;
  right: 0;
}

label~* {
  margin-bottom: 8px;
}

.inputs {
  display: flex;
  flex-flow: column nowrap;
  row-gap: 12px;
}



.description-textarea,
.secret-textarea {
  height: var(--textarea-height);

  :deep(textarea) {
    height: var(--textarea-height);
    min-height: var(--textarea-height);
  }
}

.secret-textarea {
  --textarea-height: 13.3rem;
}

.description-textarea {
  --textarea-height: 5.25rem;
}

.hint-popover :deep(.m-popover) {
  max-width: 310px;
  --x-shift: -26%;
  --y-shift: -160%;
}
</style>
