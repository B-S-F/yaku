import {
  UrlHandlerFactory,
  UrlProtocolConfig,
  createMockResponse,
  streamToString,
  testingNamespaceId,
} from '@B-S-F/api-commons-lib'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { readFile } from 'fs/promises'
import { MAX_FILE_SIZE_MB } from '../../config'
import { JsonValidatorService } from '../../gp-services/json-validator.service'
import { baseUrl, testUser } from '../../gp-services/test-services'
import { YamlValidatorService } from '../../gp-services/yaml-validator.service'
import { ConfigEntity, FileContentEntity, FileEntity } from './config.entity'
import {
  ConfigsController,
  ContentSizeValidator,
  ExcelSchema,
  FileFormatValidator,
  FilePatchSchema,
  fileSizeCheck,
} from './configs.controller'
import { ConfigsService } from './configs.service'

describe('ConfigsControllerFiles', () => {
  let controller: ConfigsController
  let service: ConfigsService

  const configNoFiles = {
    globalId: 1,
    namespace: { id: testingNamespaceId, name: '' },
    id: 1,
    name: 'Config without files',
    files: [],
  } as ConfigEntity
  const configWithFiles = {
    globalId: 2,
    namespace: { id: testingNamespaceId, name: '' },
    id: 2,
    name: 'Config with two config files',
    files: [],
  } as ConfigEntity
  const qgConfigFile = {
    id: 21,
    filename: 'qg-config.yaml',
    config: configWithFiles,
  } as FileEntity
  const qgConfigFileContent = {
    id: 21,
    content: 'This is a very good config',
    file: qgConfigFile,
  } as FileContentEntity
  const additionalConfigFile = {
    id: 22,
    filename: 'additional-config.yaml',
    config: configWithFiles,
  } as FileEntity
  const additionalConfigFileContent = {
    id: 22,
    content: 'This adds up well to the great config',
    file: additionalConfigFile,
  } as FileContentEntity

  const fileUploadName = 'additional-config.json'
  const fileUploadContentString =
    '{ "awesome": "This is an awesome additional config" }'
  const fileUploadContent = [
    {
      buffer: Buffer.from(fileUploadContentString, 'utf-8'),
      originalname: fileUploadName,
    },
  ] as unknown as Express.Multer.File

  const configUploadContentString = 'header:\n  version: "1.0"'
  const configUploadContent = [
    {
      buffer: Buffer.from(configUploadContentString, 'utf-8'),
      originalname: 'qg-config.yaml',
    },
  ] as unknown as Express.Multer.File

  const mockConfigUrl = `https://localhost:3000/api/v1/namespaces/${testingNamespaceId}/configs/${configNoFiles.id}/files`

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigsController],
      providers: [
        YamlValidatorService,
        JsonValidatorService,
        {
          provide: ConfigsService,
          useValue: {
            createFile: jest.fn(),
            updateFile: jest.fn(),
            getFileContent: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        UrlHandlerFactory,
        {
          provide: UrlProtocolConfig,
          useValue: {
            serviceProtocol: 'https',
          },
        },
      ],
    }).compile()

    controller = module.get<ConfigsController>(ConfigsController)
    service = module.get<ConfigsService>(ConfigsService)
  })

  describe('Get FileContent', () => {
    it('should return the content of a qg-config file properly', async () => {
      const srvSpy = jest
        .spyOn(service, 'getFileContent')
        .mockResolvedValue(Buffer.from(qgConfigFileContent.content, 'utf-8'))
      const response = createMockResponse(
        `${baseUrl}/configs/${configWithFiles.id}/files/${qgConfigFile.filename}`,
        testUser
      )

      const content = await controller.getFileContent(
        testingNamespaceId,
        configWithFiles.id,
        qgConfigFile.filename,
        response
      )

      expect(await streamToString(content.getStream())).toBe(
        qgConfigFileContent.content
      )
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configWithFiles.id,
        qgConfigFile.filename
      )
      expect(response.header).toBeCalledWith(
        'Content-Disposition',
        `attachment; filename="${qgConfigFile.filename}"; filename*="${qgConfigFile.filename}"`
      )
    })

    it('should return the content of another config file properly', async () => {
      const srvSpy = jest
        .spyOn(service, 'getFileContent')
        .mockResolvedValue(
          Buffer.from(additionalConfigFileContent.content, 'utf-8')
        )
      const response = createMockResponse(
        `${baseUrl}/configs/${configWithFiles.id}/files/${additionalConfigFile.filename}`,
        testUser
      )

      const content = await controller.getFileContent(
        testingNamespaceId,
        configWithFiles.id,
        additionalConfigFile.filename,
        response
      )

      expect(await streamToString(content.getStream())).toBe(
        additionalConfigFileContent.content
      )
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configWithFiles.id,
        additionalConfigFile.filename
      )
      expect(response.header).toBeCalledWith(
        'Content-Disposition',
        `attachment; filename="${additionalConfigFile.filename}"; filename*="${additionalConfigFile.filename}"`
      )
    })

    it('should return the content of an encoded file properly', async () => {
      const configId = 3
      const filename = 'encoded configö.yaml'
      const encodedFilename = encodeURIComponent(filename)
      const fileContent = 'This is an encoded file'
      const srvSpy = jest
        .spyOn(service, 'getFileContent')
        .mockResolvedValue(Buffer.from(fileContent, 'utf-8'))
      const response = createMockResponse(
        `${baseUrl}/configs/${configId}/files/${encodedFilename}`,
        testUser
      )

      const content = await controller.getFileContent(
        testingNamespaceId,
        configId,
        encodedFilename,
        response
      )

      expect(await streamToString(content.getStream())).toBe(fileContent)
      expect(srvSpy).toBeCalledWith(testingNamespaceId, configId, filename)
      expect(response.header).toBeCalledWith(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*="${encodedFilename}"`
      )
    })

    it('should return a NotFoundException, if the config is unknown', async () => {
      const srvSpy = jest
        .spyOn(service, 'getFileContent')
        .mockRejectedValue(new NotFoundException())
      const response = createMockResponse(
        `${baseUrl}/configs/3/files/${additionalConfigFile.filename}`,
        testUser
      )

      await expect(
        controller.getFileContent(
          testingNamespaceId,
          3,
          additionalConfigFile.filename,
          response
        )
      ).rejects.toThrow(NotFoundException)
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        3,
        additionalConfigFile.filename
      )
      expect(response.header).not.toBeCalled()
    })

    it('should return a NotFoundException, if the file is not contained in empty config', async () => {
      const srvSpy = jest
        .spyOn(service, 'getFileContent')
        .mockRejectedValue(new NotFoundException())
      const response = createMockResponse(
        `${baseUrl}/configs/1/files/${additionalConfigFile.filename}`,
        testUser
      )
      await expect(
        controller.getFileContent(
          testingNamespaceId,
          configNoFiles.id,
          additionalConfigFile.filename,
          response
        )
      ).rejects.toThrow(NotFoundException)
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configNoFiles.id,
        additionalConfigFile.filename
      )
      expect(response.header).not.toBeCalled()
    })
  })

  describe('Add file to config', () => {
    it('should add file content to a config', async () => {
      const response = createMockResponse(
        `${baseUrl}/configs/${configNoFiles.id}/files`,
        testUser
      )

      await controller.addFileToConfig(
        testingNamespaceId,
        configNoFiles.id,
        { filename: fileUploadName },
        { content: fileUploadContent },
        response
      )

      expect(service.createFile).toBeCalledWith(
        testingNamespaceId,
        configNoFiles.id,
        fileUploadName,
        fileUploadContent[0].buffer
      )
      expect(response.header).toBeCalledWith(
        'Location',
        `${mockConfigUrl}/${fileUploadName}`
      )
    })

    it('should decode the filename correctly', async () => {
      const response = createMockResponse(
        `${baseUrl}/configs/${configNoFiles.id}/files`,
        testUser
      )
      const filename = 'encoded fileö.text'
      const encodedFilename = encodeURIComponent(filename)
      await controller.addFileToConfig(
        testingNamespaceId,
        configNoFiles.id,
        { filename: filename },
        { content: fileUploadContent },
        response
      )

      expect(service.createFile).toBeCalledWith(
        testingNamespaceId,
        configNoFiles.id,
        filename,
        fileUploadContent[0].buffer
      )
      expect(response.header).toBeCalledWith(
        'Location',
        `${mockConfigUrl}/${encodedFilename}`
      )
    })

    it('should return a BadRequestException, if the filename is not valid', async () => {
      const response = createMockResponse(
        `${baseUrl}/configs/${configNoFiles.id}/files`,
        testUser
      )
      const filename = 'file with reserved characters <>?..txt'
      await expect(
        controller.addFileToConfig(
          testingNamespaceId,
          configNoFiles.id,
          { filename },
          { content: fileUploadContent },
          response
        )
      ).rejects.toThrow(BadRequestException)

      expect(service.createFile).not.toBeCalled()
      expect(response.header).not.toBeCalled()
    })

    it('should return a BadRequestException, if the filename conatains characters to avoid', async () => {
      const response = createMockResponse(
        `${baseUrl}/configs/${configNoFiles.id}/files`,
        testUser
      )
      const filename = 'file with characters to avoid \\{^}%25`]">[~<#|..txt'
      await expect(
        controller.addFileToConfig(
          testingNamespaceId,
          configNoFiles.id,
          { filename },
          { content: fileUploadContent },
          response
        )
      ).rejects.toThrow(BadRequestException)

      expect(service.createFile).not.toBeCalled()
      expect(response.header).not.toBeCalled()
    })

    it('should return a BadRequestException, if wrong data is given', async () => {
      const srvSpy = jest
        .spyOn(service, 'createFile')
        .mockRejectedValue(new BadRequestException())
      const response = createMockResponse(
        `${baseUrl}/configs/${configWithFiles.id}/files/${additionalConfigFile.filename}`,
        testUser
      )

      await expect(
        controller.addFileToConfig(
          testingNamespaceId,
          configWithFiles.id,
          { filename: fileUploadName },
          { content: fileUploadContent },
          response
        )
      ).rejects.toThrow(BadRequestException)

      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configWithFiles.id,
        fileUploadName,
        fileUploadContent[0].buffer
      )
      expect(response.header).not.toBeCalled()
    })

    it.each([
      ['xlsx as json', 'SampleProject.xlsx', 'sample.json'],
      ['xlsx as yaml', 'SampleProject.xlsx', 'sample.yaml'],
      ['json as yaml', 'SampleJSON.json', 'sample.yaml'],
      ['yaml as json', 'SampleQuestionnaire.yaml', 'sample.json'],
    ])(
      'should catch files in wrong format (%s)',
      async (test: string, originalname: string, filename: string) => {
        const response = createMockResponse(
          `${baseUrl}/configs/${configWithFiles.id}/files/${filename}`,
          testUser
        )
        const content = [
          {
            originalname,
            buffer: await readFile(`${__dirname}/testdata/${originalname}`),
          },
        ] as unknown as Express.Multer.File
        await expect(
          controller.addFileToConfig(
            testingNamespaceId,
            configWithFiles.id,
            { filename },
            { content },
            response
          )
        ).rejects.toThrow(BadRequestException)

        expect(service.createFile).not.toBeCalled()
        expect(response.header).not.toBeCalled()
      }
    )

    it('should allow to upload any file content for non yaml or json files', async () => {
      const response = createMockResponse(
        `${baseUrl}/configs/${configNoFiles.id}/files`,
        testUser
      )

      const filename = 'file.txt'
      const content = [
        {
          originalname: 'SampleJSON.json',
          buffer: await readFile(`${__dirname}/testdata/SampleJSON.json`),
        },
      ] as unknown as Express.Multer.File
      await controller.addFileToConfig(
        testingNamespaceId,
        configNoFiles.id,
        { filename: filename },
        { content },
        response
      )

      expect(service.createFile).toBeCalledWith(
        testingNamespaceId,
        configNoFiles.id,
        filename,
        content[0].buffer
      )
      expect(response.header).toBeCalledWith(
        'Location',
        `${mockConfigUrl}/${filename}`
      )
    })
  })

  describe('Update file content', () => {
    it('should update the file content of a config', async () => {
      await controller.updateFile(
        testingNamespaceId,
        configWithFiles.id,
        qgConfigFile.filename,
        { content: configUploadContent }
      )

      expect(service.updateFile).toBeCalledWith(
        testingNamespaceId,
        configWithFiles.id,
        qgConfigFile.filename,
        configUploadContent[0].buffer
      )
    })

    it('should encode the filename correctly', async () => {
      const filename = 'encoded fileö.text'
      const encodedFilename = encodeURIComponent(filename)
      await controller.updateFile(
        testingNamespaceId,
        configWithFiles.id,
        encodedFilename,
        { content: configUploadContent }
      )

      expect(service.updateFile).toBeCalledWith(
        testingNamespaceId,
        configWithFiles.id,
        filename,
        configUploadContent[0].buffer
      )
    })

    it('should throw a NotFoundException, if filename is unknown', async () => {
      const srvSpy = jest
        .spyOn(service, 'updateFile')
        .mockRejectedValue(new NotFoundException())
      await expect(
        controller.updateFile(
          testingNamespaceId,
          configWithFiles.id,
          fileUploadName,
          { content: fileUploadContent }
        )
      ).rejects.toThrow(NotFoundException)
      expect(srvSpy).toBeCalledWith(
        testingNamespaceId,
        configWithFiles.id,
        fileUploadName,
        fileUploadContent[0].buffer
      )
    })

    it.each([
      ['xlsx as json', 'SampleProject.xlsx', 'sample.json'],
      ['xlsx as yaml', 'SampleProject.xlsx', 'sample.yaml'],
      ['json as yaml', 'SampleJSON.json', 'sample.yaml'],
      ['yaml as json', 'SampleQuestionnaire.yaml', 'sample.json'],
    ])(
      'should catch files in wrong format (%s)',
      async (test: string, originalname: string, filename: string) => {
        const content = [
          {
            originalname,
            buffer: await readFile(`${__dirname}/testdata/${originalname}`),
          },
        ] as unknown as Express.Multer.File
        await expect(
          controller.updateFile(
            testingNamespaceId,
            configWithFiles.id,
            filename,
            { content }
          )
        ).rejects.toThrow(BadRequestException)

        expect(service.updateFile).not.toBeCalled()
      }
    )

    it('should allow to upload any file content for non yaml or json files', async () => {
      const filename = 'file.txt'
      const content = [
        {
          originalname: 'SampleJSON.json',
          buffer: await readFile(`${__dirname}/testdata/SampleJSON.json`),
        },
      ] as unknown as Express.Multer.File
      await controller.updateFile(
        testingNamespaceId,
        configNoFiles.id,
        filename,
        { content }
      )

      expect(service.updateFile).toBeCalledWith(
        testingNamespaceId,
        configNoFiles.id,
        filename,
        content[0].buffer
      )
    })
  })

  describe('Delete file', () => {
    it('should return properly on delete', async () => {
      await controller.deleteFile(
        testingNamespaceId,
        configWithFiles.id,
        additionalConfigFile.filename
      )

      expect(service.deleteFile).toBeCalledWith(
        testingNamespaceId,
        configWithFiles.id,
        additionalConfigFile.filename
      )
    })

    it('should encode the filename correctly', async () => {
      const filename = 'encoded fileö.text'
      const encodedFilename = encodeURIComponent(filename)
      await controller.deleteFile(
        testingNamespaceId,
        configWithFiles.id,
        encodedFilename
      )

      expect(service.deleteFile).toBeCalledWith(
        testingNamespaceId,
        configWithFiles.id,
        filename
      )
    })
  })
})

