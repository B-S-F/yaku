// @ts-ignore
import express, { Express, Request, Response } from 'express'
import { IncomingHttpHeaders, Server } from 'http'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
export class ServerHost {
  constructor(
    private protocol: string,
    private host: string,
    private port: string,
    private apiEndpoint: string
  ) {} // https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties

  public getHost(): string {
    return `${this.protocol}://${this.host}:${this.port}`
  }

  public getApiEndpoint(): string {
    return `${this.getHost()}${this.apiEndpoint}`
  }

  public getPort(): string {
    return this.port
  }
}

export interface MockServerOptions {
  port?: number
  responses: {
    [endpoint: string]: {
      get?: MockResponse
      post?: MockResponse
      put?: MockResponse
      patch?: MockResponse
      delete?: MockResponse
    }
  }
}

export type MockResponse = StaticMockResponse | StaticMockResponse[]

export interface StaticMockResponse {
  responseStatus: number
  responseBody?: any
  responseHeaders?: any
}

export interface ReceivedRequest {
  body?: any
  headers: IncomingHttpHeaders
  cookies: any
  multipartData: any
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
    mockResponse: MockResponse
  ): void {
    const mockRequestHandler = async (req: Request, res: Response) => {
      this.requests[endpoint] ??= {}
      this.requests[endpoint][method] ??= []
      this.requests[endpoint][method]!.push({
        body: req.body,
        headers: req.headers,
        cookies: req.cookies,
        multipartData: undefined,
      })

      // read the data chunks in case of multipart
      const contentType = req.headers['content-type']
      if (contentType && contentType.indexOf('multipart/') > -1) {
        const requestsList = this.requests[endpoint][method]
        const requestsLength = this.requests[endpoint][method]?.length
        // collect the multipart chnks here
        let multipartData = ''
        req.on('data', (chunk: Buffer) => {
          multipartData += chunk.toString()
        })
        req.on('end', () => {
          requestsList[requestsLength - 1].multipartData = multipartData
        })
      }

      if (Array.isArray(mockResponse)) {
        const numOfReceivedRequests = this.requests[endpoint][method]!.length
        const currentRequest: StaticMockResponse =
          mockResponse[numOfReceivedRequests - 1]

        res.header(currentRequest.responseHeaders)
        res.status(currentRequest.responseStatus)
        res.send(currentRequest.responseBody)
      } else {
        res.header(mockResponse.responseHeaders)
        res.status(mockResponse.responseStatus)
        res.send(mockResponse.responseBody)
      }
    }
    this.app[method](endpoint, mockRequestHandler)
  }

  private start(): void {
    this.app.use(express.json())
    for (const [endpoint, mockResponses] of Object.entries(
      this.options.responses
    )) {
      for (const [method, mockResponse] of Object.entries(mockResponses)) {
        this.mockEndpoint(endpoint, method as HttpMethod, mockResponse)
      }
    }

    this.server = this.app.listen(this.options.port ?? 8080)
  }
}
