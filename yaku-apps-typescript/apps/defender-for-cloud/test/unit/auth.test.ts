import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    generateAzureAccessToken,
  } from '../../src/auth'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    create: vi.fn(),
  },
}))

const mockedAxiosPost = vi.mocked(axios.post)

describe('Test "generateAzureAccessToken()" from "auth.ts"', async () => {
    afterEach(() => {
      vi.clearAllMocks()
    })
    it('Should return an access token if response status is 200', async () => {
      mockedAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: {
          access_token: 'mockAccesstoken',
        },
      })
  
      const result = await generateAzureAccessToken(
        'mockTenantId',
        'mockClientId',
        'mockGrantType',
        'mockClientSecret'
      )
      expect(result).toEqual('mockAccesstoken')
    })
  
    it('Should throw a specific error if status is not 200', async () => {
      mockedAxiosPost.mockRejectedValueOnce({ 
        response: { 
            status: 400, 
        } })
  
      await expect(
        generateAzureAccessToken(
          'mockTenantId',
          'mockClientId',
          'mockGrantType',
          'mockClientSecret'
        )
      ).rejects.toThrowError(
        'Request for Azure access token does not have status code 200. Status code: 400'
      )
    })
  
    it('Should throw a specific error if field "access_token" does not exist on the response returned by Azure authenticator', async () => {
      mockedAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: {
          random_field: 'mockAccesstoken',
        },
      })
  
      await expect(
        generateAzureAccessToken(
          'mockTenantId',
          'mockClientId',
          'mockGrantType',
          'mockClientSecret'
        )
      ).rejects.toThrowError(
        'Field "access_token" does not exist on response returned by Azure authenticator'
      )
    })
  })