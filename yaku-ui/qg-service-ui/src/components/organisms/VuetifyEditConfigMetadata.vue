<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div ref="editConfigRef" class="container">
    <FrogButton class="close" integrated icon="mdi-close" aria-label="close configuration description edition"
      @click="emit('close')" />
    <div>
      <label class="text-body-1" :for="nameLabelId">Name</label>
      <FrogTextInput id="config-name" ref="nameInput" v-model="localName" />
    </div>

    <div>
      <label class="text-body-1" :for="descLabelId">Description</label>
      <FrogTextarea id="config-description" ref="descInput" v-model="localDesc" />
    </div>

    <div class="actions">
      <FrogButton @click="emit('confirm', { name: localName, description: localDesc })">
        Save
      </FrogButton>
      <FrogButton secondary @click="emit('close')">
        Cancel
      </FrogButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FrokComponents } from '@B-S-F/frog-vue'
import { onClickOutside } from '@vueuse/core'
import { onMounted, ref, watchEffect } from 'vue'

const props = defineProps<{
  name: string
  description: string
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: { name: string; description: string }): void
}>()

const editConfigRef = ref<HTMLDivElement>()
onClickOutside(editConfigRef, () => emit('close'))

const localName = ref(props.name)
watchEffect(() => (localName.value = props.name))
const nameLabelId = ref('')
const localDesc = ref(props.description)
watchEffect(() => (localDesc.value = props.description))
const descLabelId = ref('')

const nameInput = ref<InstanceType<FrokComponents['FrogTextInput']>>()
const descInput = ref<InstanceType<FrokComponents['FrogTextarea']>>()

onMounted(() => {
  nameLabelId.value = nameInput.value?.localId ?? ''
  descLabelId.value = descInput.value?.localId ?? ''
})
</script>

<style scoped lang="scss">
.container>*~* {
  margin-top: 16px
}

.close {
  position: absolute;
  top: 0;
  right: 0;
}

label~* {
  margin-bottom: 8px;
}

.actions {
  display: flex;
  gap: 12px;

  >* {
    margin-bottom: 0; // disable margin-bottom of buttons in popover
  }
}
</style>
