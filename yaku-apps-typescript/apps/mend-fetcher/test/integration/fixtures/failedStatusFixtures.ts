import { MockServerOptions } from '../../../../../integration-tests/src/util'
import {
  librariesData,
  organizationData,
  projectData,
} from '../../unit/fixtures/data'
import { projectVitalsData } from './data'

export const getFAILEDEmptyFixture = async (
  port: number,
): Promise<MockServerOptions> => {
  return {
    port: port,
    https: false,
    responses: {
      ['/api/v2.0/login']: {
        post: {
          responseStatus: 500,
        },
      },
    },
  }
}

export const getFAILEDLoginFixture = async (
  port: number,
): Promise<MockServerOptions> => {
  return {
    port: port,
    https: false,
    responses: {
      ['/api/v2.0/login']: {
        post: {
          responseStatus: 401,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: 'Login failed' },
        },
      },
    },
  }
}

export const getFAILEDProjectFixture = async (
  port: number,
  options: {
    org: string
    project: string
  },
): Promise<MockServerOptions> => {
  return {
    port: port,
    https: false,
    responses: {
      ['/api/v2.0/login']: {
        post: {
          responseStatus: 200,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: { jwtToken: 'jwt-token', jwtTTL: 1800000 } },
        },
      },
      [`/api/v2.0/orgs/${options.org}`]: {
        get: {
          responseStatus: 200,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: { retVal: organizationData, additionalData: {} },
        },
      },
      [`/api/v2.0/projects/${options.project}`]: {
        get: {
          responseStatus: 404,
          responseHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          responseBody: {
            retVal: { errorMessage: 'Entity not found' },
            additionalData: {},
            supportToken: 'boo!',
          },
        },
      },
    },
  }
}

export const getFAILEDRandomApiFailureFixture = async (
  port: number,
  successResponseStatus: number,
  failedResponseStatus: number,
  options: { org: string; project: string },
) => {
  const responses = {
    ['/api/v2.0/login']: {
      post: {
        responseStatus: successResponseStatus,
        responseHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        responseBody: { retVal: { jwtToken: 'jwt-token', jwtTTL: 1800000 } },
      },
    },
    [`/api/v2.0/orgs/${options.org}`]: {
      get: {
        responseStatus: successResponseStatus,
        responseHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        responseBody: { retVal: organizationData, additionalData: {} },
      },
    },
    [`/api/v2.0/projects/${options.project}`]: {
      get: {
        responseStatus: successResponseStatus,
        responseHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        responseBody: { retVal: projectData },
      },
    },
    [`/api/v2.0/projects/${options.project}/vitals`]: {
      get: {
        responseStatus: successResponseStatus,
        responseHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        responseBody: { retVal: projectVitalsData },
      },
    },
    [`/api/v2.0/projects/${options.project}/libraries`]: {
      get: [
        {
          responseStatus: successResponseStatus,
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
          responseStatus: successResponseStatus,
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
          responseStatus: successResponseStatus,
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
          responseStatus: successResponseStatus,
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
  }
  const randomEndpoint = Object.entries(responses)[getRandomNumber(1, 6)][1]
  const endpointResponse = (randomEndpoint['get'] ??= randomEndpoint['post'])
  if (Array.isArray(endpointResponse)) {
    const responseNumber =
      endpointResponse[getRandomNumber(0, endpointResponse.length - 1)]
    responseNumber.responseStatus = failedResponseStatus
    responseNumber.responseBody = {
      retVal: { errorMessage: 'Response Error Message' },
      supportToken: 'boo!',
    }
  } else {
    endpointResponse.responseStatus = failedResponseStatus
    endpointResponse.responseBody = {
      retVal: { errorMessage: 'Response Error Message' },
      supportToken: 'boo!',
    }
  }
  return {
    port: port,
    https: false,
    responses: responses,
  }
}

const getRandomNumber = (min: number, max: number): number => {
  const start = Math.ceil(min)
  const end = Math.ceil(max)
  return Math.floor(Math.random() * (end - start + 1)) + start
}
