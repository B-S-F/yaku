// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import express, { Express, Request, Response } from 'express'
import * as fs from 'fs'
import { IncomingHttpHeaders, Server } from 'http'
import * as https from 'https'
import path from 'path'

export const MOCK_SERVER_CERT_PATH: string = path.join(__dirname, 'cert.pem')

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
export interface MockServerOptions {
  port?: number
  https?: boolean
  responses: {
    [endpoint: string]: {
      get?: MockResponse
      post?: MockResponse
      put?: MockResponse
      patch?: MockResponse
      delete?: MockResponse
    }
  }
  delay?: number
}

export type MockResponse = StaticMockResponse | StaticMockResponse[]

export interface StaticMockResponse {
  responseStatus: number
  responseHeaders?: any
  responseBody?: any
}

export interface QueryParams {
  [key: string]: undefined | string | string[] | QueryParams | QueryParams[]
}

export interface ReceivedRequest {
  body?: any
  headers: IncomingHttpHeaders
  cookies: any
  query: QueryParams
}

export class MockServer {
  private readonly requests: {
    [endpoint: string]: {
      get?: ReceivedRequest[]
      post?: ReceivedRequest[]
      put?: ReceivedRequest[]
      patch?: ReceivedRequest[]
      delete?: ReceivedRequest[]
    }
  } = {}
  private readonly app: Express
  private server?: Server

  constructor(private readonly options: MockServerOptions) {
    this.app = express()
    this.start()
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server == null) {
        resolve()
      } else {
        this.server.close(() => resolve())
      }
    })
  }

  getRequests(endpoint: string, method: HttpMethod): ReceivedRequest[] {
    return this.requests[endpoint]?.[method] ?? []
  }

  getNumberOfRequests(): number {
    let i = 0

    Object.values(this.requests).forEach((endpoint) => {
      Object.values(endpoint).forEach((method) => {
        i += method.length
      })
    })

    return i
  }

  private mockEndpoint(
    endpoint: string,
    method: HttpMethod,
    mockResponse: MockResponse,
  ): void {
    const mockRequestHandler = async (req: Request, res: Response) => {
      this.requests[endpoint] ??= {}
      this.requests[endpoint][method] ??= []
      this.requests[endpoint][method]!.push({
        body: req.body,
        headers: req.headers,
        cookies: req.cookies,
        query: req.query,
      })
      if (Array.isArray(mockResponse)) {
        const numOfReceivedRequests = this.requests[endpoint][method]!.length
        const currentRequest: StaticMockResponse =
          mockResponse[numOfReceivedRequests - 1]
        if (this.options.delay) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.options.delay),
          )
        }
        res.status(currentRequest.responseStatus)
        res.header(currentRequest.responseHeaders)
        res.send(currentRequest.responseBody)
      } else {
        if (this.options.delay) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.options.delay),
          )
        }
        res.status(mockResponse.responseStatus)
        res.header(mockResponse.responseHeaders)
        res.send(mockResponse.responseBody)
      }
    }
    this.app[method](endpoint, mockRequestHandler)
  }

  private start(): void {
    this.app.use(express.json())
    for (const [endpoint, mockResponses] of Object.entries(
      this.options.responses,
    )) {
      for (const [method, mockResponse] of Object.entries(mockResponses)) {
        this.mockEndpoint(endpoint, method as HttpMethod, mockResponse)
      }
    }

    if (this.options.https) {
      this.server = https
        .createServer(
          {
            key: fs.readFileSync(path.join(__dirname, 'key.pem')),
            cert: fs.readFileSync(MOCK_SERVER_CERT_PATH),
          },
          this.app,
        )
        .listen(this.options.port ?? 8080)
    } else {
      this.server = this.app.listen(this.options.port ?? 8080)
    }
  }
}
