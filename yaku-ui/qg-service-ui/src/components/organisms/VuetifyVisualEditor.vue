<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <div class="visual-editor-layout" :class="{
    'resizing': isResizingLeftPanel,
  }">
    <section ref="leftPanelRef" class="config-navigation" data-onboarding="navigation" :style="{
      '--left-panel-width': `${leftPanelWidth}px`
    }">
      <VuetifyContentNavigation headingLabel="Chapters" headingTag="h2"
        headingDesc="Overview of the chapters & added apps" withAutopilots withGlobalVariables
        :selected="currentContent" :contentItems="contentNavItems" />
      <FrogButton class="resize-btn bg-grey-lighten-2" integrated arial-label="resize panel"
        icon="mdi-arrow-split-vertical" @mousedown="resizeLeftPanel" />
    </section>
    <section class="visual-view" data-onboarding="configuration-view">
      <VuetifyEditGlobalVariables v-if="currentContent === 'globals'" :globalVars="globalVars"
        :runtimeVars="runtimeVars" @update:global-var="onGlobalUpdate" @update:runtime-var="onRuntimeUpdate"
        @watch-on="emit('update:search', $event)" />
      <VuetifyAutopilotsView v-else-if="contentTarget.type === 'autopilots'" :apps="apps" :configuration="configuration"
        :target="contentTarget.content"
        @add-app="showAppsDialogWith = { action: 'add-app-to-autopilot', app: undefined, autopilotId: $event.autopilotId }"
        @create-autopilot="showAppsDialogWith = { action: 'create-autopilot', app: undefined, autopilotId: undefined }"
        @edit-autopilot-env="onShowAutopilotEdit" @watch-on="emit('update:search', $event)"
        @delete-app="showAppsDialogWith = { action: 'delete', ...$event }"
        @edit-app="showAppsDialogWith = { action: 'update', ...$event }" />
      <VuetifyConfigurationView v-else-if="contentTarget.type === 'chapters' && !isSearchResultEmpty" :apps="apps"
        :configuration="configuration" :hasRunningTest="isRunningTestRun" :target="contentTarget.content"
        :varsToReplace="varsToReplace"
        @create-autopilot="showAppsDialogWith = { action: 'add', path: $event.path, app: undefined, autopilotId: undefined }"
        @use-autopilot="onAutomate" @delete-automation="deleteAutomation" @edit-automation="onAutomationEdit"
        @edit-manual="showManualWith = $event" @start-test-run="emit('start-test-run', $event)" />
      <VuetifyVisualNoSearchResults v-else />
    </section>
    <Teleport to="#app">
      <VuetifyBlurBackground v-if="showAutomationEditWith">
        <VuetifyVisualAutopilotDialog v-bind="showAutomationEditWith" @switch-autopilot="onAutopilotSwitch"
          @abort="showAutomationEditWith = undefined"
          @confirm-edit="onAutomationEditConfirm($event, showAutomationEditWith)" />
      </VuetifyBlurBackground>
      <VuetifyBlurBackground v-if="showAutopilotEditWith">
        <VuetifyVisualAutopilotDialog v-bind="showAutopilotEditWith" @abort="showAutopilotEditWith = undefined"
          @confirm-edit="onAutopilotEnvEdit($event, showAutopilotEditWith.autopilotName)" />
      </VuetifyBlurBackground>
      <VuetifyBlurBackground v-if="showAppsDialogWith">
        <VuetifyConfirmDialog v-if="showAppsDialogWith.action === 'delete'" id="delete-app-dialog" type="info"
          title="Delete the app?" :content="`The app ${showAppsDialogWith.app?.name} will be removed from the
          autopilot.`" @confirm="onAppDeleteConfirm(showAppsDialogWith)" @cancel="showAppsDialogWith = undefined" />
        <VuetifyAppsDialog v-else :checkName="getAppsDialogTitle(showAppsDialogWith)" :apps="apps" :prefill="appPrefill"
          :withAppList="showAppsDialogWith.action !== 'update'" @abort="showAppsDialogWith = undefined"
          @confirm="onAppEditConfirm($event, showAppsDialogWith)" />
      </VuetifyBlurBackground>
      <VuetifyBlurBackground v-if="showManualWith">
        <FrogDialog id="edit-manual-status-dialog" open :title="showManualWith.checkTitle"
          @close="showManualWith = undefined">
          <template #body>
            <VuetifyManualStatusForm id="manual-status-form" v-model:status="showManualWith.manual.status"
              v-model:reason="showManualWith.manual.reason" />
          </template>
          <template #actions>
            <FrogButton type="submit" for="manual-status-form" @click="onManualEditConfirm(showManualWith.manual)">
              Confirm
            </FrogButton>
            <FrogButton secondary @click="showManualWith = undefined">
              Cancel
            </FrogButton>
          </template>
        </FrogDialog>
      </VuetifyBlurBackground>
    </Teleport>
  </div>
</template>

<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { GetApps, SingleCheck } from '~/api'
import { useApiAppCatalog, useApiNetworkError } from '~/composables/api'
import useVisualEditorNavigator from '~/composables/editor/useVisualEditorNavigator'
import { useResizeDnD } from '~/composables/useResizeDnD'
import { useSearchInConfiguration } from '~/composables/useSearchInConfiguration'
import { DOUBLE_HYPHEN } from '~/config/app'
import type { App } from '~/types/AppCatalog'
import type { AppFilled } from '~/types/AppEdition'
import type { CheckPath, EnvVariableInput } from '~/types/Editor'
import type {
  AutomationEnv,
  AutopilotEnv,
  Env,
  Manual,
  OnyxConfiguration,
} from '~/types/OnyxConfiguration'
import {
  addApp,
  addAutomationToCheck,
  addAutomationToCheckWithNewAutopilot,
  createAutopilot,
  deleteApp,
  deleteAutomationOfCheck,
  getAutomationFrom,
  getCheckFrom,
  parseAppValuesOfAutopilot,
  provideRequestError,
  ReplaceableVars,
  updateApp,
  updateAutopilotEnv,
} from '~helpers'

const props = defineProps<{
  config: OnyxConfiguration
  search: string
  isRunningTestRun: boolean
  varsToReplace: ReplaceableVars
}>()

const emit = defineEmits<{
  (e: 'update:config', value: OnyxConfiguration): void
  (e: 'update:search', value: string): void
  (e: 'start-test-run', singleCheck: SingleCheck): void
}>()

const router = useRouter()
const route = useRoute()

const qgConfig = ref(props.config)
const updateQgConfig = () => emit('update:config', qgConfig.value)

const { results: searchedQgConfig } = useSearchInConfiguration(
  computed(() => props.search),
  qgConfig,
)
const configuration = computed(() =>
  props.search && searchedQgConfig.value
    ? searchedQgConfig.value
    : qgConfig.value,
)

const isSearchResultEmpty = computed(
  () => Object.keys(configuration.value.chapters).length === 0,
)

const apps = ref<App[]>([])
const apiAppCatalog = useApiAppCatalog()
apiAppCatalog
  .getApps({ includeParams: true })
  .then(async (r) => {
    if (r.ok) {
      const { data } = (await r.json()) as GetApps
      apps.value = data
    } else {
      console.error(await provideRequestError(r))
    }
  })
  .catch(() => console.error(useApiNetworkError()))

// ---------
//  Globals
// ---------
const globalVars = computed(() =>
  Object.entries(qgConfig.value.env ?? {}).map(([name, value]) => ({
    name,
    value,
  })),
)
const onGlobalUpdate = (name: string, value: string) => {
  if (!qgConfig.value.env) {
    qgConfig.value.env = { [name]: value }
  } else {
    qgConfig.value.env[name] = value
  }
  updateQgConfig()
}

const runtimeVars = computed(() =>
  Object.entries(qgConfig.value.default?.vars ?? {}).map(([name, value]) => ({
    name,
    value,
  })),
)
const onRuntimeUpdate = (name: string, value: string) => {
  if (!qgConfig.value.default?.vars) {
    qgConfig.value.env = { [name]: value }
  } else {
    qgConfig.value.default.vars[name] = value
  }
  updateQgConfig()
}

/**
 * Reset to the search results
 * on search content changes
 */
watch(
  () => props.search,
  (newSearch) => {
    if (!newSearch || !route.query.content) return
    const { name, params, query } = route
    router.push({
      name: name as string,
      params,
      query: { ...query, content: undefined },
    })
  },
)

// --------------
//  Apps edition
// --------------
type CreateAutopilotAction = {
  action: 'create-autopilot'
  autopilotId: undefined
  app: undefined
}
type AddAppAutopilotAction = {
  action: 'add-app-to-autopilot'
  autopilotId: string
  /** app should be an existing property to be handled by the appPrefill */
  app: undefined
}
/** temporary type until an Autopilot selector is implemented https://www.figma.com/file/MndvLTsCzxPAQTvO6DxiJi/Concept-Workfile?type=design&node-id=4392-152390&mode=dev  */
type AddAppCheckAction = {
  action: 'add'
  autopilotId: undefined
  path: CheckPath
  app: undefined
}
type UpdateAppAction = {
  action: 'update'
  autopilotId: string
  app: App
}
type DeleteAppAction = {
  action: 'delete'
  autopilotId: string
  app: App
}
const showAppsDialogWith = ref<
  | CreateAutopilotAction
  | AddAppAutopilotAction
  | AddAppCheckAction
  | UpdateAppAction
  | DeleteAppAction
>()
/** points to the related check of the path */
const getAppsDialogTitle = (
  context: NonNullable<(typeof showAppsDialogWith)['value']>,
) => {
  const { action, autopilotId } = context
  return action === 'create-autopilot' || action === 'add'
    ? 'Create autopilot'
    : autopilotId
}

const appPrefill = computed(() => {
  if (!showAppsDialogWith.value) return
  const { app, autopilotId } = showAppsDialogWith.value
  if (!app || !autopilotId) return

  const autopilot = configuration.value.autopilots[autopilotId]
  const values = parseAppValuesOfAutopilot(autopilot, app) ?? {}

  return {
    appId: app.id,
    values,
  }
})

/**
 * An app can be edited in order to create a new autopilot or to update a specific app in this autopilot
 */
const onAppEditConfirm = (
  payload: AppFilled & { formattedArgs: string[] },
  context:
    | CreateAutopilotAction
    | AddAppAutopilotAction
    | AddAppCheckAction
    | UpdateAppAction,
) => {
  const { action, autopilotId } = context

  if (action === 'create-autopilot') {
    createAutopilot(configuration.value, payload)
  } else if (action === 'add-app-to-autopilot') {
    addApp(configuration.value, autopilotId, payload)
  } else if (action === 'add') {
    addAutomationToCheckWithNewAutopilot(
      configuration.value,
      context.path,
      payload,
    )
  } else if (action === 'update') {
    updateApp(configuration.value, autopilotId, payload)
  }

  updateQgConfig()
  showAppsDialogWith.value = undefined
}
const onAppDeleteConfirm = (context: DeleteAppAction) => {
  const { autopilotId, app } = context

  deleteApp(configuration.value, autopilotId, app)
  updateQgConfig()
  showAppsDialogWith.value = undefined
}

// ---------------------
//  Automation edition
// ---------------------
type AutomationContext = { checkPath: CheckPath }
type AutomationDialogProps = {
  autopilotName: string
  autopilotIds: string[]
  env: EnvVariableInput[]
}

const showAutomationEditWith = ref<AutomationContext & AutomationDialogProps>()
/** a helper to get from an autopilot its envs (and add potential automation envs) */
const getAutopilotEnvsToDialog = (
  name: string,
  automationEnvs: AutomationEnv = {},
): EnvVariableInput[] => {
  const autopilotEnvs = configuration.value.autopilots[name].env ?? {}

  return Object.entries(autopilotEnvs).map(([name, defaultValue]) => {
    return {
      name,
      value:
        automationEnvs[name] && automationEnvs[name] !== defaultValue
          ? automationEnvs[name]
          : undefined,
      defaultValue,
    }
  })
}

const onAutomate = (payload: { path: CheckPath; autopilotId: string }) => {
  const check = getCheckFrom(configuration.value, payload.path)
  addAutomationToCheck(check, payload.autopilotId)
  updateQgConfig()
}

const onAutomationEdit = (checkPath: CheckPath) => {
  const automation = getAutomationFrom(configuration.value, checkPath)
  if (!automation) return
  showAutomationEditWith.value = {
    autopilotName: automation.autopilot,
    autopilotIds: [...Object.keys(configuration.value.autopilots)],
    checkPath,
    env: getAutopilotEnvsToDialog(automation.autopilot, automation.env),
  }
  updateQgConfig()
}
/** update the edit dialog props if the user changes the autopilot of the check in the dialog directly */
const onAutopilotSwitch = (autopilotName: string) => {
  if (!showAutomationEditWith.value) return
  showAutomationEditWith.value.autopilotName = autopilotName
  showAutomationEditWith.value.env = getAutopilotEnvsToDialog(autopilotName)
}

const onAutomationEditConfirm = (
  env: EnvVariableInput[],
  context: NonNullable<(typeof showAutomationEditWith)['value']>,
) => {
  const { checkPath } = context
  const automation = getAutomationFrom(configuration.value, checkPath)
  if (!automation) return
  automation.autopilot = context.autopilotName
  automation.env = env.reduce((acc, { name, value }) => {
    if (value !== undefined) acc[name] = value
    return acc
  }, {} as AutopilotEnv)
  showAutomationEditWith.value = undefined
  updateQgConfig()
}

const deleteAutomation = (checkPath: CheckPath) => {
  const check = getCheckFrom(configuration.value, checkPath)
  if (check) {
    deleteAutomationOfCheck(check)
    updateQgConfig()
  }
  // TODO: Do the autopilot gets deleted if there are no references to it anymore?
}

// -----------------------
//  Autopilot Env edition
// -----------------------
const showAutopilotEditWith = ref<{
  autopilotName: string
  env: EnvVariableInput[]
}>()
const onShowAutopilotEdit = (payload: {
  name: string
  env: Env | undefined
}) => {
  showAutopilotEditWith.value = {
    autopilotName: payload.name,
    env: Object.entries(payload.env ?? {}).map(([name, value]) => ({
      name,
      value,
      defaultValue: '',
    })),
  }
}
const onAutopilotEnvEdit = (env: EnvVariableInput[], autopilotName: string) => {
  updateAutopilotEnv(
    configuration.value,
    autopilotName,
    env.reduce((acc, v) => {
      acc[v.name] = v.value ?? ''
      return acc
    }, {} as Env),
  )
  updateQgConfig()
  showAutopilotEditWith.value = undefined
}

// ----------------
//  Manual edition
// ----------------
const showManualWith = ref<{
  path: CheckPath
  manual: Manual
  checkTitle: string
}>()

const onManualEditConfirm = (newVal: Manual) => {
  if (!showManualWith.value) return
  const { path } = showManualWith.value
  configuration.value.chapters[path.chapterId].requirements[
    path.requirementId
  ].checks[path.checkId].manual = newVal
  showManualWith.value = undefined
  updateQgConfig()
}

// ------------
//  Navigation
// ------------
const { currentContent, contentNavItems } = useVisualEditorNavigator(
  configuration,
  props.varsToReplace,
)

const contentTarget = computed(() => {
  const segments = currentContent.value?.split(DOUBLE_HYPHEN)
  if (!segments) return { type: 'chapters' }
  const [type, ...content] = segments
  if (type === 'autopilots') {
    return {
      type: 'autopilots' as const,
      content: currentContent.value?.slice('autopilots--'.length),
    } as const
  } else if (type === 'globals') {
    return {
      type: 'globals' as const,
      content: content,
    } as const
  } else {
    return {
      type: 'chapters' as const,
      content: {
        chapter: segments.at(1),
        requirement: segments.at(3),
      },
    } as const
  }
})

// ------------
//  Layout
// ------------
const leftPanelWidth = ref<number>(400)
const leftPanelRef = ref<HTMLDivElement>()

const onLeftPanelResize = ({ clientX }: MouseEvent) => {
  if (!leftPanelRef.value) return
  const originX = leftPanelRef.value.getBoundingClientRect().x
  leftPanelWidth.value = Math.max(400, Math.min(clientX - originX, 600))
}
const { setResize: resizeLeftPanel, isResizing: isResizingLeftPanel } =
  useResizeDnD({
    onResize: onLeftPanelResize,
  })
</script>

<style scoped lang="scss">
.visual-editor-layout {
  display: flex;
  column-gap: 32px;

  &.resizing * {
    user-select: none;
    -webkit-user-select: none; // safari
  }
}

.config-navigation,
.visual-view {
  padding: $padding-component-m;
  height: 100%;
  position: relative;

  .resize-btn {
    $width: 0.9rem;
    $height: 5.4rem;
    padding-top: 5rem;
    padding-bottom: 5rem;
    position: absolute;
    right: 0;
    top: calc(50% - #{$height * 0.5});
    width: $width;
    height: $height;
    cursor: ew-resize;
    border: none;
    border-radius: 4px;
    font-size: xx-small;

    --handle-color: #0D47A1; // blue-darken-4

    &:hover {
      --handle-color: #000000;
    }

    &:active {
      --handle-color: #000000;
    }

    &::before,
    &::after {
      $handleHeight: 0.5rem;
      display: block;
      position: absolute;
      width: 1px;
      height: $handleHeight;
      background-color: var(--handle-color);
      transform: translate(calc($width * 0.5 + var(--from-x-center)), #{($height - $handleHeight) * 0.5})
    }

    &::before {
      --from-x-center: -2px;
    }

    &::after {
      --from-x-center: 0px;
    }
  }
}

.visual-view {
  min-height: 100%;
  height: 100%;
}

.config-navigation:deep(>.navi-list) {
  overflow-y: auto;
}

.visual-view {
  overflow-y: auto;
  flex-grow: 1;
}


.config-navigation {
  width: 100%;
  max-width: var(--left-panel-width);


  display: flex;
  flex-direction: column;
  row-gap: $space-component-l;
  border-right: 0.0625rem solid #000000;

  @media screen and (max-width: $bp-max-1020) {
    display: none;
  }
}
</style>
