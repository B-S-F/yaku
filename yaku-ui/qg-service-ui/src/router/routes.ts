// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { RouteRecordRaw } from 'vue-router'
import type { ErrorPageType } from '~/types'

export const ROUTE_NAMES = {
  CONFIGS_OVERVIEW: 'Configs',
  CONFIG_EDIT: 'EditConfig',
  DASHBOARD: 'Dashboard',
  DPP: 'Data Protection Policy',
  OSS_COMPLIANCE: 'OSS Compliance Information',
  RUNS_OVERVIEW: 'Runs',
  RUN_RESULTS: 'RunResults',
  FINDINGS_OVERVIEW: 'Findings',
  FINDING_RESULTS: 'FindingsResults',
  SECRETS_OVERVIEW: 'Secrets',
  EXCEL_TO_CONFIG: 'ExcelToConfig',
  RELEASE_OVERVIEW: 'Release Overview',
  RELEASE_DETAILS: 'Release details',
  RELEASE_DETAILS_CHECKS: 'Release details checks',
  RELEASE_DETAILS_HISTORY: 'Release details history',
  RELEASE_DETAILS_TASKS: 'Release details tasks',
  GET_STARTED: 'First steps with Yaku',
  SETTINGS: 'Settings',
  RELEASE_REPORT: 'Download Release Report',
} as const

