import { MockServerOptions } from '../../../../integration-tests/src/util'
import { mockedAlertsIntegrationTests } from './alerts'
import {
  mockedRecommendationsIntegrationTests,
  mockedRecommendationsMetadataIntegrationTests,
} from './recommendations'

export const createMockServerOptions = async (
  port: number,
  responseStatus: number,
): Promise<MockServerOptions> => {
  return {
    port: port,
    https: false,
    responses: {
      ['/mockedTenantId/oauth2/token']: {
        post: {
          responseStatus: responseStatus,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { access_token: 'mockedAccessToken' },
        },
      },
      ['/subscriptions/mockedSubscriptionId/providers/Microsoft.Security/alerts']:
        {
          get: {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              value: mockedAlertsIntegrationTests,
            },
          },
        },
      ['/subscriptions/mockedSubscriptionId/providers/Microsoft.Security/assessments']:
        {
          get: {
            responseStatus: responseStatus,
            responseHeaders: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            responseBody: {
              value: mockedRecommendationsIntegrationTests,
            },
          },
        },
      ['/providers/Microsoft.Security/assessmentMetadata']: {
        get: {
          responseStatus: responseStatus,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: {
            value: mockedRecommendationsMetadataIntegrationTests,
          },
        },
      },
    },
  }
}

export const createMockServerOptionsFAILED = async (
  port: number,
  responseStatus: number,
): Promise<MockServerOptions> => {
  return {
    port: port,
    https: false,
    responses: {
      ['/mockedTenantId/oauth2/token']: {
        post: {
          responseStatus: responseStatus,
        },
      },
      ['/subscriptions/mockedSubscriptionId/providers/Microsoft.Security/alerts']:
        {
          get: {
            responseStatus: responseStatus,
          },
        },
      ['/subscriptions/mockedSubscriptionId/providers/Microsoft.Security/assessment']:
        {
          get: {
            responseStatus: responseStatus,
          },
        },
      ['/providers/Microsoft.Security/assessmentMetadata']: {
        get: {
          responseStatus: responseStatus,
        },
      },
    },
  }
}