describe('ContentSizeValidator', () => {
  let validator: ContentSizeValidator
  const maxFileSizeMB = parseInt(MAX_FILE_SIZE_MB)

  beforeEach(() => {
    validator = new ContentSizeValidator({ maxSizeMB: 2 })
  })

  test.each([
    { size: maxFileSizeMB * 0.5, expected: true },
    { size: maxFileSizeMB * 1.5, expected: false },
  ])(
    'should return $expected for file size of $size MB',
    ({ size, expected }) => {
      size = size * 1024 * 1024
      const excelFileDto: ExcelSchema = {
        xlsx: [{ size }],
        config: [{ size }],
      }
      const contentFileDto: FilePatchSchema = {
        content: [{ size }],
      }
      expect(validator.isValid(excelFileDto)).toBe(expected)
      expect(validator.isValid(contentFileDto)).toBe(expected)
    }
  )

  it('should build error message correctly', () => {
    expect(validator.buildErrorMessage()).toBe(
      'The file size exceeds the maximum allowed limit of 2 MB.'
    )
  })
})

describe('FileSizeCheck', () => {
  const maxFileSize = parseInt(MAX_FILE_SIZE_MB) * 1024 * 1024
  it('should throw an error with status code 413 if the file size exceeds the maximum allowed size', async () => {
    const size = maxFileSize + 1
    const contentFileDto: FilePatchSchema = {
      content: [{ size }],
    }
    try {
      await fileSizeCheck.transform(contentFileDto)
    } catch (error) {
      expect(error.status).toBe(413)
      expect(error.message).toBe(
        'The file size exceeds the maximum allowed limit of 2 MB.'
      )
      expect(error.name).toBe('PayloadTooLargeException')
    }
  })
  it('should return the file content if the file size is within the maximum allowed size', async () => {
    const size = maxFileSize - 1
    const contentFileDto: FilePatchSchema = {
      content: [{ size }],
    }
    expect(await fileSizeCheck.transform(contentFileDto)).toBe(contentFileDto)
  })

  describe('FileFormatValidator', () => {
    let validator: FileFormatValidator
    const unicodeTestString =
      '你好, мир, hello, こんにちは, 안녕하세요, 😀, 🌍, 🧑‍💻, 🚀, 𝒜𝓁𝓅𝒽𝒶, 𝔉𝔯𝔞𝔨𝔱𝔲𝔯'

    beforeEach(() => {
      validator = new FileFormatValidator({})
    })

    test.each([
      {
        filename: 'utf8.txt',
        content: Buffer.from(unicodeTestString, 'utf-8'),
        expected: true,
      },
      {
        filename: 'utf8.txt',
        content: Buffer.from(unicodeTestString, 'utf8'),
        expected: true,
      },
      {
        filename: 'utf16le.txt',
        content: Buffer.from(unicodeTestString, 'utf16le'),
        expected: false,
      },
      {
        filename: 'ucs2.txt',
        content: Buffer.from(unicodeTestString, 'ucs2'),
        expected: false,
      },
    ])(
      'should return true for utf-8 encoded file %s',
      async ({ filename, content, expected }) => {
        const contentFileDto: FilePatchSchema = {
          content: [{ buffer: content, originalname: filename }],
        }
        const excelFileDto: ExcelSchema = {
          xlsx: [{ buffer: content, originalname: filename }],
          config: content,
        }
        expect(validator.isValid(contentFileDto)).toBe(expected)
        expect(validator.isValid(excelFileDto)).toBe(true)
      }
    )
  })
})
