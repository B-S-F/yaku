import { randomUUID } from 'crypto'
import { readFile, unlink, writeFile } from 'fs/promises'
import * as api from './api-calls.js'
import { FileData } from './api-calls.js'
import { RestApiRequestError } from './call-wrapper.js'
import { ApiClient, QueryOptions } from './client.js'
import {
  Config,
  ConfigPaginated,
  FileMetadata,
  Namespace,
  PaginatedData,
  Run,
  RunPaginated,
  RunStatus,
  SecretMetadata,
  SecretPaginated,
  VersionInformation,
  YakuClientConfig,
  Findings,
  FindingsPaginated,
  FindingsStatusType,
} from './types.js'
import { Dispatcher } from 'undici'

describe('Client lib api', () => {
  let client: ApiClient

  const config: YakuClientConfig = {
    baseUrl: 'https://great-backend.com:666/endpoint',
    token: randomUUID(),
    agent: new Dispatcher(),
  }

  function urlWithId(url: string, id: number | string): string {
    return `${url}/${id}`
  }

  function paginatedData(
    page: number,
    url: string,
    data: Run[] | Config[] | SecretMetadata[]
  ): any {
    const base: PaginatedData = {
      pagination: {
        pageNumber: page,
        pageSize: 1,
        totalCount: 2,
      },
      links: {
        prev: undefined,
        next: undefined,
        last: url,
        first: url,
      },
    }
    if (page === 1) {
      base.links.next = url
    } else {
      base.links.prev = url
    }
    return { ...base, data: data }
  }

  beforeEach(() => {
    client = new ApiClient(config)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('Config api calls', () => {
    const config1: Config = {
      id: 1,
      name: 'config1',
      description: 'Some description',
      creationTime: new Date(0).toISOString(),
      lastModificationTime: new Date().toISOString(),
      files: {},
    }
    const config2: Config = {
      id: 2,
      name: 'config2',
      creationTime: new Date(0).toISOString(),
      lastModificationTime: new Date().toISOString(),
      files: {},
    }

    const configsUrl = `${config.baseUrl}/namespaces/1/configs`

    it('should return a paginated list of configs', async () => {
      const data: ConfigPaginated = paginatedData(1, configsUrl, [
        config1,
        config2,
      ]) as ConfigPaginated
      const mockedCall = jest.spyOn(api, 'getResource').mockResolvedValue(data)

      const result = await client.listConfigs(
        1,
        new QueryOptions(1, 20, [''], [[]], '', false)
      )

      expect(result).toBe(data)
      expect(mockedCall).toBeCalledWith(
        `${configsUrl}?page=1&items=20&sortOrder=DESC`,
        config.token
      )
    })

    it('should return a paginated list of configs using all features of querying', async () => {
      const data: ConfigPaginated = paginatedData(1, configsUrl, [
        config1,
        config2,
      ]) as ConfigPaginated
      const mockedCall = jest.spyOn(api, 'getResource').mockResolvedValue(data)

      const result = await client.listConfigs(
        1,
        new QueryOptions(1, 20, [''], [[]], 'lastModificationTime', false)
      )

      expect(result).toBe(data)
      expect(mockedCall).toBeCalledWith(
        `${configsUrl}?page=1&items=20&sortOrder=DESC&sortBy=lastModificationTime`,
        config.token
      )
    })

    it('should return a list of all configs matching the query', async () => {
      const data1: ConfigPaginated = paginatedData(1, configsUrl, [
        config1,
      ]) as ConfigPaginated
      const data2: ConfigPaginated = paginatedData(2, configsUrl, [
        config2,
      ]) as ConfigPaginated
      const mockedCall = jest
        .spyOn(client, 'listConfigs')
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(data2)

      const result = await client.listAllConfigs(
        1,
        new QueryOptions(1, 1, [''], [[]], '', false)
      )

      expect(result).toEqual([config1, config2])
      expect(mockedCall).toBeCalledTimes(2)
      expect(mockedCall).toBeCalledWith(1, {
        ascending: false,
        filterProperty: [''],
        filterValues: [[]],
        itemCount: 1,
        page: 1,
        sortBy: '',
      })
      expect(mockedCall).toBeCalledWith(1, {
        ascending: false,
        filterProperty: [''],
        filterValues: [[]],
        itemCount: 1,
        page: 2,
        sortBy: '',
      })
    })

    it('should return the requested config', async () => {
      const mockedCall = jest
        .spyOn(api, 'getResource')
        .mockResolvedValue(config1)

      const result = await client.getConfig(1, 1)

      expect(result).toBe(config1)
      expect(mockedCall).toBeCalledWith(urlWithId(configsUrl, 1), config.token)
    })

    it.each([
      [
        config1.name,
        config1.description,
        { name: config1.name, description: config1.description },
        config1,
      ],
      [config2.name, undefined, { name: config2.name }, config2],
      [config2.name, null, { name: config2.name }, config2],
      [config2.name, '', { name: config2.name }, config2],
      [config2.name, ' \t\n', { name: config2.name }, config2],
    ])(
      'should create a config with values "%s" and "%s"',
      async (n, d: any, b, e) => {
        const mockedCall = jest
          .spyOn(api, 'createResource')
          .mockResolvedValue(e)

        const result = await client.createConfig(1, n, d)

        expect(result).toBe(e)
        expect(mockedCall).toBeCalledWith(configsUrl, b, config.token)
      }
    )

    it.each([undefined, null, '', ' \t\n'])(
      'should throw error for falsy names',
      async (n: any) => {
        await expect(client.createConfig(1, n, 'dummy')).rejects.toThrow()
        expect(api.createResource).not.toBeCalled()
      }
    )

    it.each([
      [
        config1.name,
        config1.description,
        { name: config1.name, description: config1.description },
        config1,
      ],
      [config1.name, undefined, { name: config1.name }, config1],
      [
        config1.name,
        null,
        { name: config1.name, description: null },
        { id: 1, name: 'config1', files: {} },
      ],
      [
        config1.name,
        '',
        { name: config1.name, description: '' },
        { id: 1, name: 'config1', files: {} },
      ],
      [
        undefined,
        config1.description,
        { description: config1.description },
        config1,
      ],
      [
        undefined,
        null,
        { description: null },
        { id: 1, name: 'config1', files: {} },
      ],
      [
        undefined,
        '',
        { description: '' },
        { id: 1, name: 'config1', files: {} },
      ],
      [
        null,
        config1.description,
        { description: config1.description },
        config1,
      ],
      [
        null,
        null,
        { description: null },
        { id: 1, name: 'config1', files: {} },
      ],
      [null, '', { description: '' }, { id: 1, name: 'config1', files: {} }],
      ['', config1.description, { description: config1.description }, config1],
      ['', null, { description: null }, { id: 1, name: 'config1', files: {} }],
      ['', '', { description: '' }, { id: 1, name: 'config1', files: {} }],
      [
        ' \t\n',
        config1.description,
        { description: config1.description },
        config1,
      ],
      [
        ' \t\n',
        null,
        { description: null },
        { id: 1, name: 'config1', files: {} },
      ],
      [' \t\n', '', { description: '' }, { id: 1, name: 'config1', files: {} }],
    ])(
      'should update a config with values "%s" and "%s"',
      async (n: any, d, b, e) => {
        const mockedCall = jest
          .spyOn(api, 'updateResource')
          .mockResolvedValue(e)

        const result = await client.updateConfig(1, 1, n, d)

        expect(result).toBe(e)
        expect(mockedCall).toBeCalledWith(
          urlWithId(configsUrl, 1),
          b,
          config.token
        )
      }
    )

    it.each([undefined, null, '', ' \t\n'])(
      'should throw an error if nothing is to be changed',
      async (n: any) => {
        await expect(client.updateConfig(1, 1, n, undefined)).rejects.toThrow()
        expect(api.updateResource).not.toBeCalled()
      }
    )

    it('should delete the config with the given id', async () => {
      const mockedCall = jest.spyOn(api, 'deleteResource').mockResolvedValue()
      await client.deleteConfig(1, config1.id, false)
      expect(mockedCall).toBeCalledWith(
        urlWithId(configsUrl, config1.id),
        config.token
      )
    })

    it('should force delete a config and all associated runs', async () => {
      const runs: Run[] = [
        {
          id: 1,
          status: 'completed',
          config: 'this config',
          creationTime: new Date(),
        },
        {
          id: 2,
          status: 'completed',
          config: 'this config',
          creationTime: new Date(),
        },
      ]
      const mockedCall = jest.spyOn(api, 'deleteResource').mockResolvedValue()
      const mockListRuns = jest
        .spyOn(client, 'listAllRuns')
        .mockResolvedValue(runs)
      const mockDeleteRun = jest.spyOn(client, 'deleteRun').mockResolvedValue()

      await client.deleteConfig(1, config1.id, true)

      expect(mockedCall).toBeCalledWith(
        urlWithId(configsUrl, config1.id),
        config.token
      )
      expect(mockListRuns).toBeCalledWith(
        1,
        new QueryOptions(1, 100, ['config'], [[`${config1.id}`]], '', false)
      )
      expect(mockDeleteRun).toBeCalledTimes(2)
      expect(mockDeleteRun).toBeCalledWith(1, 1)
      expect(mockDeleteRun).toBeCalledWith(1, 2)
    })

    it('should force delete a config when no runs are associated', async () => {
      const mockedCall = jest.spyOn(api, 'deleteResource').mockResolvedValue()
      const mockListRuns = jest
        .spyOn(client, 'listAllRuns')
        .mockResolvedValue([])
      const mockDeleteRun = jest.spyOn(client, 'deleteRun')

      await client.deleteConfig(1, config1.id, true)

      expect(mockedCall).toBeCalledWith(
        urlWithId(configsUrl, config1.id),
        config.token
      )
      expect(mockListRuns).toBeCalledWith(
        1,
        new QueryOptions(1, 100, ['config'], [[`${config1.id}`]], '', false)
      )
      expect(mockDeleteRun).not.toBeCalled()
    })

    it.each(['running', 'pending'])(
      'should throw an error, if deletion of runs is not possible due to missing completionin state %s',
      async (state) => {
        const runs: Run[] = [
          {
            id: 1,
            status: 'completed',
            config: 'this config',
            creationTime: new Date(),
          },
          {
            id: 2,
            status: state as RunStatus,
            config: 'this config',
            creationTime: new Date(),
          },
        ]
        const mockedCall = jest.spyOn(api, 'deleteResource')
        const mockListRuns = jest
          .spyOn(client, 'listAllRuns')
          .mockResolvedValue(runs)
        const mockDeleteRun = jest.spyOn(client, 'deleteRun')

        await expect(client.deleteConfig(1, config1.id, true)).rejects.toThrow()

        expect(mockedCall).not.toBeCalled()
        expect(mockListRuns).toBeCalledWith(
          1,
          new QueryOptions(1, 100, ['config'], [[`${config1.id}`]], '', false)
        )
        expect(mockDeleteRun).not.toBeCalled()
      }
    )
  })

  describe('getFileData()', () => {
    it('downloads file as binary data', async () => {
      const filename = `${randomUUID()}.txt`
      const data: FileData = {
        data: Buffer.from('Streamdata'),
        filename: filename,
      }
      const mockedCall = jest
        .spyOn(api, 'getResourceBinaryData')
        .mockResolvedValue(data)

      const fileData = await client.getFileData(1, 4711, data.filename)

      const filesUrl = `${config.baseUrl}/namespaces/1/configs/4711/files`
      expect(mockedCall).toBeCalledWith(
        urlWithId(filesUrl, data.filename),
        config.token
      )
      expect(fileData).toEqual(data)
    })
  })

  describe('Config files api calls', () => {
    const filesUrl = `${config.baseUrl}/namespaces/1/configs/4711/files`

    it('should download a file content', async () => {
      let filename: string | undefined = undefined
      try {
        const data: FileData = {
          data: Buffer.from('Streamdata'),
          filename: `${randomUUID()}.txt`,
        }
        const mockedCall = jest
          .spyOn(api, 'getResourceBinaryData')
          .mockResolvedValue(data)

        filename = await client.downloadFileData(1, 4711, data.filename)

        expect(filename).toBe(data.filename)
        expect(mockedCall).toBeCalledWith(
          urlWithId(filesUrl, data.filename),
          config.token
        )
        expect(await readFile(filename)).toEqual(data.data)
      } finally {
        if (filename) {
          await unlink(filename)
        }
      }
    })

    it.each([
      [`${randomUUID()}.txt`, undefined],
      [`${randomUUID()}.txt`, 'qg-config.yaml'],
    ])(
      'should upload a file to a config with file "%s" and filename "%s"',
      async (file: any, name: any) => {
        try {
          const content = 'Content of config file'
          await writeFile(file, content)
          const mockedCall = jest.spyOn(api, 'uploadData').mockResolvedValue()

          await client.uploadFileToConfig(1, 4711, file, name)

          const form = new FormData()
          form.append('filename', name ? name : file)
          form.append('content', new Blob([content]))
          expect(mockedCall).toBeCalledWith(filesUrl, form, config.token, false)
        } finally {
          await unlink(file)
        }
      }
    )

    it('should replace a file in a config', async () => {
      const filepath = `${randomUUID()}.txt`
      try {
        const content = 'Content of config file'
        await writeFile(filepath, content)
        const mockedCall = jest.spyOn(api, 'uploadData').mockResolvedValue()

        await client.replaceFileInConfig(1, 4711, filepath, 'qg-config.yaml')

        const form = new FormData()
        form.append('content', new Blob([content]))
        expect(mockedCall).toBeCalledWith(
          urlWithId(filesUrl, 'qg-config.yaml'),
          form,
          config.token,
          true
        )
      } finally {
        await unlink(filepath)
      }
    })

    it('should delete a file from a config', async () => {
      await client.deleteFileFromConfig(1, 4711, 'dummy.txt')
      expect(api.deleteResource).toBeCalledWith(
        urlWithId(filesUrl, 'dummy.txt'),
        config.token
      )
    })

    describe('deleteAllFilesFromConfig()', () => {
      it('should delete all files from a config except qg-config.yaml', async () => {
        const initialConfig: Config = {
          id: 1,
          name: 'Config',
          creationTime: new Date(0).toISOString(),
          lastModificationTime: new Date().toISOString(),
          files: {
            qgConfig: 'https://some.url/to/qg-config.yaml',
            additionalConfigs: [
              'https://some.url/to/another.file',
              'https://some.url/to/another.second.file',
            ],
          },
        }
        const mockGetConfig = jest
          .spyOn(client, 'getConfig')
          .mockResolvedValue(initialConfig)
        const mockDeleteFile = jest.spyOn(client, 'deleteFileFromConfig')

        await client.deleteAllFilesFromConfig(1, 4711, false)

        expect(mockGetConfig).toBeCalled()
        expect(mockDeleteFile).toBeCalledTimes(2)
      })

      it('should delete all files from a config including qg-config.yaml if specified', async () => {
        const initialConfig: Config = {
          id: 1,
          name: 'Config',
          creationTime: new Date(0).toISOString(),
          lastModificationTime: new Date().toISOString(),
          files: {
            qgConfig: 'https://some.url/to/qg-config.yaml',
            additionalConfigs: [
              'https://some.url/to/another.file',
              'https://some.url/to/another.second.file',
            ],
          },
        }
        const mockGetConfig = jest
          .spyOn(client, 'getConfig')
          .mockResolvedValue(initialConfig)
        const mockDeleteFile = jest.spyOn(client, 'deleteFileFromConfig')

        await client.deleteAllFilesFromConfig(1, 4711, true)

        expect(mockGetConfig).toBeCalled()
        expect(mockDeleteFile).toBeCalledTimes(3)
      })
    })

    it('should create a config from some excel data', async () => {
      const xslxPath = `${randomUUID()}.xslx`
      const xlsxConfigPath = `${randomUUID()}.txt`
      let configPath: string | undefined = undefined
      try {
        const xslxData = 'Content of config file'
        await writeFile(xslxPath, xslxData)
        const configData = 'And the config for the xslx'
        await writeFile(xlsxConfigPath, configData)
        const data: FileData = {
          filename: `qg-config-${randomUUID()}.yaml`,
          data: Buffer.from('The schema content for the provided data'),
        }
        const mockedCall = jest
          .spyOn(api, 'transformData')
          .mockResolvedValue(data)

        configPath = await client.createConfigFromExcel(
          1,
          4711,
          xslxPath,
          xlsxConfigPath
        )

        const form = new FormData()
        form.append('xlsx', new Blob([xslxData]))
        form.append('config', new Blob([configData]))
        expect(configPath).toBe(data.filename)
        expect(mockedCall).toBeCalledWith(
          `${config.baseUrl}/namespaces/1/configs/4711/config-from-excel`,
          form,
          config.token
        )
        expect(await readFile(configPath)).toEqual(data.data)
      } finally {
        await unlink(xslxPath)
        await unlink(xlsxConfigPath)
        if (configPath) {
          await unlink(configPath)
        }
      }
    })

    it('should create a qg-config.yaml file from questionnaire data', async () => {
      const questionnairePath = `${randomUUID()}.yaml`
      let configPath: string | undefined = undefined
      try {
        const questionnaireData = 'Content of questionnaire file'
        await writeFile(questionnairePath, questionnaireData)
        const data: FileData = {
          filename: `${randomUUID()}.yaml`,
          data: Buffer.from('The config content for the provided data'),
        }
        const mockedCall = jest
          .spyOn(api, 'transformData')
          .mockResolvedValue(data)

        configPath = await client.createConfigFromQuestionnaire(
          1,
          4711,
          questionnairePath
        )

        const form = new FormData()
        form.append('content', new Blob([questionnaireData]))
        expect(configPath).toBe(data.filename)
        expect(mockedCall).toBeCalledWith(
          `${config.baseUrl}/namespaces/1/configs/4711/initial-config`,
          form,
          config.token
        )
        expect(await readFile(configPath)).toEqual(data.data)
      } finally {
        await unlink(questionnairePath)
        if (configPath) {
          await unlink(configPath)
        }
      }
    })

    it('should create a config with files', async () => {
      const initialConfig: Config = {
        id: 1,
        name: 'Config',
        creationTime: new Date(0).toISOString(),
        lastModificationTime: new Date().toISOString(),
        files: {},
      }
      const readyConfig: Config = {
        ...initialConfig,
        files: {
          qgConfig: `${filesUrl}/qg-config.yaml`,
          additionalConfigs: [`${filesUrl}/config.json`],
        },
      }
      const mockCreate = jest
        .spyOn(client, 'createConfig')
        .mockResolvedValue(initialConfig)
      const mockUpload = jest
        .spyOn(client, 'uploadFileToConfig')
        .mockResolvedValue()
      const mockGet = jest
        .spyOn(client, 'getConfig')
        .mockResolvedValue(readyConfig)

      const fileData: FileMetadata[] = [
        {
          filepath: 'qg-config.yaml',
        },
        {
          filename: 'config.json',
          filepath: 'additional-config.json',
        },
      ]

      const result = await client.createConfigWithFiles(
        1,
        initialConfig.name,
        '',
        fileData
      )

      expect(result).toBe(readyConfig)
      expect(mockCreate).toBeCalledWith(1, initialConfig.name, '')
      expect(mockUpload).toBeCalledTimes(2)
      expect(mockUpload).toBeCalledWith(
        1,
        initialConfig.id,
        fileData[0].filepath,
        undefined
      )
      expect(mockUpload).toBeCalledWith(
        1,
        initialConfig.id,
        fileData[1].filepath,
        fileData[1].filename
      )
      expect(mockGet).toBeCalledWith(1, initialConfig.id)
    })
  })

  describe('Run api calls', () => {
    const run1: Run = {
      id: 1,
      status: 'completed',
      config: `${config.baseUrl}/namespaces/1/configs/1`,
      overallResult: 'GREEN',
      creationTime: new Date(),
      completionTime: new Date(),
      argoNamespace: 'argo-ns',
      argoName: 'argoN',
      log: ['Log Line1', 'Log Line2'],
    }

    const run2: Run = {
      id: 2,
      status: 'completed',
      config: `${config.baseUrl}/namespaces/1/configs/2`,
      overallResult: 'GREEN',
      creationTime: new Date(),
      completionTime: new Date(),
      argoNamespace: 'argo-ns',
      argoName: 'argoN2',
      log: ['Log Line1', 'Log Line2'],
    }

    const runsUrl = `${config.baseUrl}/namespaces/1/runs`

    it('should return a paginated list of runs', async () => {
      const data: RunPaginated = paginatedData(1, runsUrl, [
        run1,
        run2,
      ]) as RunPaginated
      const mockedCall = jest.spyOn(api, 'getResource').mockResolvedValue({
        ...data,
      })

      const result = await client.listRuns(
        1,
        new QueryOptions(1, 20, [''], [[]], '', false)
      )

      expect(result).toEqual(expect.objectContaining(data))
      expect(mockedCall).toBeCalledWith(
        `${runsUrl}?page=1&items=20&sortOrder=DESC`,
        config.token
      )
    })

    it('should return a paginated list using all features of querying', async () => {
      const data: RunPaginated = paginatedData(1, runsUrl, [
        run1,
        run2,
      ]) as RunPaginated
      const mockedCall = jest.spyOn(api, 'getResource').mockResolvedValue({
        ...data,
      })

      const result = await client.listRuns(
        1,
        new QueryOptions(1, 20, ['config'], [['1', '2']], 'creationTime', false)
      )

      expect(result).toEqual(expect.objectContaining(data))
      expect(mockedCall).toBeCalledWith(
        `${runsUrl}?page=1&items=20&sortOrder=DESC&filter=config%3D1%2C2&sortBy=creationTime`,
        config.token
      )
    })

    it('should return a list of all runs matching the query', async () => {
      const data1: RunPaginated = paginatedData(1, runsUrl, [
        run1,
      ]) as RunPaginated
      const data2: RunPaginated = paginatedData(2, runsUrl, [
        run2,
      ]) as RunPaginated
      const mockedCall = jest
        .spyOn(client, 'listRuns')
        .mockResolvedValueOnce({
          ...data1,
        })
        .mockResolvedValueOnce({
          ...data2,
        })

      const result = await client.listAllRuns(
        1,
        new QueryOptions(1, 1, ['config'], [['1']], '', false)
      )

      expect(result).toEqual([run1, run2])
      expect(mockedCall).toBeCalledTimes(2)
      expect(mockedCall).toBeCalledWith(1, {
        ascending: false,
        filterProperty: ['config'],
        filterValues: [['1']],
        itemCount: 1,
        page: 1,
        sortBy: '',
      })
      expect(mockedCall).toBeCalledWith(1, {
        ascending: false,
        filterProperty: ['config'],
        filterValues: [['1']],
        itemCount: 1,
        page: 2,
        sortBy: '',
      })
    })

    it('should return the complete run information of requested run', async () => {
      const mockedCall = jest.spyOn(api, 'getResource').mockResolvedValue({
        ...run1,
      })

      const result = await client.getRun(1, run1.id)
      expect(result).toEqual(expect.objectContaining(run1))
      expect(mockedCall).toBeCalledWith(
        urlWithId(runsUrl, run1.id),
        config.token
      )
    })

    it('should return the only limited run information of requested run', async () => {
      const mockedCall = jest.spyOn(api, 'getResource').mockResolvedValue({
        ...run1,
      })

      const result = await client.getRun(1, run1.id, false)

      const { argoName, argoNamespace, log, ...essential } = run1
      expect(result).toEqual(expect.objectContaining(essential))
      expect(result.argoName).not.toBeDefined()
      expect(result.argoNamespace).not.toBeDefined()
      expect(result.log).not.toBeDefined()
      expect(mockedCall).toBeCalledWith(
        urlWithId(runsUrl, run1.id),
        config.token
      )
    })

    it('should start a run without environment variables', async () => {
      const mockedCall = jest.spyOn(api, 'createResource').mockResolvedValue({
        ...run1,
      })

      const result = await client.startRun(1, 1, {})

      expect(result).toEqual(expect.objectContaining(run1))
      expect(mockedCall).toBeCalledWith(runsUrl, { configId: 1 }, config.token)
    })

    it('should start a run with environment variables', async () => {
      const mockedCall = jest.spyOn(api, 'createResource').mockResolvedValue({
        ...run1,
      })

      const environment = { key1: 'value1', key2: 'value2' }
      const result = await client.startRun(1, 1, environment)

      expect(result).toEqual(expect.objectContaining(run1))
      expect(mockedCall).toBeCalledWith(
        runsUrl,
        { configId: 1, environment },
        config.token
      )
    })

    it('should start a run and wait for the result', async () => {
      jest.useRealTimers()
      const initialRun: Run = {
        id: 815,
        status: 'pending',
        config: `${config.baseUrl}/namespaces/1/configs/1`,
        creationTime: new Date(),
      }
      const runningRun: Run = {
        ...initialRun,
        status: 'running',
        argoNamespace: 'argo-ns',
        argoName: 'argoN',
      }
      const completedRun: Run = {
        ...runningRun,
        status: 'completed',
        overallResult: 'GREEN',
        completionTime: new Date(),
        log: ['Log Line1', 'Log Line2'],
      }
      const mockedStart = jest.spyOn(client, 'startRun').mockResolvedValue({
        ...initialRun,
      })
      const mockedGet = jest
        .spyOn(client, 'getRun')
        .mockResolvedValueOnce({
          ...initialRun,
        })
        .mockResolvedValueOnce({
          ...runningRun,
        })
        .mockResolvedValueOnce({
          ...runningRun,
        })
        .mockResolvedValueOnce({
          ...completedRun,
        })

      const result = await client.startAndAwaitRun(1, 1, {}, 1)

      expect(result).toEqual({
        ...completedRun,
      })
      expect(mockedStart).toBeCalledWith(1, 1, {})
      expect(mockedGet).toBeCalledTimes(4)
      expect(mockedGet).toBeCalledWith(1, 815)
    })

    it('should download the result file of a run', async () => {
      let filename: string | undefined = undefined
      try {
        const data: FileData = {
          data: Buffer.from('Streamdata'),
          filename: `${randomUUID()}.txt`,
        }
        const mockedCall = jest
          .spyOn(api, 'getResourceBinaryData')
          .mockResolvedValue(data)

        filename = await client.getRunResult(1, run1.id)

        expect(filename).toBe(data.filename)
        expect(mockedCall).toBeCalledWith(
          `${urlWithId(runsUrl, run1.id)}/results`,
          config.token
        )
        expect(await readFile(filename)).toEqual(data.data)
      } finally {
        if (filename) {
          await unlink(filename)
        }
      }
    })

    it('should download the evidences file of a run', async () => {
      let filename: string | undefined = undefined
      try {
        const data: FileData = {
          data: Buffer.from('Streamdata'),
          filename: `${randomUUID()}.txt`,
        }
        const mockedCall = jest
          .spyOn(api, 'getResourceBinaryData')
          .mockResolvedValue(data)

        filename = await client.getRunEvidences(1, run1.id)

        expect(filename).toBe(data.filename)
        expect(mockedCall).toBeCalledWith(
          `${urlWithId(runsUrl, run1.id)}/evidences`,
          config.token
        )
        expect(await readFile(filename)).toEqual(data.data)
      } finally {
        if (filename) {
          await unlink(filename)
        }
      }
    })

    it('should delete the run with the given id', async () => {
      const mockedCall = jest.spyOn(api, 'deleteResource').mockResolvedValue()
      await client.deleteRun(1, run1.id)
      expect(mockedCall).toBeCalledWith(
        urlWithId(runsUrl, run1.id),
        config.token
      )
    })
  })

  describe('Secret api calls', () => {
    const secret1: SecretMetadata = {
      name: 'Secret1',
      description: 'Description1',
      creationTime: new Date(0).toISOString(),
      lastModificationTime: new Date().toISOString(),
    }
    const secret2: SecretMetadata = {
      name: 'Secret2',
      creationTime: new Date(0).toISOString(),
      lastModificationTime: new Date().toISOString(),
    }

    const secretValue = randomUUID()

    const secretsUrl = `${config.baseUrl}/namespaces/1/secrets`

    it('should list all secret metadata for the namespace', async () => {
      const data: SecretPaginated = paginatedData(1, secretsUrl, [
        secret1,
        secret2,
      ]) as SecretPaginated
      const mockedCall = jest
        .spyOn(api, 'getResource')
        .mockResolvedValue({ ...data })

      const result = await client.listSecrets(
        1,
        new QueryOptions(1, 20, [''], [[]], '', false)
      )

      expect(result.data).toEqual([secret1, secret2])
      expect(mockedCall).toBeCalledWith(
        `${secretsUrl}?page=1&items=20&sortOrder=DESC`,
        config.token
      )
    })

    it('should return a list of all secrets matching the query', async () => {
      const data1: SecretPaginated = paginatedData(1, secretsUrl, [
        secret1,
      ]) as SecretPaginated
      const data2: SecretPaginated = paginatedData(2, secretsUrl, [
        secret2,
      ]) as SecretPaginated
      const mockedCall = jest
        .spyOn(client, 'listSecrets')
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(data2)

      const result = await client.listAllSecrets(
        1,
        new QueryOptions(1, 1, [''], [[]], '', false)
      )

      expect(result).toEqual([secret1, secret2])
      expect(mockedCall).toBeCalledTimes(2)
      expect(mockedCall).toBeCalledWith(1, {
        ascending: false,
        filterProperty: [''],
        filterValues: [[]],
        itemCount: 1,
        page: 1,
        sortBy: '',
      })
      expect(mockedCall).toBeCalledWith(1, {
        ascending: false,
        filterProperty: [''],
        filterValues: [[]],
        itemCount: 1,
        page: 2,
        sortBy: '',
      })
    })

    it.each([
      [
        secret1.name,
        secret1.description,
        {
          name: secret1.name,
          description: secret1.description,
          secret: secretValue,
        },
        secret1,
      ],
      [
        secret2.name,
        undefined,
        { name: secret2.name, secret: secretValue },
        secret2,
      ],
    ])(
      'should create a secret with values "%s" and "%s"',
      async (n, d, b, e) => {
        const mockedCall = jest
          .spyOn(api, 'createResource')
          .mockResolvedValue(e)

        const result = await client.createSecret(1, n, secretValue, d)

        expect(result).toBe(e)
        expect(mockedCall).toBeCalledWith(secretsUrl, b, config.token)
      }
    )

    it.each([undefined, null, '', ' \t\n'])(
      'should throw an error on falsy parameters "%s"',
      async (value: any) => {
        await expect(
          client.createSecret(1, value, 'dummy', undefined)
        ).rejects.toThrow()
        await expect(
          client.createSecret(1, 'dummy', value, undefined)
        ).rejects.toThrow()

        expect(api.createResource).not.toBeCalled()
      }
    )

    it.each([
      [
        secret1.name,
        secretValue,
        secret1.description,
        { description: secret1.description, secret: secretValue },
        secret1,
      ],
      [secret2.name, secretValue, undefined, { secret: secretValue }, secret2],
      [
        secret1.name,
        undefined,
        secret1.description,
        { description: secret1.description },
        secret1,
      ],
      [
        secret2.name,
        secretValue,
        null,
        { description: null, secret: secretValue },
        secret2,
      ],
      [
        secret1.name,
        null,
        secret1.description,
        { description: secret1.description },
        secret1,
      ],
      [
        secret2.name,
        secretValue,
        '',
        { description: null, secret: secretValue },
        secret2,
      ],
      [
        secret1.name,
        '',
        secret1.description,
        { description: secret1.description },
        secret1,
      ],
      [
        secret2.name,
        secretValue,
        ' \t\n',
        { description: null, secret: secretValue },
        secret2,
      ],
      [
        secret1.name,
        ' \t\n',
        secret1.description,
        { description: secret1.description },
        secret1,
      ],
    ])(
      'should create a secret with values "%s", "%s", "%s"',
      async (n: any, v: any, d: any, b, e) => {
        const mockedCall = jest
          .spyOn(api, 'updateResource')
          .mockResolvedValue(e)

        const result = await client.updateSecret(1, n, v, d)

        expect(result).toBe(e)
        expect(mockedCall).toBeCalledWith(
          urlWithId(secretsUrl, n),
          b,
          config.token
        )
      }
    )

    it.each([undefined, null, '', ' \t\n'])(
      'should throw an error on falsy parameters "%s"',
      async (value: any) => {
        await expect(
          client.updateSecret(1, value, 'dummy', 'dummy')
        ).rejects.toThrow()
        await expect(
          client.updateSecret(1, 'dummy', value, undefined)
        ).rejects.toThrow()

        expect(api.updateResource).not.toBeCalled()
      }
    )

    it('should delete the secret with the given name', async () => {
      const mockedCall = jest.spyOn(api, 'deleteResource').mockResolvedValue()
      await client.deleteSecret(1, secret1.name)
      expect(mockedCall).toBeCalledWith(
        urlWithId(secretsUrl, secret1.name),
        config.token
      )
    })
  })

  describe('Namespace api calls', () => {
    const namespace1: Namespace = {
      id: 1,
      name: 'namespace1',
      users: [],
    }
    const namespace2: Namespace = { id: 2, name: 'namespace2', users: [] }

    const namespaceUrl = `${config.baseUrl}/namespaces`

    it('should retrieve all namespaces for a user based on the token', async () => {
      const mockedCall = jest
        .spyOn(api, 'getResource')
        .mockResolvedValue([namespace1, namespace2])

      const result = await client.getNamespaces()

      expect(result).toEqual([namespace1, namespace2])
      expect(mockedCall).toBeCalledWith(namespaceUrl, config.token)
    })

    it('should retrieve a certain namespace identified by an id', async () => {
      const mockedCall = jest
        .spyOn(api, 'getResource')
        .mockResolvedValue(namespace1)

      const result = await client.getNamespace(1)

      expect(result).toBe(namespace1)
      expect(mockedCall).toBeCalledWith(
        urlWithId(namespaceUrl, 1),
        config.token
      )
    })

    it('should create a namespace', async () => {
      const mockedCall = jest
        .spyOn(api, 'createResource')
        .mockResolvedValue(namespace1)

      const result = await client.createNamespace(namespace1.name)

      expect(result).toBe(namespace1)
      expect(mockedCall).toBeCalledWith(
        namespaceUrl,
        {
          name: namespace1.name,
          users: [],
        },
        config.token
      )
    })

    it.each([null, undefined, '', ' \t\n'])(
      'should fail in case of an undefined name "%s"',
      async (name: any) => {
        await expect(client.createNamespace(name)).rejects.toThrow()
        expect(api.createResource).not.toBeCalled()
      }
    )

    it('should create a namespace with a config file setup', async () => {
      const name = 'Test Namespace'
      const configFile = 'special-config.yaml'

      const namespace: Namespace = {
        id: 1,
        name,
        users: [],
      }
      const createdConfig: Config = {
        id: 1,
        name: 'default',
        description: 'This is a default config containing a qg-config.yaml',
        creationTime: new Date(0).toISOString(),
        lastModificationTime: new Date().toISOString(),
        files: {
          qgConfig: `${urlWithId(
            namespaceUrl,
            1
          )}/configs/1/files/qg-config.yaml`,
        },
      }
      const mockedCreate = jest
        .spyOn(client, 'createNamespace')
        .mockResolvedValue(namespace)
      const mockedConfigCreate = jest
        .spyOn(client, 'createConfigWithFiles')
        .mockResolvedValue(createdConfig)

      const result = await client.createNamespaceWithConfig(name, configFile)

      expect(result).toBe(namespace)
      expect(mockedCreate).toBeCalledWith(name)
      expect(mockedConfigCreate).toBeCalledWith(
        namespace.id,
        createdConfig.name,
        createdConfig.description,
        [{ filename: 'qg-config.yaml', filepath: configFile }]
      )
    })

    it('should update a namespace name', async () => {
      const resultNamespace = {
        id: namespace2.id,
        name: namespace1.name,
        users: [],
      }
      const mockedCall = jest
        .spyOn(api, 'updateResource')
        .mockResolvedValue(resultNamespace)

      const result = await client.updateNamespace(2, namespace1.name)

      expect(result).toBe(resultNamespace)
      expect(mockedCall).toBeCalledWith(
        urlWithId(namespaceUrl, 2),
        { name: namespace1.name, users: [] },
        config.token
      )
    })
  })

  describe('Service info api calls', () => {
    it('should get the version information of the service', async () => {
      const info: VersionInformation = {
        imageVersion: 'foo',
        serviceVersion: 'bar',
        qgcliVersions: { v1: 'latest', v2: 'legacy' },
      }
      const mockedCall = jest.spyOn(api, 'getResource').mockResolvedValue(info)

      const result = await client.getServiceInfo()

      expect(result).toEqual(info)
      expect(mockedCall).toBeCalledWith(
        `${config.baseUrl}/service/info`,
        config.token
      )
    })
  })

  describe('Check error case', () => {
    it.each([
      [
        'listConfigs',
        'getResource',
        () =>
          client.listConfigs(
            666,
            new QueryOptions(1, 20, [''], [[]], '', false)
          ),
      ],
      ['getConfig', 'getResource', () => client.getConfig(666, 4711)],
      [
        'createConfig',
        'createResource',
        () => client.createConfig(666, 'dummy', 'dummy'),
      ],
      [
        'updateConfig',
        'updateResource',
        () => client.updateConfig(666, 4711, 'dummy', 'dummy'),
      ],
      [
        'deleteConfig',
        'deleteResource',
        () => client.deleteConfig(666, 4711, false),
      ],
      [
        'downloadFileData',
        'getResourceBinaryData',
        () => client.downloadFileData(666, 1, 'dummy'),
      ],
      [
        'deleteFileFromConfig',
        'deleteResource',
        () => client.deleteFileFromConfig(666, 1, 'dummy'),
      ],
      [
        'listRuns',
        'getResource',
        () =>
          client.listRuns(666, new QueryOptions(1, 20, [''], [[]], '', false)),
      ],
      ['getRun', 'getResource', () => client.getRun(666, 4711, false)],
      ['startRun', 'createResource', () => client.startRun(666, 1, {})],
      [
        'getRunResult',
        'getResourceBinaryData',
        () => client.getRunResult(666, 4711),
      ],
      [
        'getRunEvidences',
        'getResourceBinaryData',
        () => client.getRunEvidences(666, 4711),
      ],
      ['deleteRun', 'deleteResource', () => client.deleteRun(666, 4711)],
      [
        'listSecrets',
        'getResource',
        () =>
          client.listSecrets(
            666,
            new QueryOptions(1, 20, undefined, undefined, undefined, false)
          ),
      ],
      [
        'createSecret',
        'createResource',
        () => client.createSecret(666, 'dummy', 'dummy', undefined),
      ],
      [
        'updateSecret',
        'updateResource',
        () => client.updateSecret(666, 'dummy', 'dummy', undefined),
      ],
      [
        'deleteSecret',
        'deleteResource',
        () => client.deleteSecret(666, 'dummy'),
      ],
      ['getNamespaces', 'getResource', () => client.getNamespaces()],
      ['getNamespace', 'getResource', () => client.getNamespace(666)],
      [
        'createNamespace',
        'createResource',
        () => client.createNamespace('dummy'),
      ],
      [
        'updateNamespace',
        'updateResource',
        () => client.updateNamespace(2, 'dummy'),
      ],
      ['getServiceInfo', 'getResource', () => client.getServiceInfo()],
    ])(
      'should forward an RestApiError if remote call fails for %s',
      async (name, mocked: any, testFct) => {
        jest.spyOn(api, mocked).mockRejectedValue(
          new RestApiRequestError({
            status: 400,
            message: 'error message',
            additionalProperties: { url: config.baseUrl },
          })
        )

        await expect(testFct()).rejects.toThrow(RestApiRequestError)
      }
    )
  })

  it.each([
    [
      'uploadFileToConfig',
      false,
      (path: string) => client.uploadFileToConfig(1, 4711, path),
    ],
    [
      'replaceFileInConfig',
      true,
      (path: string) => client.replaceFileInConfig(1, 4711, path, path),
    ],
  ])(
    'should forward an RestApiError if remote call fails for %s',
    async (name, replace, clientcall) => {
      const filesUrl = `${config.baseUrl}/namespaces/1/configs/4711/files`

      const content = 'Content of config file'
      const file = `qg-config-${randomUUID()}.yaml`
      try {
        await writeFile(file, content)
        const mockedCall = jest.spyOn(api, 'uploadData').mockRejectedValue(
          new RestApiRequestError({
            status: 400,
            message: 'error message',
            additionalProperties: { url: filesUrl },
          })
        )

        await expect(clientcall(file)).rejects.toThrow(RestApiRequestError)

        const form = new FormData()
        if (!replace) {
          form.append('filename', file)
        }
        form.append('content', new Blob([content]))
        const url = replace ? urlWithId(filesUrl, file) : filesUrl
        expect(mockedCall).toBeCalledWith(url, form, config.token, replace)
      } finally {
        await unlink(file)
      }
    }
  )

  it('should forward an RestApiError if remote call fails for createConfigFromExcel', async () => {
    const xslxPath = `${randomUUID()}.xslx`
    const configPath = `${randomUUID()}.txt`
    try {
      const xslxData = 'Content of config file'
      await writeFile(xslxPath, xslxData)
      const configData = 'And the config for the xslx'
      await writeFile(configPath, configData)
      const mockedCall = jest.spyOn(api, 'transformData').mockRejectedValue(
        new RestApiRequestError({
          status: 400,
          message: 'error message',
          additionalProperties: { url: config.baseUrl },
        })
      )

      await expect(
        client.createConfigFromExcel(1, 4711, xslxPath, configPath)
      ).rejects.toThrow(RestApiRequestError)

      const form = new FormData()
      form.append('xlsx', new Blob([xslxData]))
      form.append('config', new Blob([configData]))
      expect(mockedCall).toBeCalledWith(
        `${config.baseUrl}/namespaces/1/configs/4711/config-from-excel`,
        form,
        config.token
      )
    } finally {
      await unlink(xslxPath)
      await unlink(configPath)
    }
  })

  it('should forward an RestApiError if remote call fails for createConfigFromQuestionnaire', async () => {
    const questionnairePath = `${randomUUID()}.txt`
    try {
      const questionnaireData = 'And the config for the xslx'
      await writeFile(questionnairePath, questionnaireData)
      const mockedCall = jest.spyOn(api, 'transformData').mockRejectedValue(
        new RestApiRequestError({
          status: 400,
          message: 'error message',
          additionalProperties: { url: config.baseUrl },
        })
      )

      await expect(
        client.createConfigFromQuestionnaire(1, 4711, questionnairePath)
      ).rejects.toThrow(RestApiRequestError)

      const form = new FormData()
      form.append('content', new Blob([questionnaireData]))
      expect(mockedCall).toBeCalledWith(
        `${config.baseUrl}/namespaces/1/configs/4711/initial-config`,
        form,
        config.token
      )
    } finally {
      await unlink(questionnairePath)
    }
  })

  describe('Findings api calls', () => {
    const findingsUrl = `${config.baseUrl}/namespaces/1/findings`
    const findings: FindingsPaginated = {
      pagination: {
        pageNumber: 1,
        pageSize: 20,
        totalCount: 1,
      },
      links: {
        first: `${findingsUrl}?page=1&items=20`,
        last: `${findingsUrl}?page=1&items=20`,
      },
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          metadata: {},
          configId: 1,
          runId: 1,
          runStatus: 'completed',
          runOverallStatus: 'YELLOW',
          runCompletionTime: '2024-01-11T14:22:29.000Z',
          chapter: '1',
          requirement: '1',
          check: '1',
          criterion: '',
          justification: '',
          occurrenceCount: 1,
          status: FindingsStatusType.UNRESOLVED,
          resolvedComment: '',
          resolvedDate: '2024-01-11T14:22:29.000Z',
          resolver: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }

    const tokenBody =
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InRva2VuIiwiaWF0IjoxNTE2MjM5MDIyfQ'

    it('should return a paginated list of findings', async () => {
      const mockedCall = jest
        .spyOn(api, 'getResource')
        .mockResolvedValue(findings)
      const result = await client.listFindings(
        1,
        new QueryOptions(1, 20, ['configId'], [['1']], '', false)
      )

      expect(result).toBe(findings)
      expect(mockedCall).toBeCalledTimes(1)
      expect(mockedCall).toBeCalledWith(
        `${findingsUrl}?page=1&items=20&sortOrder=DESC&filter=configId%3D1`,
        config.token
      )
    })

    it('should return a paginated list of findings using all features of querying', async () => {
      const mockedCall = jest
        .spyOn(api, 'getResource')
        .mockResolvedValue(findings)

      const result = await client.listFindings(
        1,
        new QueryOptions(
          1,
          20,
          ['configId'],
          [['1']],
          'lastModificationTime',
          true
        )
      )

      expect(result).toBe(findings)
      expect(mockedCall).toBeCalledWith(
        `${findingsUrl}?page=1&items=20&sortOrder=ASC&filter=configId%3D1&sortBy=lastModificationTime`,
        config.token
      )
    })

    it('should resolve a finding', async () => {
      const parsedObject = {
        name: 'some-name',
      }
      jest
        .spyOn(Buffer, 'from')
        .mockImplementationOnce(() => Buffer.from(tokenBody, 'base64'))
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => parsedObject)

      const mockedCall = jest
        .spyOn(api, 'updateResource')
        .mockResolvedValueOnce(undefined)

      client.resolveFinding(1, 'some-id', { comment: 'some-comment' })

      expect(mockedCall).toBeCalledTimes(1)
    })

    it('should fail resolving a finding when using a bad token', async () => {
      jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
        throw new Error('some-error')
      })

      expect(
        client.resolveFinding(1, 'some-id', { comment: 'some-comment' })
      ).rejects.toThrowError('Failed to parse user token')
    })

    it('should fail resolving a finding when using an unsupported token', async () => {
      jest
        .spyOn(Buffer, 'from')
        .mockImplementationOnce(() => Buffer.from(tokenBody, 'base64'))
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => 'invalid')

      expect(
        client.resolveFinding(1, 'some-id', { comment: 'some-comment' })
      ).rejects.toThrowError('Failed to parse user token')
    })

    it('should reopen a finding', async () => {
      const mockedCall = jest
        .spyOn(api, 'updateResource')
        .mockResolvedValueOnce(undefined)

      client.reopenFinding(1, 'some-id')

      expect(mockedCall).toBeCalledTimes(1)
    })
  })
})
