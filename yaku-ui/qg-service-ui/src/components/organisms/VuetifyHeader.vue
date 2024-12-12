<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

t<template>
  <v-navigation-drawer :rail="navigationDrawerOpen" permanent>
    <v-list-item nav>
      <v-btn v-if="navigationDrawerOpen" icon="mdi-menu" variant="text"
        @click.stop="navigationDrawerOpen = !navigationDrawerOpen" />
      <div v-else class="nav-open">
        <div class="font-weight-bold">
          Yaku
        </div>
        <v-btn icon="mdi-close" variant="text" @click.stop="navigationDrawerOpen = !navigationDrawerOpen" />
      </div>
    </v-list-item>

    <v-divider />
    <v-list class="d-flex flex-column pt-0">
      <v-list-item v-for="item in sidebarItems" :key="item.label" :prepend-icon="item.icon" :title="item.label"
        :class="{ 'bg-blue-lighten-2 ': item.isSelected }"
        @click="() => { router.push({ name: item.routeName, params: urlContext }) }" />

      <v-spacer />
      <v-list-item id="environment-settings-menu-activator" prepend-icon="mdi-server" title="Environment Settings"
        value="environment settings" @click="showNamespaceMenu = true">
        <v-menu activator="#environment-settings-menu-activator" location="end">
          <v-list>
            <v-list-item>
              <h3 v-if="namespaceOptions.length > 0" class="heading text-body-2 font-weight-bold">
                Select a namespace
              </h3>
              <v-list v-if="namespaceOptions.length > 0">
                <v-list-item v-for="namespace, i in namespaceOptions" :key="i" class="item"
                  :class="{ 'bg-blue-lighten-2 ': namespace.id === currentNamespace?.id }"
                  @click="onNamespaceSwitch(namespace?.name ? namespace?.name : `${namespace.id}`)">
                  {{ namespace.name }}
                </v-list-item>
              </v-list>
            </v-list-item>
          </v-list>
          <v-list>
            <v-list-item>
              <h3 v-if="environments.length > 0" class="text-body-2 font-weight-bold">
                Select an environment
              </h3>
              <v-list v-if="environments.length > 0">
                <v-list-item v-for="server, i in environments" :key="i" class="item"
                  :class="{ 'bg-blue-lighten-2 ': server.slug === currentEnv?.slug }" @click="switchEnv(server)">
                  {{
                    server.label
                  }}
                </v-list-item>
              </v-list>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
      <v-list-item id="user-settings-menu-activator" prepend-icon="mdi-account-circle-outline" title="User Settings"
        value="user settings">
        <v-menu activator="#user-settings-menu-activator" location="end">
          <v-list>
            <v-list-item @click="() => { router.push({ name: ROUTE_NAMES.SETTINGS, params: urlContext }) }">
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-list-item>
      <v-list-item prepend-icon="mdi-key-chain-variant" title="Secrets" value="secrets" :href="secretLink"
        target="_blank" />
      <v-list-item prepend-icon="mdi-chat-outline" title="Contacts" value="contacts" :href="CONTACT_EMAIL_LINK" />
      <v-list-item prepend-icon="mdi-help-circle-outline" title="Help" value="help" id="help-menu-activator"
        :href="DOCUMENTATION_LINK" target="_blank" />
      <v-list-item prepend-icon="mdi-file-document-outline" title="Data Protection Policy"
        value="data-protection-policy" target="_blank" :href="DATA_PROTECTION_POLICY_LINK" />
      <v-list-item prepend-icon="mdi-gavel" title="OSS Compliance Information" value="oss-compliance-information"
        target="_blank" :href="OSS_COMPLIANCE_LINK" />
    </v-list>
  </v-navigation-drawer>
  <v-app-bar class="bar" :height="bannerProps.ui || bannerProps.api ? 80 : 64" width="100%">
    <v-container class="pa-0" :height="bannerProps.ui || bannerProps.api ? 80 : 64" width="100%">
      <v-row class="mt-2">
        <v-col class="mx-2 pa-0">
          <div class="text-h6 font-weight-bold ml-4">
            {{ heading }}
          </div>
        </v-col>
        <v-spacer />
        <v-col class="pa-0">
          <VuetifyCrossNavigation data-cy="cross-section-header" />
        </v-col>
        <v-spacer />
        <v-col class="pa-0 pr-4 d-flex justify-end">
          <!-- Justify end -->
          <FrogButton class="color-scheme-toggle" integrated icon="mdi-theme-light-dark" @click="toggleColorScheme" />
        </v-col>
      </v-row>
      <v-row v-if="bannerProps.ui || bannerProps.api">
        <VuetifyDevBanner class="dev-banner" v-bind="bannerProps" />
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script setup lang="ts">
// TODOS: john leider, skaling
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type SidebarFlyout from '~/components/atoms/SidebarFlyout.vue'
import { useDevBanner } from '~/composables'
import {
  CONTACT_EMAIL_LINK,
  DATA_PROTECTION_POLICY_LINK,
  DOCUMENTATION_LINK,
  OSS_COMPLIANCE_LINK,
} from '~/config/app'
import type { RawEnvironment } from '~/types'
import { currentEnv, currentNamespace } from '~api'
import { useColorScheme, useMainHeading, useUrlContext } from '~composables'

import { useLocalStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useIsOnboardingActive } from '~/composables/onboarding/useIsOnboardingActive'
import {
  onboardingTour,
  useOnboarding,
} from '~/composables/onboarding/useOnboarding'
import { useOnboardingRoutes } from '~/composables/onboarding/useOnboardingRoutes'
import { SWITCH_SERVER_FROM } from '~/constants/keycloak'
import isMenuItemSelected from '~/helpers/isMenuItemSelected'
import { ACTIVE_ENV_KEY } from '~/main'
import { ROUTE_NAMES } from '~/router'
import { switchEnvironment } from '~/router/utils'
import useEnvsStore from '~/store/useEnvsStore'
import useKeycloakStore from '~/store/useKeycloakStore'

const props = defineProps<{
  environments: RawEnvironment[]
}>()

const emit = defineEmits<(e: 'update:isLoading', newVal: boolean) => void>()

const router = useRouter()
const route = useRoute()
const { heading } = useMainHeading()
const keycloakStore = useKeycloakStore()
const { user } = storeToRefs(keycloakStore)
const onboardingRoutes = useOnboardingRoutes()
const { isActive: isOnboardingActive } = useIsOnboardingActive()
const navigationDrawerOpen = ref(false)

const secretLink = computed(
  () =>
    `/${urlContext.value.serverSlug}/${urlContext.value.namespaceSlug}/secrets`,
)
const { bannerProps } = useDevBanner(currentEnv)

// -----------
//  User Menu
// -----------
const userMenuToggleRef = ref<HTMLDivElement>()
const USER_MENU_TOGGLE_ID = 'user-menu-toggle'
onMounted(() => {
  userMenuToggleRef.value = document.getElementById(
    USER_MENU_TOGGLE_ID,
  ) as HTMLDivElement
})

const userMenuRef = ref<InstanceType<typeof SidebarFlyout>>()
const showUserMenu = ref(false)

const userMenuLabel = computed(() => (user?.value?.name as string) ?? 'Menu')

const logout = async () => {
  localStorage.removeItem(ACTIVE_ENV_KEY)
  // The page will reload from '/'
  await keycloakStore.logout()
}

// ----------------
//  Namespace menu
// ----------------
const namespaceMenuRef = ref<HTMLDialogElement | null>(null)
const NAMESPACE_MENU_TOGGLE_ID = 'namespace-menu-toggle'
const namespaceMenuToggleRef = ref<HTMLDivElement | null>(null)
onMounted(() => {
  namespaceMenuToggleRef.value = document.getElementById(
    NAMESPACE_MENU_TOGGLE_ID,
  ) as HTMLDivElement
})
const onNamespaceToggle = () => {
  if (showEnvironmentMenu.value) {
    showEnvironmentMenu.value = false
  } else {
    showNamespaceMenu.value = !showNamespaceMenu.value
  }
}

const showNamespaceMenu = ref(false)

// ------------------
//  Environment Menu
// ------------------
const showEnvironmentMenu = ref(false)
const environmentMenuRef = ref<HTMLDialogElement | null>(null)

// ------------------
//  Help Menu
//  ------------------
const showHelpMenu = ref(false)
const helpMenuToggleRef = ref<HTMLDivElement | null>(null)
const findOnboardingRoute = computed(() =>
  onboardingRoutes.find(
    (onboardingRoute) => onboardingRoute.name === route.name,
  ),
)
const canStartGuidedTour = computed(() => !!findOnboardingRoute.value)
const { start } = useOnboarding({
  onboardingTour: findOnboardingRoute.value?.config ?? [],
})

watch(isOnboardingActive, (newVal) => {
  if (newVal) {
    onboardingTour.value = findOnboardingRoute.value?.config
  }
})

