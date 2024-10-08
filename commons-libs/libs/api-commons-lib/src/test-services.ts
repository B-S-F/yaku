import { Response } from 'express'
import { createRequest } from 'node-mocks-http'

export const testingNamespaceId = 1

export const namespaceUrl = `https://localhost:3000/api/v1/namespaces/${testingNamespaceId}`

export function createMockResponse(url: string, user?: any): Response {
  const reqBody: { [k: string]: any } = {
    protocol: 'https',
    url: url,
    headers: {
      host: 'localhost:3000',
    },
  }
  if (typeof user !== 'undefined') {
    reqBody.user = user
  }
  const request = createRequest(reqBody)
  const response: Partial<Response> = {
    req: request,
    header: jest.fn(),
    status: jest.fn(),
  }
  return response as Response
}
