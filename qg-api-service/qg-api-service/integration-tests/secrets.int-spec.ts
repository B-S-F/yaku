import { HttpStatus } from '@nestjs/common'
import * as supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NamespaceTestEnvironment, NestTestingApp, NestUtil } from './util'
import { Repository } from 'typeorm'
import { Secret } from '../src/namespace/secret/secret.entity'
import { EncryptedSecret } from '../src/namespace/secret/simple-secret-storage.entity'

describe('Check secrets endpoints', () => {
  let testNamespace: NamespaceTestEnvironment

  let nestTestingApp: NestTestingApp
  let nestUtil: NestUtil

  let apiToken

  let cryptedSecret: string

  let secretRepo: Repository<Secret>
  let cryptoRepo: Repository<EncryptedSecret>

  beforeEach(async () => {
    nestUtil = new NestUtil()
    nestTestingApp = await nestUtil.startNestApplication()
    const databaseContent = await nestUtil.initDatabaseContent()
    testNamespace = databaseContent.testNamespace

    apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[0])

    secretRepo = nestTestingApp.repositories.secretRepository
    cryptoRepo = nestTestingApp.repositories.secretStoreRepository
  })

  afterEach(async () => {
    await nestTestingApp.app.close()
  })

  it('should go through a secrets cycle in creating, patching and retrieving the secret', async () => {
    await checkDatabaseEntries(0)

    console.log('===== Step 1: Create secret')

    const body = {
      name: 'TEST_SECRET',
      secret: 'Secret Value',
    }
    await createSecret(body)
    await checkSecretInDatabase((value: string) => {
      cryptedSecret = value
      return true
    }, body.name)
    await checkSecretByGet(body.name)
    await checkDatabaseEntries(1)

    console.log('===== Step 2: Patch secret description')

    const patchDescBody = {
      description: 'Test Description',
    }
    await patchSecret(body.name, patchDescBody)
    await checkSecretInDatabase(
      (value: string) => cryptedSecret === value,
      body.name,
      patchDescBody.description
    )
    await checkSecretByGet(body.name, patchDescBody.description)
    await checkDatabaseEntries(1)

    console.log(
      '===== Step 3: Patch the secret value and unset description again'
    )

    const patchSecretBody = {
      description: null,
      secret: 'Another secret secret',
    }
    await patchSecret(body.name, patchSecretBody)
    await checkSecretInDatabase(
      (value: string) => cryptedSecret !== value,
      body.name
    )
    await checkSecretByGet(body.name)
    await checkDatabaseEntries(1)

    console.log('===== Step 4: Delete secret')

    await deleteSecret(body.name)
    await checkDatabaseEntries(0)
  })

  async function checkDatabaseEntries(count: number): Promise<void> {
    console.log('========== Check database entries')

    expect(
      (await secretRepo.find()).length,
      `Secret repo does not contain the expected ${count} elements`
    ).toBe(count)
    expect(
      (await cryptoRepo.find()).length,
      `Encrypted secret repo does not contain the expected ${count} elements`
    ).toBe(count)
  }

  async function checkSecretInDatabase(
    checkSecretValue: (value: string) => boolean,
    name: string,
    description?: string
  ): Promise<void> {
    console.log('========== Check secret in database')

    const secret = await secretRepo.findOneOrFail({ where: { name: name } })
    expect(
      secret.name,
      `Secret name in database should be "${name}", but is "${secret.name}"`
    ).toBe(name)
    expect(
      secret.description,
      `Secret description in database should be "${description}", but is "${secret.description}"`
    ).toBe(description ?? null)
    expect(
      secret.creationTime,
      `Secret creation time in database is not defined`
    ).toBeDefined()
    expect(
      secret.lastModificationTime,
      `Secret last modification time in database is not defined`
    ).toBeDefined()
    const crypted = await cryptoRepo.findOneOrFail({ where: { name: name } })
    expect(
      checkSecretValue(crypted.value),
      `Encrypted secret has not the expected value`
    ).toBeTruthy()
  }

  async function checkSecretByGet(
    name: string,
    description?: string
  ): Promise<void> {
    console.log('========== Check secret by GET')

    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(`/api/v1/namespaces/${testNamespace.namespace.id}/secrets`)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    expect(
      response.body.pagination.totalCount,
      `Expected 1 element in database, got ${response.body.pagination.totalCount}`
    ).toBe(1)
    expect(
      response.body.data[0].name,
      `Secret name from GET should be "${name}", but is "${response.body.data[0].name}"`
    ).toBe(name)
    expect(
      response.body.data[0].description,
      `Secret description from GET should be "${description}", but is "${response.body.data[0].description}"`
    ).toBe(description ?? undefined)
    expect(
      response.body.data[0].creationTime,
      `Secret creation time from GET is not defined`
    ).toBeDefined()
    expect(
      response.body.data[0].lastModificationTime,
      `Secret last modification time from GET is not defined`
    ).toBeDefined()
  }

  async function createSecret(secretData: any): Promise<void> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(`/api/v1/namespaces/${testNamespace.namespace.id}/secrets`)
      .send(secretData)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.CREATED)

    expect(
      response.body.name,
      `Secret name from POST should be "${secretData.name}", but is "${response.body.name}"`
    ).toBe(secretData.name)
    expect(
      response.body.description,
      `Secret description from POST should be "${secretData.description}", but is "${response.body.description}"`
    ).toBe(secretData.description ?? undefined)
    expect(
      response.body.creationTime,
      `Secret creation time from POST is not defined`
    ).toBeDefined()
    expect(
      response.body.lastModificationTime,
      `Secret last modification time from POST is not defined`
    ).toBeDefined()
  }

  async function patchSecret(name: string, secretData: any): Promise<void> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .patch(`/api/v1/namespaces/${testNamespace.namespace.id}/secrets/${name}`)
      .send(secretData)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK)

    expect(
      response.body.name,
      `Secret name from PATCH should be "${secretData.name}", but is "${response.body.name}"`
    ).toBe(name)
    expect(
      response.body.description,
      `Secret description from PATCH should be "${secretData.description}", but is "${response.body.description}"`
    ).toBe(secretData.description ?? undefined)
    expect(
      response.body.creationTime,
      `Secret creation time from PATCH is not defined`
    ).toBeDefined()
    expect(
      response.body.lastModificationTime,
      `Secret last modification time from PATCH is not defined`
    ).toBeDefined()
  }

  async function deleteSecret(name: string): Promise<void> {
    await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .delete(
        `/api/v1/namespaces/${testNamespace.namespace.id}/secrets/${name}`
      )
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)
  }
})
