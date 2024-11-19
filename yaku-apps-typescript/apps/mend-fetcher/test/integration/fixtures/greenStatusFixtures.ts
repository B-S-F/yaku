// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MockServerOptions } from '../../../../../integration-tests/src/util'
import {
  librariesData,
  organizationData,
  projectData,
  projectVitalsData,
} from './data'

export const getGREENStatusFixture = async (
  port: number,
  responseStatus: number,
  options: {
    org: string
    project: string
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
        get: {
          responseStatus: responseStatus,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: [], additionalData: {} },
        },
      },
      [`/api/v2.0/projects/${options.project}/alerts/security`]: {
        get: {
          responseStatus: responseStatus,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: [], additionalData: {} },
        },
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
          get: {
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
        },
      [`/api/v2.0/projects/${options.project}/libraries/${librariesData[1].uuid}/vulnerabilities`]:
        {
          get: {
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
        },
    },
  }
}
