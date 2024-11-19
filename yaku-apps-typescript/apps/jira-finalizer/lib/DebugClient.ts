// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { RestClient } from './RestClient.js'

export class DebugClient implements RestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly basicAuth: string
  ) {}

  async post(path: string, body: any, additionalHeaders?: any): Promise<any> {
    console.log(`POST ${this.baseUrl}/${path}`)
    console.log(`Headers ${JSON.stringify(additionalHeaders)}`)
    console.log(body)
    return { id: '1' }
  }

  async postFormData(
    path: string,
    body: FormData,
    additionalHeaders?: any
  ): Promise<any> {
    console.log(`POST ${this.baseUrl}/${path}`)
    console.log(`Headers ${JSON.stringify(additionalHeaders)}`)
    console.log(body)
    return [{ id: 1 }]
  }

  async get(path: string): Promise<any> {
    console.log(`GET ${this.baseUrl}/${path}`)
    return { status: 200 }
  }

  async put(path: string, body: any): Promise<any> {
    console.log(`PUT ${this.baseUrl}/${path}`)
    console.log(JSON.stringify(body, null, 2))
    return
  }

  async delete(path: string): Promise<any> {
    console.log(`DELETE ${this.baseUrl}/${path}`)
    return
  }
}
