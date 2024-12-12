<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main>
    <div class="bg-background">
      <FrogTabNavigation v-model:selected="currentTab" class="settings-tabs" :tabs="TABS" />
    </div>
    <div class="flex-layout bg-background">
      <div v-if="currentTab.id === 'preferences'" class="settings-section">
        <div>
          <h2 class="heading text-body-1 font-weight-bold -no-margin">
            Default Editor
          </h2>
        </div>
        <v-radio-group class="radio-buttons" inline>
          <FrogRadioButton id="visual" v-model="userProfile.editor" name="Visual Editor" label="Visual Editor"
            value="visual" @update:modelValue="handleSetPreferredEditor" />
          <FrogRadioButton id="code" v-model="userProfile.editor" name="Code Editor" label="Code Editor" value="code"
            @update:modelValue="handleSetPreferredEditor" />
        </v-radio-group>
      </div>
      <div v-else class="settings-section">
        <FrogToggleSwitch id="notifications" v-model="userProfile.emailNotifications" rightLabel="Enable notifications"
          @update:modelValue="handleActivateEmailNotifications" />
      </div>
    </div>
  </main>
  <FrogNotificationBar v-if="showNotificationBanner" class="success-bar" :show="showNotificationBanner" type="success"
    fullWidth withIcon centerIcon noContentMargin>
    <VuetifyBannerContent label="Saved changes" isToast @close="showNotificationBanner = false" />
  </FrogNotificationBar>
  <FrogNotificationBar v-if="!!apiError" class="success-bar" :show="!!apiError" type="error" fullWidth withIcon
    centerIcon noContentMargin>
    <VuetifyBannerContent :label="apiError" @close="apiError = undefined" />
  </FrogNotificationBar>
</template>

<script setup lang="ts">
import { Tab } from '@B-S-F/frog-vue'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import useFeatureFlags from '~/composables/useFeatureFlags'
import useUserProfileStore from '~/store/useUserProfileStore'
import { EditorType } from '~/types'
const profileStore = useUserProfileStore()
const { userProfile } = storeToRefs(profileStore)
onMounted(async () => {
  await profileStore.loadProfile((e) => (apiError.value = e))
})
const showNotificationBanner = ref(false)
const apiError = ref<string>()

const handleActivateEmailNotifications = async (v: boolean | null) => {
  if (v === null) return
  try {
    await profileStore.updateProfile(
      {
        emailNotifications: v,
      },
      () => (showNotificationBanner.value = true),
      (e) => (apiError.value = e),
    )
  } catch (error) {
    console.error(error)
  }
}

const handleSetPreferredEditor = async (type: EditorType) => {
  try {
    await profileStore.updateProfile(
      {
        editor: type,
      },
      () => (showNotificationBanner.value = true),
      (e) => (apiError.value = e),
    )
  } catch (error) {
    console.error(error)
  }
}

const { useReleaseEmails } = useFeatureFlags()
const TABS = [
  { id: 'preferences', label: 'Preferences' },
  ...(useReleaseEmails
    ? [{ id: 'notifications', label: 'Notifications' }]
    : []),
] satisfies Tab[]
const currentTab = ref<Tab>(TABS[0])
</script>

<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;
@use '../../styles/tokens.scss' as Tokens;

main {
  padding: 4rem 0;
}

.settings-tabs {
  margin: 0;

  :deep(.v-tabs) {
    margin: 0;

  }
}

.flex-layout {
  @include Flex.flexbox($direction: column, $align: flex-start);
  row-gap: Tokens.$space-component-xl;
  height: calc(100% - 54px);
  padding: Tokens.$padding-siteContent;
}

.radio-buttons {

  :deep(.v-radio .v-label) {
    white-space: nowrap;
  }

  display: flex;
  gap: $spacing-32r;
}

.success-bar {
  height: 72px !important;
  margin-top: -72px;
  width: calc(100% + 64px);
  max-width: initial !important;
  margin-left: -32px;
  max-height: 72px;
  display: flex;
  align-items: center;
  padding: 12px 16px !important;
}

.-no-margin {
  margin: 0;
}

.settings-section {
  @include Flex.flexbox($direction: column, $align: flex-start);
  row-gap: Tokens.$space-component-l;
}
</style>
