import FormData from 'form-data'
import { fetch } from 'undici'

export interface RestClient {
  post(path: string, body: any, additionalHeaders?: any): Promise<any>
  postFormData(
    path: string,
    body: FormData,
    additionalHeaders?: any,
  ): Promise<any>
  get(path: string): Promise<any>
  put(path: string, body: any): Promise<any>
  delete(path: string): Promise<any>
}

export class RestClientImpl implements RestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly basicAuth: string,
  ) {}

  async post(path: string, body: any, additionalHeaders?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.basicAuth}`,
        ...additionalHeaders,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const res = await response.json()
      throw new Error(
        `Failed to create ${
          this.baseUrl
        }/${path} with response ${JSON.stringify(res, null, 2)}`,
      )
    }
    return response.json()
  }

  async postFormData(
    path: string,
    body: FormData,
    additionalHeaders?: any,
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.basicAuth}`,
        ...additionalHeaders,
      },
      body: body,
    })
    if (!response.ok) {
      const res = await response.json()
      throw new Error(
        `Failed to create ${
          this.baseUrl
        }/${path} with response ${JSON.stringify(res, null, 2)}`,
      )
    }
    return response.json()
  }

  async get(path: string): Promise<any> {
    const requestUrl = `${this.baseUrl}/${path}`
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.basicAuth}`,
      },
    })
    if (!response.ok) {
      const res = await response.json()
      throw new Error(
        `Failed to get ${requestUrl} with response ${JSON.stringify(
          res,
          null,
          2,
        )}`,
      )
    }
    return response.json()
  }

  async put(path: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.basicAuth}`,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const res = await response.json()
      throw new Error(
        `Failed to update ${
          this.baseUrl
        }/${path} with response ${JSON.stringify(res)}`,
      )
    }
    return response.json()
  }

  async delete(path: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.basicAuth}`,
      },
    })
    if (!response.ok) {
      const res = await response.json()
      throw new Error(
        `Failed to delete ${path} with response ${JSON.stringify(res, null, 2)}`,
      )
    }
    return response.json()
  }
}
