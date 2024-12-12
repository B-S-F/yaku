<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <!-- Define the list of parameters as reusable template -->
  <DefineTemplate v-slot="{ inputs }">
    <ul class="semantic-list parameter-fields">
      <li v-for="parameter in inputs" :key="parameter.name">
        <div v-if="parameter.content === 'string' && parameter.isSecret" class="secret-input-group">
          <FrogDropdown :id="parameter.name" :modelValue="SelectItemConverter.fromString(values[parameter.name])"
            :label="parameter.name" :items="secrets.map(SelectItemConverter.fromSecret)"
            @update:modelValue="values[parameter.name] = $event.value.toString()" />
          <FrogButton v-if="parameter.isSecret" integrated icon="mdi-plus"
            @click="showAddSecretDialogFor = parameter.name">
            New
          </FrogButton>
        </div>
        <FrogTextInput v-else-if="parameter.content === 'string'" :id="parameter.name" :label="parameter.name"
          :model-value="values[parameter.name] ?? ''" @update:modelValue="values[parameter.name] = $event" />
        <FrogCheckbox v-else-if="parameter.content === 'boolean'" :name="parameter.name" :label="parameter.name"
          :modelValue="!!values[parameter.name]"
          @update:modelValue="values[parameter.name] = $event ? $event.toString() : ''" />
        <FrogDropdown v-else-if="parameter.content === 'enum' && parameter.contentEnum" :id="parameter.name"
          :modelValue="{
            value: values[parameter.name],
            label: values[parameter.name]
          }" :label="parameter.name" :items="parameter.contentEnum.map(SelectItemConverter.fromString)"
          @update:modelValue="values[parameter.name] = $event.value.toString()" />
      </li>
    </ul>
  </DefineTemplate>

  <FrogDialog id="apps-dialog" open :title="checkName" @close="emit('abort')">
    <template #body>
      <div class="apps">
        <template v-if="withAppList">
          <section class="available-apps">
            <header>
              <h2 class="text-h6 font-weight-bold">
                Available apps
              </h2>
              <FrogChip id="apps-dialog-app-count" class="readonly-chip" :label="apps.length.toString()" />
            </header>
            <ul class="semantic-list app-list">
              <li v-for="app in apps" :key="app.id">
                <VuetifyAppItem :name="app.name" :selected="app.id === selectedApp?.id" @click="selectedApp = app" />
              </li>
            </ul>
          </section>
          <hr class="a-divider a-divider--vertical">
        </template>
        <section v-show="selectedApp" class="app-edition">
          <header>
            <h2 class="text-h6 font-weight-bold">
              Adjust variables
            </h2>
            <p class="app-description">
              {{ selectedApp?.description }}
              <a :href="selectedApp?.handbookLink" target="_blank">
                Documentation
              </a>
            </p>
          </header>
          <FrogTabNavigation v-model:selected="currentTab" :tabs="TABS" />
          <ReuseTemplate :inputs="mandatoryInputs" />

          <FrogButton class="toggle-optional" tertiary @click="showOptionalFields = !showOptionalFields">
            <Stack v-slot="{ visibleClass }">
              <span :class="{ [visibleClass]: !showOptionalFields }">Show optional variables</span>
              <span :class="{ [visibleClass]: showOptionalFields }">Hide optional variables</span>
            </Stack>
          </FrogButton>
          <ReuseTemplate v-if="showOptionalFields" :inputs="optionalInputs" />
        </section>
      </div>
    </template>
    <template #actions>
      <div class="cli-preview">
        <span ref="cliPreviewNode" data-lang="shell">{{ cli }}</span>
      </div>
      <div class="action-group">
        <FrogButton primary @click="selectedApp ? onConfirm(selectedApp) : undefined">
          Save
        </FrogButton>
        <FrogButton secondary @click="emit('abort')">
          Cancel
        </FrogButton>
      </div>
    </template>
  </FrogDialog>
  <VuetifyBlurBackground v-if="showAddSecretDialogFor">
    <VuetifyEditSecretDialog actionType="create" :errorMsg="apiError"
      @create="onAddSecret($event, showAddSecretDialogFor)" @close="showAddSecretDialogFor = undefined" />
  </VuetifyBlurBackground>
</template>

<script setup lang="ts">
import type { Tab } from '@B-S-F/frog-vue'
import { createReusableTemplate } from '@vueuse/core'
import { editor } from 'monaco-editor'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import type { SecretPost } from '~/api'
import { storeContext } from '~/composables/api'
import { useSecretStore } from '~/store/useSecretStore'
import type { App, Parameter } from '~/types/AppCatalog'
import type { AppFilled } from '~/types/AppEdition'
import { useColorScheme } from '~composables'
import { SelectItemConverter, formatParameter } from '~helpers'

type AppValues = Record<string, string>
const props = defineProps<{
  checkName: string
  apps: App[]
  withAppList?: boolean
  prefill?: {
    appId: App['id']
    values: AppValues
  }
}>()

const emit = defineEmits<{
  (e: 'abort'): void
  (e: 'confirm', payload: AppFilled & { formattedArgs: string[] }): void
  (e: 'previous'): void
  (e: 'next'): void
}>()

const EditSecretDialog = defineAsyncComponent(
  () => import('~/components/organisms/VuetifyEditSecretDialog.vue'),
)
const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
  inputs: App['parameters']
}>()

