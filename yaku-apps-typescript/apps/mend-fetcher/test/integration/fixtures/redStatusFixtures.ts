// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MockServerOptions } from '../../../../../integration-tests/src/util'
import {
  librariesData,
  organizationData,
  policyAlertsData,
  newVersionsAlertsData,
  multipleLicensesAlertsData,
  rejectedInUseAlertsData,
  projectData,
  projectVitalsData,
  securityAlertsData,
  vulnerabilitiesData,
  vulnerabilitiesFixSummaryData,
} from './data'

export const getREDStatusFixture = async (
  port: number,
  responseStatus: number,
  options: {
    org: string
    project: string
    vulnerabilityId: string
    vulnerabilityId2: string
  }
): Promise<MockServerOptions> => {
  return {
    port: port,
    https: false,
    responses: {
      ['/api/v2.0/login']: {
        post: {
          responseStatus: responseStatus,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: { jwtToken: 'jwt-token', jwtTTL: 1800000 } },
        },
      },
      [`/api/v2.0/orgs/${options.org}`]: {
        get: {
          responseStatus: responseStatus,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: organizationData, additionalData: {} },
        },
      },
      [`/api/v2.0/projects/${options.project}`]: {
        get: {
          responseStatus: responseStatus,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: projectData },
        },
      },
      [`/api/v2.0/projects/${options.project}/vitals`]: {
        get: {
          responseStatus: responseStatus,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: projectVitalsData },
        },
      },
      [`/api/v2.0/projects/${options.project}/alerts/legal`]: {
        get: [
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: { retVal: policyAlertsData, additionalData: {} },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: { retVal: [], additionalData: {} },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: multipleLicensesAlertsData,
              additionalData: {},
            },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: { retVal: [], additionalData: {} },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: { retVal: newVersionsAlertsData, additionalData: {} },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: { retVal: [], additionalData: {} },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: rejectedInUseAlertsData,
              additionalData: {},
            },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: { retVal: [], additionalData: {} },
          },
        ],
      },
      [`/api/v2.0/projects/${options.project}/alerts/security`]: {
        get: [
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: { retVal: securityAlertsData, additionalData: {} },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: { retVal: [], additionalData: {} },
          },
        ],
      },
      [`/api/v2.0/projects/${options.project}/libraries`]: {
        get: [
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: librariesData,
              additionalData: {},
              supportToken: 'boo!',
            },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: [],
              additionalData: {},
              supportToken: 'boo!',
            },
          },
        ],
      },
      [`/api/v2.0/projects/${options.project}/libraries/${librariesData[0].uuid}/vulnerabilities`]:
        {
          get: [
            {
              responseStatus: responseStatus,
              responseHeaders: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              responseBody: {
                retVal: [vulnerabilitiesData[0], vulnerabilitiesData[1]],
                additionalData: {},
                supportToken: 'boo!',
              },
            },
            {
              responseStatus: responseStatus,
              responseHeaders: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              responseBody: {
                retVal: [],
                additionalData: {},
                supportToken: 'boo!',
              },
            },
          ],
        },
      [`/api/v2.0/projects/${options.project}/libraries/${librariesData[1].uuid}/vulnerabilities`]:
        {
          get: [
            {
              responseStatus: responseStatus,
              responseHeaders: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              responseBody: {
                retVal: [vulnerabilitiesData[1], vulnerabilitiesData[0]],
                additionalData: {},
                supportToken: 'boo!',
              },
            },
            {
              responseStatus: responseStatus,
              responseHeaders: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              responseBody: {
                retVal: [],
                additionalData: {},
                supportToken: 'boo!',
              },
            },
          ],
        },
      [`/api/v2.0/vulnerabilities/${options.vulnerabilityId}/remediation`]: {
        get: [
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: vulnerabilitiesFixSummaryData[0],
              additionalData: {},
              supportToken: 'boo!',
            },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: vulnerabilitiesFixSummaryData[0],
              additionalData: {},
              supportToken: 'boo!',
            },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: [],
              additionalData: {},
              supportToken: 'boo!',
            },
          },
        ],
      },
      [`/api/v2.0/vulnerabilities/${options.vulnerabilityId2}/remediation`]: {
        get: [
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: vulnerabilitiesFixSummaryData[1],
              additionalData: {},
              supportToken: 'boo!',
            },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: vulnerabilitiesFixSummaryData[1],
              additionalData: {},
              supportToken: 'boo!',
            },
          },
          {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              retVal: [],
              additionalData: {},
              supportToken: 'boo!',
            },
          },
        ],
      },
    },
  }
}
