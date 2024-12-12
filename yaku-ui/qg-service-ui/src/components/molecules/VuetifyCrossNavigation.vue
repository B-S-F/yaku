<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <ul v-if="active && breadcrumbs.length > 0" class="navigation semantic-list" data-onboarding="cross-section-header">
    <li v-for="(breadcrumb, index) in breadcrumbs" :key="index">
      <template v-if="!breadcrumb.hide">
        <FrogIcon v-if="index > 0" icon="mdi-chevron-right" />
        <component :is="breadcrumb.disabled ? 'span' : 'RouterLink'"
          :to="breadcrumb.disabled ? undefined : breadcrumb.to">
          <FrogPopover class="item" attached triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-bottom"
            :class="{ 'active': breadcrumb.type === active }"
            :deactivate="deactivatedTooltips[index] && !breadcrumb.contextTooltip"
            :label="breadcrumb.contextTooltip ?? breadcrumb.name">
            <!-- Special icon handling for the disabled runs -->
            <template v-if="breadcrumb.disabled && breadcrumb.type === 'RunResults'">
              <VuetifyRunRunningIcon v-if="breadcrumb.contextTooltip === DISABLED_RUN_REASONS.IN_PROGRESS"
                class="item-icon" />
              <VuetifyRunFailedOutlineIcon
                v-else-if="breadcrumb.contextTooltip === DISABLED_RUN_REASONS.MISSING_RESULTS" class="item-icon" />
            </template>
            <FrogIcon v-else :icon="breadcrumb.icon" />
            <span ref="nameRefs">
              {{ breadcrumb.name }}
            </span>
          </FrogPopover>
        </component>
      </template>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { RouteLocationNormalized, useRoute, useRouter } from 'vue-router'
import { storeContext } from '~/composables/api'
import { areRunResultsAvailable, isRunRunning } from '~/helpers'
import { ROUTE_NAMES } from '~/router'
import { useRelationStore } from '~/store/useRelationStore'
import { useRunStore } from '~/store/useRunStore'

const ROUTES_WITH_BREADCRUMBS = [
  ROUTE_NAMES.CONFIG_EDIT,
  ROUTE_NAMES.RUN_RESULTS,
  ROUTE_NAMES.FINDINGS_OVERVIEW,
  ROUTE_NAMES.FINDING_RESULTS,
  ROUTE_NAMES.RELEASE_DETAILS_CHECKS,
  ROUTE_NAMES.RELEASE_DETAILS_HISTORY,
]

const DISABLED_RUN_REASONS = {
  IN_PROGRESS: 'The run is currently in progress.',
  MISSING_RESULTS: 'The run failed and does not have results.',
}

const runStore = computed(() =>
  storeContext.value.serverId ? useRunStore(storeContext) : undefined,
)

const nameRefs = ref<HTMLElement[]>([])
const deactivatedTooltips = computed(() =>
  nameRefs.value.map((item) => item.scrollWidth <= item.offsetWidth),
)

const active = ref<
  | (typeof breadcrumbs)['value'][number]['type']
  | typeof ROUTE_NAMES.RELEASE_DETAILS_CHECKS
  | typeof ROUTE_NAMES.RELEASE_DETAILS_HISTORY
>()
const { clearRelationStore } = useRelationStore()
const { relation } = storeToRefs(useRelationStore())

const breadcrumbs = computed(() => {
  if (!relation.value) return []
  const { items, runId } = relation.value

  const run = runStore.value?.runs.find((r) => r.id === runId)
  const isRunning = run && isRunRunning(run)
  const hasResults = run && areRunResultsAvailable(run)
  const runContextTooltip = isRunning
    ? DISABLED_RUN_REASONS.IN_PROGRESS
    : !hasResults
      ? DISABLED_RUN_REASONS.MISSING_RESULTS
      : undefined

  return [
    {
      type: ROUTE_NAMES.CONFIG_EDIT,
      icon: 'mdi-wrench-outline',
      disabled: false,
      contextTooltip: undefined,
      ...items.configuration,
    },
    {
      type: ROUTE_NAMES.RUN_RESULTS,
      icon: 'mdi-play-outline',
      disabled: isRunning || !hasResults,
      contextTooltip: runContextTooltip,
      ...items.runs,
    },
    {
      type: ROUTE_NAMES.FINDINGS_OVERVIEW,
      icon: 'mdi-file-document-check-outline',
      disabled: false,
      contextTooltip: undefined,
      ...items.findings,
    },
  ] as const
})

const router = useRouter()
const getBreadcrumbs = (route: RouteLocationNormalized) => {
  const matchingRoute = ROUTES_WITH_BREADCRUMBS.find((r) => r === route.name) as
    | (typeof ROUTES_WITH_BREADCRUMBS)[number]
    | undefined

  if (
    !matchingRoute ||
    (matchingRoute === ROUTE_NAMES.FINDINGS_OVERVIEW &&
      route.query.configId === undefined)
  ) {
    active.value = undefined
    clearRelationStore()
  } else {
    active.value =
      matchingRoute === ROUTE_NAMES.FINDING_RESULTS
        ? ROUTE_NAMES.FINDINGS_OVERVIEW
        : matchingRoute
  }
}

router.afterEach((to) => getBreadcrumbs(to))

onMounted(() => {
  const route = useRoute()
  getBreadcrumbs(route)
})
</script>

<style scoped lang="scss">
.navigation.semantic-list {
  display: flex;
  background-color: #eff1f2;
  border-radius: 20px;
  padding: 4px;
  white-space: nowrap;
  margin: 4px 0;
  background-color: #e0e2e5;
  ;

  li {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.navigation a {
  text-decoration: none;
}

.item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 4px 16px 4px 4px;
  border-radius: 16px;
  color: #7d8389;
  ;

  >span {
    max-width: calc(300px - 1.5rem);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

a .item {
  color: #000000;
  ;

  &.active {
    color: #ffffff;
    ;
    background-color: #007bc0;
    ;
    font-weight: 700;
  }

  &:not(.active) {
    &:hover {
      background-color: #c1c7cc;
      ;
    }

    &:active {
      background-color: #a4abb3;
      ;
    }
  }
}

.item-icon {
  font-size: 1.5rem;
}

@media (max-width: $navbarFrom1060) {
  .item>span {
    max-width: calc(200px - 1.5rem);
  }
}

@media (max-width: $navbarFrom1000) {
  .item>span {
    max-width: calc(150px - 1.5rem);
  }
}

@media (max-width: $navbarFrom768) {
  .item>span {
    max-width: calc(100px - 1.5rem);
  }
}
</style>