export const routes: RouteRecordRaw[] = [
  {
    name: ROUTE_NAMES.GET_STARTED,
    path: '/',
    meta: {
      heading: 'First steps with Yaku',
    },
    component: () => import('~/components/views/VuetifySelectEnvironment.vue'),
  },
  {
    name: ROUTE_NAMES.DPP,
    path: '/data-protection-policy',
    meta: {
      isExtraView: true,
    },
    component: () =>
      import('~/components/views/VuetifyDataProtectionPolicy.vue'),
  },
  {
    name: ROUTE_NAMES.OSS_COMPLIANCE,
    path: '/oss-compliance-information',
    meta: {
      isExtraView: true,
    },
    component: () =>
      import('~/components/views/VuetifyOssComplianceInformation.vue'),
  },
  {
    name: 'Server',
    path: '/:serverSlug',
    meta: { authRequired: true },
    children: [
      {
        name: 'ServerError',
        path: 'errors',
        meta: { heading: 'Error', isErrorView: true },
        component: () => import('~/components/views/VuetifyErrorPage.vue'),
      },
      // Specific error name shortcut to avoid some misstypings
      {
        name: 'ServerNetworkError',
        path: 'errors',
        meta: { isErrorView: true },
        redirect: {
          name: 'ServerError',
          query: { type: 'no-network' satisfies ErrorPageType },
        },
      },
      {
        name: 'ServerNotFoundError',
        path: 'errors',
        meta: { isErrorView: true },
        redirect: {
          name: 'ServerError',
          query: { type: 'not-found' satisfies ErrorPageType },
        },
      },
      {
        name: 'ServerPermissionError',
        path: 'errors',
        meta: { isErrorView: true },
        redirect: {
          name: 'ServerError',
          query: { type: 'no-permission' satisfies ErrorPageType },
        },
      },
      {
        name: 'Namespace',
        path: ':namespaceSlug',
        redirect: { name: 'Configs' },
        meta: { authRequired: true },
        children: [
          {
            name: ROUTE_NAMES.DASHBOARD,
            path: 'dashboard',
            meta: { heading: 'Dashboard', authRequired: true },
            component: () => import('~/components/views/VuetifyDashboard.vue'),
          },
          {
            name: ROUTE_NAMES.RELEASE_OVERVIEW,
            path: 'releases',
            meta: { heading: 'Releases', authRequired: true },
            component: () =>
              import('~/components/views/VuetifyReleaseOverview.vue'),
          },
          {
            name: ROUTE_NAMES.RELEASE_DETAILS,
            path: 'releases/:id/details',
            alias: ['releases/:id'],
            meta: {
              authRequired: true,
            },
            redirect: { name: ROUTE_NAMES.RELEASE_DETAILS_CHECKS },
            children: [
              {
                name: ROUTE_NAMES.RELEASE_DETAILS_CHECKS,
                path: 'checks',
                meta: { heading: 'Release details', authRequired: true },
                component: () =>
                  import('~/components/views/VuetifyReleaseDetails.vue'),
              },
              {
                name: ROUTE_NAMES.RELEASE_DETAILS_HISTORY,
                path: 'history',
                meta: { heading: 'Release details', authRequired: true },
                component: () =>
                  import('~/components/views/VuetifyReleaseDetails.vue'),
              },
              {
                name: ROUTE_NAMES.RELEASE_DETAILS_TASKS,
                path: 'tasks',
                meta: { heading: 'Release details (Beta)', authRequired: true },
                component: import(
                  '~/components/views/VuetifyReleaseDetails.vue'
                ),
              },
              {
                name: ROUTE_NAMES.RELEASE_REPORT,
                path: 'report',
                meta: {
                  heading: 'Release Details Report',
                  authRequired: true,
                  isPrintView: true,
                },
                component: () =>
                  import('~/components/views/VuetifyDownloadReleaseReport.vue'),
              },
            ],
          },
          {
            name: ROUTE_NAMES.CONFIGS_OVERVIEW,
            path: 'configs',
            meta: { heading: 'Configurations', authRequired: true },
            component: () =>
              import('~/components/views/VuetifyConfigsOverview.vue'),
          },
          {
            name: ROUTE_NAMES.EXCEL_TO_CONFIG,
            path: 'configs/generate',
            meta: { heading: 'Generate a Configuration', authRequired: true },
            component: () =>
              import('~/components/views/VuetifyExcelToConfig.vue'),
          },
          {
            name: ROUTE_NAMES.CONFIG_EDIT,
            path: 'configs/:id/edit',
            alias: ['configs/:id'],
            meta: { authRequired: true },
            component: () => import('~/components/views/VuetifyEditConfig.vue'),
          },
          {
            name: ROUTE_NAMES.RUNS_OVERVIEW,
            path: 'runs',
            meta: { heading: 'Runs', authRequired: true },
            component: () =>
              import('~/components/views/VuetifyRunsOverview.vue'),
          },
          {
            name: ROUTE_NAMES.RUN_RESULTS,
            path: 'runs/:id/results',
            alias: ['runs/:id'],
            meta: { heading: 'Run Results', authRequired: true },
            component: () => import('~/components/views/VuetifyRunResults.vue'),
          },
          {
            name: ROUTE_NAMES.SECRETS_OVERVIEW,
            path: 'secrets',
            meta: { heading: 'Secrets', authRequired: true },
            component: () => import('~/components/views/VuetifySecrets.vue'),
          },
          {
            name: ROUTE_NAMES.FINDINGS_OVERVIEW,
            path: 'findings',
            meta: { heading: 'Findings', authRequired: true },
            component: () =>
              import('~/components/views/VuetifyFindingsOverview.vue'),
          },
          {
            name: ROUTE_NAMES.FINDING_RESULTS,
            path: 'findings/:id',
            meta: { heading: 'Findings Results', authRequired: true },
            component: () =>
              import('~/components/views/VuetifyFindingsResults.vue'),
          },
          {
            name: 'Error',
            path: 'errors',
            meta: { heading: 'Error', isErrorView: true },
            component: () => import('~/components/views/VuetifyErrorPage.vue'),
          },
          // Specific error name shortcut to avoid some misstypings
          {
            name: 'NetworkError',
            path: 'errors',
            meta: { isErrorView: true },
            redirect: {
              name: 'Error',
              query: { type: 'no-network' satisfies ErrorPageType },
            },
          },
          {
            name: 'NotFoundError',
            path: 'errors',
            meta: { isErrorView: true },
            redirect: {
              name: 'Error',
              query: { type: 'not-found' satisfies ErrorPageType },
            },
          },
          {
            name: 'PermissionError',
            path: 'errors',
            meta: { isErrorView: true },
            redirect: {
              name: 'Error',
              query: { type: 'no-permission' satisfies ErrorPageType },
            },
          },
          {
            // TODO: Move this to root
            name: ROUTE_NAMES.SETTINGS,
            path: 'settings',
            meta: { heading: 'Settings', authRequired: true },
            component: () => import('~/components/views/VuetifySettings.vue'),
          },
        ],
      },
    ],
  },
  {
    name: 'ServerError',
    path: '/errors',
    meta: { heading: 'Error', isErrorView: true },
    component: () => import('~/components/views/VuetifyErrorPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    meta: { heading: 'Error', isErrorView: true },
    component: () => import('~/components/views/VuetifyErrorPage.vue'),
    beforeEnter: () => {
      return {
        path: '/errors',
        query: {
          type: 'not-found',
        },
      }
    },
  },
]