const selectedApp = ref<App | undefined>(
  props.prefill
    ? props.apps.find((a) => a.id === props.prefill!.appId)
    : undefined,
)

const relatedInputs = computed(() =>
  selectedApp.value?.parameters.filter((p) => p.type === currentTab.value.id),
)
const mandatoryInputs = computed(
  () => relatedInputs.value?.filter((p) => !p.optional) ?? [],
)
const optionalInputs = computed(
  () => relatedInputs.value?.filter((p) => p.optional) ?? [],
)

const values = ref<AppValues>(props.prefill?.values ?? {})
watch(selectedApp, (newVal) => {
  if (!newVal) return
  values.value = newVal.parameters.reduce((acc, v) => {
    acc[v.name] = ''
    return acc
  }, {} as AppValues)
})

const TABS = [
  { id: 'env', label: 'Environment variables' },
  { id: 'arg', label: 'Arguments' },
] satisfies Tab[]

const currentTab = ref<Tab>(TABS[0])

const showOptionalFields = ref(false)

const onConfirm = (app: App) => {
  emit('confirm', {
    app,
    args: parameterGrouped.value.arg,
    formattedArgs: formattedArguments.value,
    envs: parameterGrouped.value.env,
  })
}
// ---------------------
//  CLI preview builder
// ---------------------
const filledParams = computed(() =>
  Object.entries(values.value).filter((x) => x[1] && x[1] !== 'false'),
)
const parameterGrouped = computed(() => {
  const emptyAcc = { env: [], arg: [] }
  if (!selectedApp.value) return emptyAcc
  const parameters = selectedApp.value.parameters
  return filledParams.value.reduce(
    (acc, [name, value]) => {
      const parameter = parameters.find((p) => p.name === name)
      if (!parameter) return acc

      acc[parameter.type].push({
        parameter,
        value,
      })

      return acc
    },
    emptyAcc as Record<
      Parameter['type'],
      { parameter: Parameter; value: string }[]
    >,
  )
})

const formattedArguments = computed(() =>
  parameterGrouped.value.arg.map(({ parameter, value }) => {
    const { content, name } = parameter
    if (content === 'boolean') return formatParameter(name)
    if (content === 'enum' || content === 'string')
      return formatParameter(name, value)
    else {
      const unsupported: never = content
      throw new Error(
        `The parameter content type "${unsupported}" can not be formatted.`,
      )
    }
  }),
)

const cli = computed(() => {
  if (!selectedApp.value) return undefined
  const { executableName } = selectedApp.value

  return [executableName, ...formattedArguments.value].join(' ')
})
const cliPreviewNode = ref<HTMLElement>()
watch(cli, (command) => {
  if (!command) return
  editor.colorize(command, 'shell', {}).then((html) => {
    if (!cliPreviewNode.value) return
    cliPreviewNode.value.innerHTML = html
  })
})
const { colorScheme } = useColorScheme()
watch(
  colorScheme,
  (newScheme) => {
    editor.setTheme(newScheme === 'dark' ? 'vs-dark' : 'vs')
  },
  { immediate: true },
)

// -------------------
//  Secret management
// -------------------
const secretStore = useSecretStore(storeContext)
// fetch the secrets as they are only used in the visual editor
secretStore.getSecrets().then((r) => {
  if (!r.ok) apiError.value = r.error.msg
})
const secrets = computed(() =>
  [...secretStore.secrets].sort((a, b) => a.name.localeCompare(b.name)),
)

const showAddSecretDialogFor = ref<string>()
const apiError = ref<string>()
/** must be called only after the editor is mounted. */
const onAddSecret = async (payload: SecretPost, toParameterName: string) => {
  const result = await secretStore.createSecret(payload)
  if (result.ok) {
    values.value[toParameterName] = result.resource.name
    showAddSecretDialogFor.value = undefined
  } else {
    apiError.value = result.error.msg
  }
}
</script>

<style scoped lang="scss">
@use '../../styles/tokens.scss' as Tokens;

#apps-dialog {
  --max-dialog-width: 1090px;
  margin-top: 48px; // never overflow the app header
  overflow-y: auto;
  max-height: Tokens.$dialogMaxHeight;
}

.apps {
  display: flex;

  >* {
    height: 70vh;
    overflow-y: auto;
  }
}

.available-apps {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  row-gap: $space-heading;
}

.app-list {
  display: flex;
  flex-direction: column;
  padding: $focus-width;
  overflow: auto;
}

.secret-input-group {
  display: flex;
  column-gap: $space-component-l;
}

.available-apps header {
  min-width: 300px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
  }
}

.app-edition {
  flex-grow: 1;
  padding: 0 $focus-width; // quick hack to display the input focus correctly

  header {
    display: flex;
    flex-direction: column;
    row-gap: $space-component-s;

    h2 {
      margin: 0;
    }
  }
}

.app-description {
  margin: 0;
}

.parameter-fields {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-l;
}

.toggle-optional {
  margin: $space-component-l 0;
}

.cli-preview {
  background-color: rgb(var(--v-theme-background));
  flex-grow: 1;
  white-space: nowrap;
  overflow-x: auto;
  padding: $padding-component-s;

  span {
    // set the expected margin on scroll
    margin-right: $padding-component-s;
  }
}

.action-group {
  display: flex;
  column-gap: $space-component-buttonGroup;
  margin: 0 0 0 auto;
}
</style>