const { urlContext, envPathPrefix } = useUrlContext()
const hasUrlContext = computed(
  () => urlContext.value.namespaceSlug && urlContext.value.namespaceSlug,
)

const { toggleColorScheme } = useColorScheme()

// -------------------------------
//  On server or namespace switch
// -------------------------------
/**
 * TODO: refactor this unreliable behavior on setTimeout
 *
 * even with nextTick, some elements are not in sync with the isLoading state. So we wait a bit!
 */
const onSwitchFinish = (openNamespaceMenu?: boolean) =>
  setTimeout(() => {
    emit('update:isLoading', false) // out of sync elements here
    showNamespaceMenu.value = openNamespaceMenu ?? false
    showEnvironmentMenu.value = false
  }, 1)

const switchEnv = async (environment: RawEnvironment) => {
  switchEnvironment(
    router,
    environment.slug ?? fallbackEnvironment,
    switchKeycloakFrom.value,
  )
  onSwitchFinish()
}

const switchNamespace = (namespaceName: string) => {
  if (!currentEnv.value) return
  const { slug: serverSlug, namespaces } = currentEnv.value
  const newNamespace = namespaces?.find((n) => n.name === namespaceName)
  if (!newNamespace) return
  currentNamespace.value = newNamespace
  const switchToRoute = sidebarItems.value.find((i) => i.isSelected)
  router.push({
    name: switchToRoute?.routeName,
    params: { serverSlug, namespaceSlug: namespaceName },
  })
}
const onNamespaceSwitch = async (namespaceName: string) => {
  emit('update:isLoading', true)
  await nextTick() // force the update:isLoading event to be applied to refresh the view
  switchNamespace(namespaceName)
  onSwitchFinish()
}
const { fallbackEnvironment } = useEnvsStore()
const namespaceOptions = computed(() =>
  !currentEnv.value || !currentEnv.value.namespaces
    ? []
    : currentEnv.value.namespaces.map((n) => {
        return { id: n.id, name: n.name ?? n.id }
      }),
)
const userHasNoPermission = computed(
  () => route.meta.isErrorView && route.query.type?.includes('no-permission'),
)
const sidebarItems = computed(() => {
  const items = [
    {
      label: 'Dashboard',
      icon: 'mdi-monitor-dashboard',
      href: `${envPathPrefix.value}/dashboard`,
      isSelected: isMenuItemSelected(route.fullPath, 'dashboard'),
      isDisabled: userHasNoPermission.value,
      routeName: ROUTE_NAMES.DASHBOARD,
    },
    {
      label: 'Releases',
      icon: 'mdi-cube-outline',
      href: `${envPathPrefix.value}/releases`,
      isSelected: isMenuItemSelected(route.fullPath, 'releases'),
      isDisabled: userHasNoPermission.value,
      routeName: ROUTE_NAMES.RELEASE_OVERVIEW,
    },
    {
      label: 'Configurations',
      icon: 'mdi-wrench-outline',
      href: `${envPathPrefix.value}/configs`,
      isSelected: isMenuItemSelected(route.fullPath, 'configs'),
      isDisabled: userHasNoPermission.value,
      routeName: ROUTE_NAMES.CONFIGS_OVERVIEW,
    },
    {
      label: 'Runs',
      icon: 'mdi-play-outline',
      href: `${envPathPrefix.value}/runs`,
      isSelected: isMenuItemSelected(route.fullPath, 'runs'),
      isDisabled: userHasNoPermission.value,
      routeName: ROUTE_NAMES.RUNS_OVERVIEW,
    },
    {
      label: 'Findings',
      icon: 'mdi-file-document-remove-outline',
      href: `${envPathPrefix.value}/findings`,
      isSelected: isMenuItemSelected(route.fullPath, 'findings'),
      isDisabled: userHasNoPermission.value,
      routeName: ROUTE_NAMES.FINDINGS_OVERVIEW,
    },
  ]

  return items
})
const activeView = computed(() => {
  const route = sidebarItems.value.find((i) => i.isSelected)
  return route
})
const switchKeycloakFrom = useLocalStorage<string | undefined>(
  SWITCH_SERVER_FROM,
  activeView.value?.routeName,
)
watch(activeView, (newView) => {
  if (newView) switchKeycloakFrom.value = newView?.routeName
})
</script>

<style scoped lang="scss">
@use '../../styles/helpers.scss' as *;


.nav-open {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.v-list {
  height: calc(100% - 60px)
}

.dev-banner {
  position: fixed;
  left: 0;
  width: 100vw;
  height: 32px;
  z-index: 1;
}
</style>
