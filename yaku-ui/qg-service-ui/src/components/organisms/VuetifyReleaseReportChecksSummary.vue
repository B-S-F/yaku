<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <FrogCheckbox v-model="allOpen" name="toggleAll" class="toggle-all" label="Expand All"
    @update:modelValue="toggleAll" />
  <header :class="{ 'sr-only': semanticHeader }">
    <component :is="headingTag" class="heading text-lg-h6 font-weight-bold">
      {{ headingLabel }}
    </component>
    <span v-if="headingDesc">{{ headingDesc }}</span>
  </header>
  <ol class="navi-list semantic-list">
    <li v-for="chapter in contentItems" :key="chapter.id">
      <div class="navi-box" @click="toggleOpen(chapter.id)">
        <VuetifyStatusPill v-if="chapter.badge" v-bind="chapter.badge" class="pill" />
        <div class="navi-header">
          <VuetifyMarkdown tag="span" class="text-md-body-1 font-weight-bold highlighted"
            :source="`${chapter.id} ${chapter.title}`" />
          <FrogButton v-if="chapter.requirements.length > 0" integrated
            :icon="areOpen.includes(chapter.id) ? 'up' : 'down'" class="navi-header__button"
            @click.stop.prevent="toggleOpen(chapter.id)" />
        </div>
      </div>
      <ul v-if="areOpen.includes(chapter.id)" class="semantic-list">
        <li v-for="requirement in chapter.requirements" :key="`${chapter.id}-${requirement.id}`" class="sub-navi-item"
          data-cy="sub-navi-item">
          <h5 class="text">
            <VuetifyMarkdown tag="span" class="text-md-body-1 font-weight-bold highlighted"
              :source="`${requirement.id} ${requirement.title}`" />
          </h5>

          <ul v-if="requirement.checks.length" class="semantic-list checks-list">
            <li v-for="check in requirement.checks" :key="`${chapter.id}-${requirement.id}-${check.id}`">
              <div class="sub-navi-item-layout" :class="{
                'with-pill': check.badge
              }">
                <span class="highlighted index font-weight-bold text-md-boddy-1">{{ check.id }}</span>
                <h3 class="check-title text-md-body-1 font-weight-bold -no-margin">
                  <VuetifyStatusPill v-if="check.status" rounded
                    v-bind="getResultPillFromStatus(check.status, !!check.override)">
                    <template #icon>
                      <FrogIcon v-if="getResultPillFromStatus(check.status, !!check.override).icon"
                        :icon="getResultPillFromStatus(check.status, !!check.override).icon ?? ''" />
                      <component :is="getResultPillFromStatus(check.status, !!check.override).iconComponent" v-else />
                    </template>
                  </VuetifyStatusPill>
                  <VuetifyMarkdown tag="span" class="highlighted" :source="` ${check.title}`" />
                </h3>
              </div>
              <div class="check-content">
                <div v-if="check.override" class="check-override-wrapper">
                  <div v-if="check.override" class="check-override">
                    <h3 class="-no-margin text-md-body-1 font-weight-bold">
                      Manual Override
                    </h3>
                    <VuetifyReleaseReportCheckOverride :override="check.override" />
                  </div>
                </div>
                <FrogAccordion v-if="check.comments && check.comments.length" class="check-comments-wrapper" small
                  :initialOpen="allOpen" :headline="'Comments (' + check.comments.length + ')'">
                  <template #content>
                    <div class="check-comments">
                      <VuetifyCommentsThread v-for="thread in check?.comments" :key="thread.id" :thread="thread"
                        no-reply read-only />
                    </div>
                  </template>
                </FrogAccordion>
                <div v-if="check.findings && check.findings.length > 0" class="check-findings-wrapper">
                  <FrogAccordion v-if="check.findings && check.findings.length" small :initialOpen="allOpen"
                    :headline="'Findings (' + check.findings.length + ')'">
                    <template #content>
                      <div class="check-findings">
                        <VuetifyReleaseReportCheckFinding v-for="(finding, idx) in check.findings" :key="finding.id"
                          :finding="finding" :index="idx + 1" />
                      </div>
                    </template>
                  </FrogAccordion>
                </div>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onBeforeUnmount, ref } from 'vue'
import { getResultPillFromStatus } from '~/helpers'
import { ReleaseReportChapter } from '~/types/ReleaseReport'

const props = defineProps<{
  semanticHeader?: boolean
  headingLabel: string
  headingTag: 'h1' | 'h2' | 'h3'
  headingDesc?: string
  contentItems: ReleaseReportChapter[]
}>()

