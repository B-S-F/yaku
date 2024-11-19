// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { MockServerOptions, ServerHost } from '../cli/mockserver'

export function createReleasesMockServerResponse(
  namespaceId: number,
  port: number,
  releaseId: number
): MockServerOptions {
  const serverHost: ServerHost = new ServerHost(
    'http',
    'localhost',
    String(port),
    '/api/v1'
  )

  return {
    port: port,
    responses: {
      [`/api/v1/namespaces/${namespaceId}/releases`]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              pagination: {
                pageNumber: 1,
                pageSize: 20,
                totalCount: 2,
              },
              data: [
                {
                  id: 1,
                  name: 'QG4.2 Battery Management BatMax',
                  approvalMode: 'one',
                  approvalState: 'pending',
                  createdBy: {
                    id: '8cfe061c-d8f3-4c54-9546-30de72b7dc13',
                    username: 'user@user.user',
                    email: 'user@user.user',
                    displayName: 'user@user.user user@user.user',
                    firstName: 'user@user.user',
                    lastName: 'user@user.user',
                  },
                  creationTime: '2024-09-13T10:56:45.503Z',
                  lastModifiedBy: {
                    id: '8cfe061c-d8f3-4c54-9546-30de72b7dc13',
                    username: 'user@user.user',
                    email: 'user@user.user',
                    displayName: 'user@user.user user@user.user',
                    firstName: 'user@user.user',
                    lastName: 'user@user.user',
                  },
                  lastModificationTime: '2024-09-13T10:56:45.503Z',
                  plannedDate: '2024-03-25T13:32:07.749Z',
                  qgConfigId: 2,
                  closed: false,
                  lastRunId: 2,
                },
              ],
              links: {
                first: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/releases?page=1&items=20`,
                last: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/releases?page=1&items=20`,
                next: `${serverHost.getApiEndpoint()}/namespaces/${namespaceId}/releases?page=1&items=20`,
              },
            },
          },
        ],
      },
      [`/api/v1/namespaces/${namespaceId}/releases/${releaseId}`]: {
        get: [
          {
            responseStatus: 200,
            responseBody: {
              id: `${releaseId}`,
              name: 'QG4.2 Battery Management BatMax',
              approvalMode: 'one',
              approvalState: 'pending',
              createdBy: {
                id: '8cfe061c-d8f3-4c54-9546-30de72b7dc13',
                username: 'user@user.user',
                email: 'user@user.user',
                displayName: 'user@user.user user@user.user',
                firstName: 'user@user.user',
                lastName: 'user@user.user',
              },
              creationTime: '2024-09-13T10:56:45.503Z',
              lastModifiedBy: {
                id: '8cfe061c-d8f3-4c54-9546-30de72b7dc13',
                username: 'user@user.user',
                email: 'user@user.user',
                displayName: 'user@user.user user@user.user',
                firstName: 'user@user.user',
                lastName: 'user@user.user',
              },
              lastModificationTime: '2024-09-13T10:56:45.503Z',
              plannedDate: '2024-03-25T13:32:07.749Z',
              qgConfigId: 2,
              closed: false,
              lastRunId: 2,
            },
          },
        ],
      },
    },
  }
}
