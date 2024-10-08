import { randomUUID, randomBytes } from 'crypto'
import {
  callViaPost,
  createResource,
  deleteResource,
  getResource,
  getResourceBinaryData,
  listAllResources,
  transformData,
  updateResource,
  uploadData,
} from './api-calls.js'
import { RestApiRequestError } from './call-wrapper.js'
import { NewTokenMetadata, YakuClientConfig } from './types.js'
import ClientConfig from './client-config'

const yakuClientConfig: YakuClientConfig = {
  baseUrl: 'baseUrl',
  token: 'token',
}

describe('Standard rest api calls', () => {
  const testurl = 'https://great-backend.com:666/endpoint'
  const body = {
    data: 'Resource content',
    metadata: {
      status: 4711,
      uuid: randomUUID(),
    },
  }

  const formContent = randomBytes(100).toString('base64')
  const formData = new TextEncoder().encode(formContent)
  const formBody = (): FormData => {
    const formBodyData = new FormData()
    formBodyData.append('data', formContent)
    return formBodyData
  }

  const token = randomUUID()
  const errorMessage = 'Error Message'

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  describe('Get a resource from backend', () => {
    it('should use a GET call for resource retrieval', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
        json: () => {
          return body
        },
      }

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      const result = await getResource(testurl, token)

      expect(result).toEqual(body)
      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })
  })

  describe('Create resources on backend', () => {
    it('should use POST for resource creation', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
        headers: {
          Location: `${testurl}/${body.metadata.uuid}`,
          get: () => undefined,
        },
        json: () => {
          return body
        },
      }

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      const result = await createResource(testurl, body, token)

      expect(result).toEqual(body)
      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    })
  })

  describe('Update a resource', () => {
    it('should use PATCH for resource update', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
        json: () => {
          return body
        },
      }

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      const result = await updateResource(testurl, body, token)

      expect(result).toEqual(body)
      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    })
  })

  describe('Delete a resource', () => {
    it('should use DELETE for resource deletion', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
      }

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      await deleteResource(testurl, token)

      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })
  })

  describe('Get stream data from backend', () => {
    it('should use GET for retrieving stream data', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
        headers: {
          Authorization: `Bearer ${token}`,
          get: () => 'attachment; filename="filename.zip"',
        },
        arrayBuffer: () => formData,
      }

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      const result = await getResourceBinaryData(testurl, token)

      expect(result.filename).toBe('filename.zip')
      expect(result.data).toEqual(Buffer.from(formContent))
      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })
  })

  describe('Upload stream data to backend', () => {
    it('should use POST for uploading stream data', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
      }

      const formBodyData = formBody()

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      await uploadData(testurl, formBodyData, token)

      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'POST',
        body: formBodyData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })

    it('should use PATCH for replacing data', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
      }

      const formBodyData = formBody()

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      await uploadData(testurl, formBodyData, token, true)

      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'PATCH',
        body: formBodyData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })
  })

  describe('Transforming data on backend', () => {
    it('should use PATCH for creating the transformed data', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
        headers: {
          Authorization: `Bearer ${token}`,
          get: () => 'attachment; filename="filename.zip"',
        },
        arrayBuffer: () => formData,
      }

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      const result = await transformData(testurl, body, token)

      expect(result.filename).toBe('filename.zip')
      expect(result.data).toEqual(Buffer.from(formContent))
      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'PATCH',
        body,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })
  })

  describe('Invoke functions', () => {
    it('should use POST for invoking a function', async () => {
      const response: any = {
        ok: true,
        status: 200,
        url: testurl,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response)) as jest.Mock
        )

      await callViaPost(testurl, token)

      expect(fetchSpy).toBeCalledWith(testurl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    })
  })

  describe('List all resources', () => {
    it('should fetch second page', async () => {
      const page1 = {
        pagination: {
          pageNumber: 1,
          pageSize: 1,
          totalCount: 2,
        },
        data: [
          {
            id: 43,
            description: 'Token for thed Jenkins automation',
            try_admin: false,
            createdBy: 'user@example.com',
            creationTime: '2024-06-10T11:09:13.284Z',
            lastModifiedBy: 'user@example.com',
            lastModificationTime: '2024-06-10T11:09:13.284Z',
            status: 'active',
          },
        ],
        links: {
          first:
            'http://localhost:3000/api/v1/long-running-tokens?page=1&items=1',
          last: 'http://localhost:3000/api/v1/long-running-tokens?page=2&items=1',
          next: 'http://localhost:3000/api/v1/long-running-tokens?page=2&items=1',
        },
      }

      const page2 = {
        pagination: {
          pageNumber: 2,
          pageSize: 1,
          totalCount: 2,
        },
        data: [
          {
            id: 44,
            description: 'Token for thed Jenkins automation',
            try_admin: false,
            createdBy: 'user@example.com',
            creationTime: '2024-06-10T11:09:14.284Z',
            lastModifiedBy: 'user@example.com',
            lastModificationTime: '2024-06-10T11:09:14.284Z',
            status: 'active',
          },
        ],
        links: {
          first:
            'http://localhost:3000/api/v1/long-running-tokens?page=1&items=1',
          last: 'http://localhost:3000/api/v1/long-running-tokens?page=2&items=1',
        },
      }

      const response1: Response = new Response(JSON.stringify(page1))
      const response2: Response = new Response(JSON.stringify(page2))

      jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2)

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(
          jest.fn(() => Promise.resolve(response1)) as jest.Mock
        )
        .mockResolvedValueOnce(response2)

      const results = await listAllResources<NewTokenMetadata>(testurl, token)

      expect(results.length).toBe(2)
      expect(fetchSpy).toBeCalledTimes(2)
    })
  })

  describe.each([
    [
      async () => getResource(testurl, token),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ],
    [
      async () => createResource(testurl, body, token),
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    ],
    [
      async () => updateResource(testurl, body, token),
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    ],
    [
      async () => deleteResource(testurl, token),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ],
    [
      async () => getResourceBinaryData(testurl, token),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ],
    [
      async () => uploadData(testurl, formBody(), token, false),
      {
        method: 'POST',
        body: formBody(),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ],
    [
      async () => transformData(testurl, body, token),
      {
        method: 'PATCH',
        body,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ],
  ])(
    'Ensure behavior of all api call types',
    (testFct: any, callParam: any) => {
      it('should return any rest error returned by the call', async () => {
        const response: any = {
          ok: false,
          headers: {
            get: () => 'value1',
          } as unknown as Headers,
          json: () => {
            return {
              message: errorMessage,
              statusCode: 400,
            }
          },
        }

        jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

        const fetchSpy = jest
          .spyOn(global, 'fetch')
          .mockImplementation(
            jest.fn(() => Promise.resolve(response)) as jest.Mock
          )

        try {
          await testFct()
          fail()
        } catch (err) {
          if (err instanceof RestApiRequestError) {
            expect(err.status).toBe(400)
            expect(err.message).toBe(errorMessage)
            expect(err.headers.get('any')).toBe('value1')
          } else {
            throw err
          }
        }

        expect(fetchSpy).toBeCalledWith(testurl, callParam)
      })

      it('should not treat fetch errors differently from normal errors', async () => {
        jest.spyOn(ClientConfig, 'getConfig').mockReturnValue(yakuClientConfig)

        const fetchSpy = jest
          .spyOn(global, 'fetch')
          .mockImplementation(
            jest.fn(() => Promise.reject(new Error(errorMessage))) as jest.Mock
          )

        try {
          await testFct()
          fail()
        } catch (err) {
          if (err instanceof Error) {
            expect(err.message).toBe(
              `Cannot access ${testurl}\n${errorMessage}`
            )
          } else {
            throw err
          }
        }

        expect(fetchSpy).toBeCalledWith(testurl, callParam)
      })
    }
  )
})
