// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { jest } from '@jest/globals'
import {
  exportSecrets,
  createSecret,
  updateSecret,
  deleteSecret,
} from './secrets'
import yp from '../yaku-prompts.js'
import {
  ApiClient,
  SecretMetadata,
  SecretPaginated,
} from '@B-S-F/yaku-client-lib'
import { Command } from 'commander'

const testApiClient = new ApiClient({
  baseUrl: 'http://base.url',
  token: 'token',
})
const testNamespaceId = 1
const testSecretName = 'secret1'

describe('exportSecrets()', () => {
  let listSecretsSpy: any
  let listAllSecretsSpy: any
  beforeEach(() => {
    listSecretsSpy = jest
      .spyOn(ApiClient.prototype, 'listSecrets')
      .mockResolvedValue({} as SecretPaginated)
    listAllSecretsSpy = jest
      .spyOn(ApiClient.prototype, 'listAllSecrets')
      .mockResolvedValue([])
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.listSecrets() without options', async () => {
    await exportSecrets(testApiClient, testNamespaceId, '1', {})

    expect(listSecretsSpy).toHaveBeenCalledWith(1, {
      ascending: false,
      itemCount: 20,
      page: 1,
    })
  })
  it('should call ApiClient.listSecrets() with options', async () => {
    await exportSecrets(testApiClient, testNamespaceId, '2', {
      itemCount: '10',
      sortBy: 'sortBy',
      ascending: true,
    })

    expect(listSecretsSpy).toHaveBeenCalledWith(1, {
      ascending: true,
      itemCount: 10,
      page: 2,
      sortBy: 'sortBy',
    })
  })
  it('should call ApiClient.listAllSecrets()', async () => {
    await exportSecrets(testApiClient, testNamespaceId, '', {
      all: true,
    })

    expect(listAllSecretsSpy).toHaveBeenCalled()
  })
})

describe('createSecret()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.createSecret()', async () => {
    const createSecretSpy = jest
      .spyOn(ApiClient.prototype, 'createSecret')
      .mockResolvedValue({} as SecretMetadata)

    await createSecret(
      testApiClient,
      testNamespaceId,
      testSecretName,
      'description',
      'secret',
    )

    expect(createSecretSpy).toHaveBeenCalled()
  })
})

describe('updateSecret()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call ApiClient.updateSecret()', async () => {
    const updateSecretSpy = jest
      .spyOn(ApiClient.prototype, 'updateSecret')
      .mockResolvedValue({} as SecretMetadata)

    await updateSecret(
      testApiClient,
      testNamespaceId,
      testSecretName,
      'description',
      'secret',
    )

    expect(updateSecretSpy).toHaveBeenCalled()
  })
})

describe('deleteSecret()', () => {
  let deleteSecretSpy: any
  beforeEach(() => {
    deleteSecretSpy = jest
      .spyOn(ApiClient.prototype, 'deleteSecret')
      .mockResolvedValue()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should call only ApiClient.deleteSecret() when using --yes option', async () => {
    await deleteSecret(testApiClient, testNamespaceId, testSecretName, {
      yes: true,
    })

    expect(deleteSecretSpy).toHaveBeenCalled()
  })
  it('should validate the secret and call ApiClient.listSecrets() with confirmation', async () => {
    const listAllSecretsSpy = jest
      .spyOn(ApiClient.prototype, 'listAllSecrets')
      .mockResolvedValue([{ name: testSecretName }] as SecretMetadata[])
    jest.spyOn(yp, 'confirm').mockResolvedValue(true)

    await deleteSecret(testApiClient, testNamespaceId, testSecretName, {})

    expect(deleteSecretSpy).toHaveBeenCalled()
    expect(listAllSecretsSpy).toHaveBeenCalled()
  })
  it('should validate the secret, but not call ApiClient.listSecrets() without confirmation', async () => {
    const listAllSecretsSpy = jest
      .spyOn(ApiClient.prototype, 'listAllSecrets')
      .mockResolvedValue([{ name: testSecretName }] as SecretMetadata[])
    jest.spyOn(yp, 'confirm').mockResolvedValue(false)

    await deleteSecret(testApiClient, testNamespaceId, testSecretName, {})

    expect(deleteSecretSpy).not.toHaveBeenCalled()
    expect(listAllSecretsSpy).toHaveBeenCalled()
  })
  it('should fail to validate the secret', async () => {
    const listAllSecretsSpy = jest
      .spyOn(ApiClient.prototype, 'listAllSecrets')
      .mockResolvedValue([])

    await expect(
      deleteSecret(testApiClient, testNamespaceId, testSecretName, {}),
    ).rejects.toThrow(Error(`Secret ${testSecretName} does not exist`))

    expect(deleteSecretSpy).not.toHaveBeenCalled()
    expect(listAllSecretsSpy).toHaveBeenCalled()
  })
})