const areOpen = ref<string[]>([])
const toggleOpen = (id: string) => {
  const isOpenAt = areOpen.value.findIndex((v) => v === id)
  if (isOpenAt === -1) {
    areOpen.value.push(id)
    if (areOpen.value.length === props.contentItems.length) {
      allOpen.value = true
    }
  } else {
    areOpen.value.splice(isOpenAt, 1)
    allOpen.value = false
  }
}

const allOpen = ref<boolean>(false)

const toggleAll = (e: boolean) => {
  allOpen.value = e
  if (e) {
    areOpen.value = props.contentItems.map((c) => c.id)
  } else {
    areOpen.value = []
  }
}

const cleanUp = useEventListener('beforeprint', () => {
  toggleAll(true)
})

onBeforeUnmount(() => cleanUp())
</script>

<style scoped lang="scss">
@use '../../styles/mixins/flex.scss' as Flex;
@use '../../styles/tokens.scss' as Tokens;

.toggle-all {
  margin-bottom: 32px;
}

.heading {
  margin: 0 0 $space-heading 0;
}

.navi-list {
  display: flex;
  flex-direction: column;
  row-gap: $space-component-s;
  overflow: auto;
}

.navi-box {
  color: inherit;
  text-decoration: none;

  display: flex;
  flex-direction: column;
  column-gap: $space-label-s;
  padding: $padding-component-s;
  background-color: #EEEEEE; // rgb(var(--v-theme-primary)); // grey-lighten-3

  .-dark-mode & {
    background-color: #212121; // grey-darken-4
  }

  span {
    text-decoration: none;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  &:hover {
    background-color: #E0E0E0; //  rgb(var(--v-theme-primary), var(--v-hover-opacity)); // grey-lighten-2 //FIXME var(--neutral__enabled__fill__hovered);
  }

  &:focus {
    background-color: #E0E0E0; // rgb(var(--v-theme-primary), var(--v-focus-opacity)); // grey-lighten-2 //FIXME var(--neutral__enabled__fill__hovered);
  }

  &.active {
    background-color: #BBDEFB; // rgb(var(--v-theme-primary), var(--v-opacity)); // blue-lighten-4 //FIXME var(--neutral__focused__fill__default);
  }
}

.navi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.5rem;
}

.sub-navi-item {
  display: flex;
  text-decoration: none;
  flex-direction: column;

  a:not(:hover) {
    color: inherit;
  }

  a.active {
    background-color: #BBDEFB; // rgb(var(--v-theme-primary), var(--v-activated-opacity)); // blue-lighten-4 //FIXME var(--neutral__focused__fill__default);
  }

  * {
    text-decoration: none;
  }

  h5 {
    margin: 0;
    padding: $spacing-12;
  }
}

.sub-navi-item-layout {
  width: 100%;
  display: grid;
  column-gap: $space-component-s;
  grid-template-columns: minmax(30px, auto) 1fr;
  grid-template-rows: auto 1fr;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid #616161; // grey-darken-2
  padding-bottom: 8px;

  &.with-pill {
    row-gap: $space-component-xs;
  }

  .pill {
    grid-column: 2 / 3;
  }

  span.index {
    text-align: right;
  }

  .check-title {
    @include Flex.flexbox($align: center);
    column-gap: Tokens.$space-component-s;
  }
}

.pill {
  margin-bottom: 4px;
  padding: 0 10px;
  border-radius: 16px;
  font-size: 0.75rem;
}

.semantic-list {
  span {
    max-width: 100%;
    word-break: break-word;
  }
}

.checks-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  li {
    width: 100%;
    margin-bottom: 8px;
    padding: 12px;
  }
}

.check-content {
  padding: 0 0 0 64px;
  @include Flex.flexbox($direction: column, $align: stretch);
  row-gap: 8px;
}

.-no-margin {
  margin: 0;
}

.check-override {
  @include Flex.flexbox($direction: column, $align: stretch);
  row-gap: 8px;
}

.check-comments-wrapper {
  border-top: 0;

  :deep(.thread:last-child) {
    margin-bottom: 0;
  }

  .check-comments {
    padding: 12px;
  }
}

.check-findings {
  padding: Tokens.$space-component-m;
  @include Flex.flexbox($direction: column, $align: stretch);
  row-gap: 12px;

}

.check-findings-wrapper {
  .report-check-finding {
    background-color: rgb(var(--v-theme-background));
  }
}
</style>
