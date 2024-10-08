import { HttpStatus } from '@nestjs/common'
import { readFile } from 'fs/promises'
import * as supertest from 'supertest'
import { Repository } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MAX_FILE_SIZE_MB } from '../src/config'
import {
  ConfigEntity,
  FileContentEntity,
  FileEntity,
} from '../src/namespace/configs/config.entity'
import { NamespaceTestEnvironment, NestTestingApp, NestUtil } from './util'

describe('Configs Controller', () => {
  let testNamespace: NamespaceTestEnvironment

  let nestTestingApp: NestTestingApp
  let nestUtil: NestUtil

  let apiToken

  let configRepo: Repository<ConfigEntity>
  let fileRepo: Repository<FileEntity>
  let contentRepo: Repository<FileContentEntity>

  let configId: number

  const configFile = `metadata:
  version: 'v1'
header:
  name: Test Project
  version: '1.0'
env:
  GLOBAL_VARIABLE: Some globally defined value
autopilots:
  templatePilot:
    run: |
      echo '{"status": "GREEN"}'
      echo '{"reason": "Evaluated successful because ..."}'
      echo '{"result": { "criterion": "Autopilot Check Criterion", "fulfilled": true, "justification": "Criterion fulfilled because ..."}}'
      echo '{"output": {"file output": "filename.txt"}}'
    config:
      - config-filename.yaml
    env:
      AUTOPILOT_VARIABLE: \${ env.GLOBAL_VARIABLE } used in the autopilot context
finalize:
  run: |
    echo 'Post process results here'
  env:
    FINALIZER_VARIABLE: \${ env.GLOBAL_VARIABLE } used in the finalizer context
chapters:
  '1':
    title: >-
      Project Management
    requirements:
      '1':
        title: >-
          Product development and resources formally approved, responsible person named
        text: >-
          Project Charter and - if required - Project Management Plan have been released
        checks:
          '1':
            title: >-
              Check docupedia page - Relevant page https://inside-docupedia.bosch.com/confluence/...
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
`

  const configQuestionnaire = Buffer.from(`
project: Test Project
version: '1.0'
chapters:
  '1':
    title: Project Management
    requirements:
      '1':
        title: Product development and resources formally approved, responsible person named
        text: Project Charter and - if required - Project Management Plan have been released
        checks:
          '1':
            title: Check docupedia page - Relevant page https://inside-docupedia.bosch.com/confluence/...
`)

  const excelConfig = `metadata:
  version: 'v1'
header:
  name: SampleProject.xlsx
  version: '0.1'
env:
  GLOBAL_VARIABLE: Some globally defined value
autopilots:
  templatePilot:
    run: |
      echo '{"status": "GREEN"}'
      echo '{"reason": "Evaluated successful because ..."}'
      echo '{"result": { "criterion": "Autopilot Check Criterion", "fulfilled": true, "justification": "Criterion fulfilled because ..."}}'
      echo '{"output": {"file output": "filename.txt"}}'
    config:
      - config-filename.yaml
    env:
      AUTOPILOT_VARIABLE: \${ env.GLOBAL_VARIABLE } used in the autopilot context
finalize:
  run: |
    echo 'Post process results here'
  env:
    FINALIZER_VARIABLE: \${ env.GLOBAL_VARIABLE } used in the finalizer context
chapters:
  '1':
    title: >-
      Requirement Management
    requirements:
      '1.1':
        title: >-
          Requirement 1.1
        text: >-
          Comment 1.1
        checks:
          '1':
            title: >-
              Generated Check
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
  '2':
    title: >-
      Project Management
    requirements:
      '2.1':
        title: >-
          Requirement 2.1
        text: >-
          Comment 2.1
        checks:
          '1':
            title: >-
              Generated Check
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
      '2.2':
        title: >-
          Requirement 2.2
        text: >-
          Comment 2.2
        checks:
          '1':
            title: >-
              Generated Check
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
  '3':
    title: >-
      Quality
    requirements:
      '3.1':
        title: >-
          Requirement 3.1
        text: >-
          Comment 3.1
        checks:
          '1':
            title: >-
              Generated Check
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
      '3.3':
        title: >-
          Requirement 3.3
        text: >-
          Comment 3.3
        checks:
          '1':
            title: >-
              Generated Check
            manual:
              status: UNANSWERED
              reason: Initial implementation of the check
`

  const additionalConfigName = 'additional configä.yaml'
  const additionalConfigNameEncoded = encodeURIComponent(additionalConfigName)
  const additionalConfig = `file: 'foo.pdf'
rules:
  - property: 'Modified'
    is-not-older-than: '1 month'
`

  beforeEach(async () => {
    nestUtil = new NestUtil()
    nestTestingApp = await nestUtil.startNestApplication()
    const databaseContent = await nestUtil.initDatabaseContent()
    testNamespace = databaseContent.testNamespace

    apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[0])

    configRepo = nestTestingApp.repositories.configRepository
    fileRepo = nestTestingApp.repositories.fileRepository
    contentRepo = nestTestingApp.repositories.fileContentRepository
  })

  afterEach(async () => {
    await nestTestingApp.app.close()
  })

  it('should ensure the whole lifecycle of a config', async () => {
    await checkDatabaseEntries(0, 0)

    console.log('===== Step 1: Create config')
    let config = {
      name: 'Test Config',
      description: 'Roundtrip test config',
    }
    await createConfig(config)
    await checkConfigInDatabase(config)
    await checkConfigByGet(config, false, [])
    await checkDatabaseEntries(1, 0)

    console.log('===== Step 2: Create initial config file from questionnaire')
    await createInitialConfigFile()
    await checkConfigInDatabase(config)
    await checkFilesInDatabase({ 'qg-config.yaml': configFile })
    await checkConfigByGet(config, true, [])
    await checkConfigFilesByGet({ 'qg-config.yaml': configFile })
    await checkDatabaseEntries(1, 1)

    console.log('===== Step 3: Add an additional file to the config')
    await tryAddTooBigFileToConfig()
    await tryAddInvalidEncodedFiles()
    await addFileToConfig()
    await checkConfigInDatabase(config)
    await checkFilesInDatabase({
      'qg-config.yaml': configFile,
      [additionalConfigName]: additionalConfig,
    })
    await checkConfigByGet(config, true, [additionalConfigNameEncoded])
    await checkConfigFilesByGet({
      'qg-config.yaml': configFile,
      [additionalConfigNameEncoded]: additionalConfig,
    })
    await checkDatabaseEntries(1, 2)

    console.log('===== Step 4: Patch the config by deleting the description')
    config = { name: config.name, description: null }
    await patchConfig(config)
    await checkConfigInDatabase(config)
    await checkFilesInDatabase({
      'qg-config.yaml': configFile,
      [additionalConfigName]: additionalConfig,
    })
    await checkConfigByGet(config, true, [additionalConfigNameEncoded])
    await checkConfigFilesByGet({
      'qg-config.yaml': configFile,
      [additionalConfigNameEncoded]: additionalConfig,
    })
    await checkDatabaseEntries(1, 2)

    console.log('===== Step 5: Patch the additional config file')
    const changedAdditionalConfig = additionalConfig + 'test: name\n'
    await patchFileInConfig(changedAdditionalConfig)
    await checkConfigInDatabase(config)
    await checkFilesInDatabase({
      'qg-config.yaml': configFile,
      [additionalConfigName]: changedAdditionalConfig,
    })
    await checkConfigByGet(config, true, [additionalConfigNameEncoded])
    await checkConfigFilesByGet({
      'qg-config.yaml': configFile,
      [additionalConfigNameEncoded]: changedAdditionalConfig,
    })
    await checkDatabaseEntries(1, 2)

    console.log('===== Step 6: Create a copy of the config')
    const copyName = 'Test Config Copy'
    const copyConfigId = await copyConfig(configId, {
      name: copyName,
      description: 'Copy of the roundtrip test config',
    })
    await checkDatabaseEntries(2, 4)

    await console.log('===== Step 7: Retrieve configs by list')
    await checkConfigsAsList([config.name, copyName], 2)

    console.log('===== Step 8: Delete file from config')
    await deleteFile()
    await checkDatabaseEntries(2, 3)
    await await deleteFile(copyConfigId)
    await checkDatabaseEntries(2, 2)

    console.log('===== Step 9: Delete config')
    await deleteConfig()
    await checkDatabaseEntries(1, 1)
    await deleteConfig(copyConfigId)
    await checkDatabaseEntries(0, 0)
  })

  it('should create a config from an excel sheet', async () => {
    const config = {
      name: 'Test Config',
      description: 'Roundtrip test config',
    }
    await createConfig(config)

    await createInitialConfigFileFromExcel()
    await checkConfigInDatabase(config)
    await checkFilesInDatabase({ 'qg-config.yaml': excelConfig })
    await checkConfigByGet(config, true, [])
    await checkConfigFilesByGet({ 'qg-config.yaml': excelConfig })
  })

  async function checkDatabaseEntries(
    configs: number,
    files: number
  ): Promise<void> {
    console.log('========== Check database entries')
    expect(
      (await configRepo.find()).length,
      `Config repo does not contain ${configs} elements`
    ).toBe(configs)
    expect(
      (await fileRepo.find()).length,
      `File repo does not contain ${files} elements`
    ).toBe(files)
    expect(
      (await contentRepo.find()).length,
      `Config repo does not contain ${files} elements`
    ).toBe(files)
  }

  async function checkConfigInDatabase(configBody: any): Promise<void> {
    console.log('========== Check config in database')
    const dbconf = await configRepo.findOneOrFail({
      where: { name: configBody.name },
    })
    expect(dbconf.id, `Config in database does not have an id`).toBeDefined()
    expect(
      dbconf.name,
      `Config in database has name "${dbconf.name}" instead of "${configBody.name}"`
    ).toBe(configBody.name)
    expect(
      dbconf.description,
      `Config in database has description "${dbconf.description}" instead of "${configBody.description}"`
    ).toBe(configBody.description)
    expect(
      dbconf.creationTime,
      `Config in database does not have a creation time`
    ).toBeDefined()
    expect(
      dbconf.lastModificationTime,
      `Config in database does not have a last modification time`
    ).toBeDefined()
  }

  async function checkFilesInDatabase(files: {
    [name: string]: string
  }): Promise<void> {
    console.log('========== Check files in database')
    const fileEntities = await fileRepo.find()
    const filenames = fileEntities.map((entity) => entity.filename)
    expect(
      fileEntities.length,
      `Number of files stored in database is ${
        fileEntities.length
      }, but should be ${Object.keys(files).length}`
    ).toBe(Object.keys(files).length)
    for (const name of Object.keys(files)) {
      expect(
        filenames,
        `There is no file in the database with the name "${name}", filenames are: "${filenames}"`
      ).toContain(name)
    }

    const contentEntities = await contentRepo.find({
      relations: {
        file: true,
      },
    })
    expect(
      contentEntities.length,
      `Number of file contents stored in database is ${
        contentEntities.length
      }, but should be ${Object.keys(files).length}`
    ).toBe(Object.keys(files).length)
    for (const entity of contentEntities) {
      expect(
        entity.content,
        `Content of file "${entity.file.filename}" is not as expected`
      ).toEqual(files[entity.file.filename])
    }
  }

  async function checkConfigByGet(
    configBody: any,
    qgConfig: boolean,
    additionalFiles: string[]
  ): Promise<void> {
    console.log('========== Check config by GET')
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}`
      )
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    expect(
      response.body.id,
      `The id of the returned config is not defined`
    ).toBeDefined()
    expect(
      response.body.name,
      `The name of the retrieved config is "${response.body.name}", it should be "${configBody.name}"`
    ).toBe(configBody.name)
    expect(
      response.body.description,
      `The description of the retrieved config is not as expected`
    ).toBe(configBody.description ?? undefined)
    expect(
      response.body.creationTime,
      `The creation time of the returned config is not defined`
    ).toBeDefined()
    expect(
      response.body.lastModificationTime,
      `The last modification time of the returned config is not defined`
    ).toBeDefined()
    if (qgConfig) {
      expect(
        response.body.files.qgConfig,
        `The information of the qgConfig property in the returned config is "${response.body.files.qgConfig}"`
      ).toContain('qg-config.yaml')
    }
    for (const file of additionalFiles) {
      expect(
        response.body.files.additionalConfigs.filter((url: string) =>
          url.includes(file)
        ).length,
        `The additional files section does not contain a reference to file "${file}"`
      ).toBe(1)
    }
  }

  async function checkConfigFilesByGet(files: {
    [name: string]: string
  }): Promise<void> {
    console.log('========== Check files by GET')
    for (const file of Object.keys(files)) {
      const response = await supertest
        .agent(nestTestingApp.app.getHttpServer())
        .get(
          `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files/${file}`
        )
        .set('Authorization', `Bearer ${apiToken}`)
        .expect(HttpStatus.OK)

      expect(
        response.body.toString('utf-8'),
        `The content for file "${file}" is not as expected`
      ).toEqual(files[file])
    }
  }

  async function checkConfigsAsList(
    names: string[],
    amount?: number
  ): Promise<void> {
    amount = amount || 1
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .get(`/api/v1/namespaces/${testNamespace.namespace.id}/configs`)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    expect(
      response.body.pagination.pageNumber,
      `Page number should be 1, is ${response.body.pagination.pageNumber}`
    ).toBe(1)
    expect(
      response.body.pagination.pageSize,
      `Page size should be ${amount}, is ${response.body.pagination.pageSize}`
    ).toBe(amount)
    expect(
      response.body.pagination.totalCount,
      `Total count should be ${amount}, is ${response.body.pagination.totalCount}`
    ).toBe(amount)
    expect(
      response.body.links,
      'Links section of response body should be defined'
    ).toBeDefined()
    expect(
      response.body.data.length,
      `Expected ${amount} data element in response body, got ${response.body.data.length}`
    ).toBe(amount)
    for (const name of names) {
      expect(
        response.body.data.filter((config) => config.name === name).length,
        `Expected a config with name "${name}" in response body, got ${response.body.data
          .map((config) => config.name)
          .join(', ')}`
      ).toBe(1)
    }
  }

  async function createConfig(configBody: any): Promise<void> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(`/api/v1/namespaces/${testNamespace.namespace.id}/configs`)
      .send(configBody)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.CREATED)

    expect(
      response.body.id,
      `The returned config in response body does not have an id`
    ).toBeDefined()
    expect(
      response.body.name,
      `The returned config in response body does not have the right name ${response.body.name} instead of ${configBody.name}`
    ).toBe(configBody.name)
    expect(
      response.body.description,
      `The returned config in response body does not have the right description`
    ).toBe(configBody.description)
    expect(
      response.body.creationTime,
      `The returned config in response body does not have an creation time`
    ).toBeDefined()
    expect(
      response.body.lastModificationTime,
      `The returned config in response body does not have an last modification time`
    ).toBeDefined()

    configId = response.body.id
  }

  async function copyConfig(
    configId: number,
    body: { name: string; description: string }
  ): Promise<number> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/copy`
      )
      .send(body)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.CREATED)
    expect(
      response.body.id,
      `The returned config in response body does not have an id`
    ).toBeDefined()
    expect(
      response.body.name,
      `The returned config in response body does not have the right name ${response.body.name} instead of ${body.name}`
    ).toBe(body.name)
    expect(
      response.body.description,
      `The returned config in response body does not have the right description`
    ).toBe(body.description)
    expect(
      response.body.creationTime,
      `The returned config in response body does not have an creation time`
    ).toBeDefined()
    expect(
      response.body.lastModificationTime,
      `The returned config in response body does not have an last modification time`
    ).toBeDefined()

    return response.body.id
  }

  async function patchConfig(configBody: any): Promise<void> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .patch(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}`
      )
      .send(configBody)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    expect(
      response.body.id,
      `The returned config in response body does not have an id`
    ).toBeDefined()
    expect(
      response.body.name,
      `The returned config in response body does not have the right name ${response.body.name} instead of ${configBody.name}`
    ).toBe(configBody.name)
    expect(
      response.body.description,
      `The returned config in response body does not have the right description`
    ).toBe(configBody.description ?? undefined)
    expect(
      response.body.creationTime,
      `The returned config in response body does not have an creation time`
    ).toBeDefined()
    expect(
      response.body.lastModificationTime,
      `The returned config in response body does not have an last modification time`
    ).toBeDefined()
  }

  async function createInitialConfigFile(): Promise<void> {
    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .patch(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/initial-config`
      )
      .attach('content', configQuestionnaire, {
        filename: 'config-questionnaire.yaml',
        contentType: 'application/yaml',
      })
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    const configData = response.body.toString('utf-8')
    expect(
      configData,
      `Created initial config file is not as expected`
    ).toEqual(configFile)
  }

  async function createInitialConfigFileFromExcel(): Promise<void> {
    const excelFile = 'SampleProject.xlsx'
    const excelBuffer = await readFile(
      `${__dirname}/../src/namespace/configs/testdata/${excelFile}`
    )
    const configFile = 'SampleProject.xlsx_filtered.config'
    const configBuffer = await readFile(
      `${__dirname}/../src/namespace/configs/testdata/${configFile}`
    )

    const response = await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .patch(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/config-from-excel`
      )
      .attach('xlsx', excelBuffer, {
        filename: excelFile,
        contentType: 'application/octet-stream',
      }) // provide valid required field
      .attach('config', configBuffer, {
        filename: configFile,
        contentType: 'application/yaml',
      })
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)

    const configData = response.body.toString('utf-8')
    expect(
      configData,
      `Created initial config file out of excel is not as expected`
    ).toEqual(excelConfig)
  }

  async function addFileToConfig(): Promise<void> {
    await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files`
      )
      .field('filename', additionalConfigName)
      .attach('content', Buffer.from(additionalConfig), {
        filename: additionalConfigName,
        contentType: 'application/yaml',
      })
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.CREATED)
  }

  async function tryAddTooBigFileToConfig(): Promise<void> {
    await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files`
      )
      .field('filename', 'to-big-file.jpg')
      .attach(
        'content',
        Buffer.alloc(parseInt(MAX_FILE_SIZE_MB) * 1024 * 1024 + 1),
        {
          filename: 'to-big-file.jpg',
          contentType: 'multipart/form-data',
        }
      )
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.PAYLOAD_TOO_LARGE)
  }

  async function tryAddInvalidEncodedFiles(): Promise<void> {
    const unicodeTestString =
      '你好, мир, hello, こんにちは, 안녕하세요, 😀, 🌍, 🧑‍💻, 🚀, 𝒜𝓁𝓅𝒽𝒶, 𝔉𝔯𝔞𝔨𝔱𝔲𝔯'
    const jsonTestString = JSON.stringify({ test: 'value' })
    const yamlTestString = 'test: value'
    const files = [
      {
        filename: 'utf16le.txt',
        content: Buffer.from(unicodeTestString, 'utf16le'),
      },
      {
        filename: 'ucs2.txt',
        content: Buffer.from(unicodeTestString, 'ucs2'),
      },
      {
        filename: 'utf16le.json',
        content: Buffer.from(jsonTestString, 'utf16le'),
      },
      {
        filename: 'qg-config.yaml',
        content: Buffer.from(yamlTestString, 'utf16le'),
      },
    ]
    for (const file of files) {
      await supertest
        .agent(nestTestingApp.app.getHttpServer())
        .post(
          `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files`
        )
        .field('filename', file.filename)
        .attach('content', file.content, {
          filename: file.filename,
          contentType: 'multipart/form-data',
        })
        .set('Authorization', `Bearer ${apiToken}`)
        .expect(HttpStatus.BAD_REQUEST)
    }
  }

  async function patchFileInConfig(content: string): Promise<void> {
    await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .patch(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files/${additionalConfigNameEncoded}`
      )
      .attach('content', Buffer.from(content), {
        filename: additionalConfigName,
        contentType: 'application/yaml',
      })
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)
  }

  async function deleteFile(otherConfigId?: number): Promise<void> {
    await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .delete(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${
          otherConfigId || configId
        }/files/${additionalConfigNameEncoded}`
      )
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)
  }

  async function deleteConfig(otherConfigId?: number): Promise<void> {
    await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .delete(
        `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${
          otherConfigId || configId
        }`
      )
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(HttpStatus.OK)
  }
})
