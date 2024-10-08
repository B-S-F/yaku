import { streamToString } from '@B-S-F/api-commons-lib'
import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { randomUUID } from 'crypto'
import * as Minio from 'minio'
import { Readable } from 'stream'
import { BlobStore, BlobStoreConfig, MinIOStoreImpl } from './minio.service'
import { LoggerModule, PinoLogger } from 'nestjs-pino'

describe('MinioService', () => {
  let service: BlobStore
  let minioClient: Minio.Client

  const bucket = 'myBucket'

  const items = [
    { prefix: undefined, name: 'some/evidence/object1' },
    { prefix: undefined, name: 'some/evidence/evidences.zip' },
    { prefix: undefined, name: 'other/main.log' },
  ]

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({})],
      providers: [
        {
          provide: BlobStore,
          useClass: MinIOStoreImpl,
        },
        {
          provide: BlobStoreConfig,
          useFactory: () => new BlobStoreConfig(bucket),
        },
        {
          provide: Minio.Client,
          useValue: {
            listObjectsV2: jest.fn(),
            getObject: jest.fn(),
            putObject: jest.fn(),
            removeObject: jest.fn(),
          } as unknown as Minio.Client,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), error: jest.fn(), trace: jest.fn() },
        },
      ],
    }).compile()

    service = module.get<BlobStore>(BlobStore)
    minioClient = module.get<Minio.Client>(Minio.Client)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('Download logs', () => {
    const filedataChunks = ['Chunk1', 'Chunk2', 'Chunk3']
    const filedata = `${filedataChunks[0]}${filedataChunks[1]}${filedataChunks[2]}`

    it('should return content of the requested file', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('other')))
        )
      minioClient.getObject = jest
        .fn()
        .mockImplementation(() => Readable.from(filedataChunks))

      const content = await service.downloadLogs('other')

      expect(content).toEqual(filedata)
      expect(minioClient.listObjectsV2).toBeCalledWith(
        bucket,
        'other',
        true,
        ''
      )
      expect(minioClient.getObject).toBeCalledWith(bucket, items[2].name)
    })

    it.each([undefined, null, '', ' \t\n'])(
      'should return null if the workflow name is not defined',
      async (workflow: string) => {
        const result = await service.downloadLogs(workflow)
        expect(result).toBeNull()
        expect(minioClient.listObjectsV2).not.toBeCalled()
        expect(minioClient.getObject).not.toBeCalled()
      }
    )

    it('should return null if the requested log is not available', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )
      const result = await service.downloadLogs('some')

      expect(result).toBeNull()
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
      expect(minioClient.getObject).not.toBeCalled()
    })

    it('should return null in case of an empty listObjects stream', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() => Readable.from([]))

      const result = await service.downloadLogs('other')

      expect(result).toBeNull()
      expect(minioClient.listObjectsV2).toBeCalledWith(
        bucket,
        'other',
        true,
        ''
      )
      expect(minioClient.getObject).not.toBeCalled()
    })

    it('should return null in case of the minio client returning null on listObjects', async () => {
      minioClient.listObjectsV2 = jest.fn().mockReturnValue(null)

      const result = await service.downloadLogs('other')

      expect(result).toBeNull()
      expect(minioClient.listObjectsV2).toBeCalledWith(
        bucket,
        'other',
        true,
        ''
      )
      expect(minioClient.getObject).not.toBeCalled()
    })

    it('should return null in case of an error thrown by the returned listObjects stream', async () => {
      minioClient.listObjectsV2 = jest.fn().mockImplementation(
        () =>
          new Readable({
            objectMode: true,
            read: () => {
              throw new Error()
            },
          })
      )

      const result = await service.downloadLogs('other')

      expect(result).toBeNull()
      expect(minioClient.listObjectsV2).toBeCalledWith(
        bucket,
        'other',
        true,
        ''
      )
      expect(minioClient.getObject).not.toBeCalled()
    })

    it('should return an empty string in case of an empty getObject stream', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('other')))
        )
      minioClient.getObject = jest
        .fn()
        .mockImplementation(() => Readable.from([]))

      const result = await service.downloadLogs('other')

      expect(result).toBe('')
      expect(minioClient.listObjectsV2).toBeCalledWith(
        bucket,
        'other',
        true,
        ''
      )
      expect(minioClient.getObject).toBeCalledWith(bucket, items[2].name)
    })

    it('should return null in case of minio client returning null on getObject', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('other')))
        )
      minioClient.getObject = jest.fn().mockResolvedValue(null)

      const result = await service.downloadLogs('other')

      expect(result).toBeNull()
      expect(minioClient.listObjectsV2).toBeCalledWith(
        bucket,
        'other',
        true,
        ''
      )
      expect(minioClient.getObject).toBeCalledWith(bucket, items[2].name)
    })

    it('should return null in case of an error thrown by the returned stream on getObject', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('other')))
        )
      minioClient.getObject = jest.fn().mockImplementation(
        () =>
          new Readable({
            read: () => {
              throw new Error()
            },
          })
      )

      const result = await service.downloadLogs('other')

      expect(result).toBeNull()
      expect(minioClient.listObjectsV2).toBeCalledWith(
        bucket,
        'other',
        true,
        ''
      )
      expect(minioClient.getObject).toBeCalledWith(bucket, items[2].name)
    })
  })

  describe('Download results', () => {
    const filedataChunks = ['Chunk1', 'Chunk2', 'Chunk3']
    const filedata = `${filedataChunks[0]}${filedataChunks[1]}${filedataChunks[2]}`

    it('should return content of the requested file', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )
      minioClient.getObject = jest
        .fn()
        .mockImplementation(() => Readable.from(filedataChunks))

      const content = service.downloadResult('some', 'object1')

      expect(await content.then((data) => streamToString(data))).toEqual(
        filedata
      )
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
      expect(minioClient.getObject).toBeCalledWith(bucket, items[0].name)
    })

    it('should return the content of an evidences.zip file', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )
      minioClient.getObject = jest
        .fn()
        .mockImplementation(() => Readable.from(filedataChunks))

      const content = service.downloadResult('some', 'evidences.zip')

      expect(await content.then((data) => streamToString(data))).toEqual(
        filedata
      )
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
      expect(minioClient.getObject).toBeCalledWith(bucket, items[1].name)
    })

    it.each([undefined, null, '', ' \t\n'])(
      'should return BadRequest if the storage path is not defined',
      async (path: string) => {
        await expect(service.downloadResult(path, 'object1')).rejects.toThrow(
          Error
        )
        expect(minioClient.listObjectsV2).not.toBeCalled()
        expect(minioClient.getObject).not.toBeCalled()
      }
    )

    it.each([undefined, null, '', ' \t\n'])(
      'should return BadRequest if the filename is not defined',
      async (filename: string) => {
        await expect(service.downloadResult('some', filename)).rejects.toThrow(
          Error
        )
        expect(minioClient.listObjectsV2).not.toBeCalled()
        expect(minioClient.getObject).not.toBeCalled()
      }
    )

    it('should return NotFound if the requested file is not available', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )

      await expect(service.downloadResult('some', 'main.log')).rejects.toThrow(
        NotFoundException
      )

      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
      expect(minioClient.getObject).not.toBeCalled()
    })

    it('should handle the case with an empty listObjects stream gracefully', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() => Readable.from([]))

      await expect(service.downloadResult('some', 'object1')).rejects.toThrow(
        NotFoundException
      )
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
    })

    it('should throw an error in case of minio client returning null on listObjects', async () => {
      minioClient.listObjectsV2 = jest.fn().mockReturnValue(null)

      await expect(service.downloadResult('some', 'object1')).rejects.toThrow()
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
    })

    it('should forward an error thrown by the returned listObjects stream', async () => {
      minioClient.listObjectsV2 = jest.fn().mockImplementation(
        () =>
          new Readable({
            objectMode: true,
            read: () => {
              throw new Error()
            },
          })
      )

      await expect(service.downloadResult('some', 'object1')).rejects.toThrow()
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
    })

    it('should handle the case with an empty getObject stream gracefully', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )
      minioClient.getObject = jest
        .fn()
        .mockImplementation(() => Readable.from([]))

      const result = service.downloadResult('some', 'object1')

      expect(await result.then((data) => streamToString(data))).toBe('')
      expect(minioClient.getObject).toBeCalledWith(bucket, items[0].name)
    })

    it('should throw an error in case of minio client returning null on getObject', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )
      minioClient.getObject = jest.fn().mockResolvedValue(null)

      await expect(service.downloadResult('some', 'object1')).rejects.toThrow()
      expect(minioClient.getObject).toBeCalledWith(bucket, items[0].name)
    })
  })

  describe('File exists', () => {
    it('should return true for an existing file', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )

      const exists = await service.fileExists('some', 'object1')

      expect(exists).toBe(true)
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
    })

    it('should return false if the questioned file is not available', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )

      const exists = await service.fileExists('some', 'main.log')

      expect(exists).toBe(false)
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
    })

    it('should handle the case with an empty listObjects stream gracefully', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() => Readable.from([]))

      const exists = await service.fileExists('some', 'object1')

      expect(exists).toBe(false)
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
    })

    it.each([undefined, null, '', ' \t\n'])(
      'should return BadRequest if the storage path is not defined',
      async (path: string) => {
        await expect(service.fileExists(path, 'object1')).rejects.toThrow(Error)
        expect(minioClient.listObjectsV2).not.toBeCalled()
      }
    )

    it.each([undefined, null, '', ' \t\n'])(
      'should return BadRequest if the filename is not defined',
      async (filename: string) => {
        await expect(service.fileExists('some', filename)).rejects.toThrow(
          Error
        )
        expect(minioClient.listObjectsV2).not.toBeCalled()
      }
    )

    it('should throw an error in case of minio client returning null on listObjects', async () => {
      minioClient.listObjectsV2 = jest.fn().mockReturnValue(null)

      await expect(service.fileExists('some', 'object1')).rejects.toThrow()
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
    })

    it('should forward an error thrown by the returned listObjects stream', async () => {
      minioClient.listObjectsV2 = jest.fn().mockImplementation(
        () =>
          new Readable({
            objectMode: true,
            read: () => {
              throw new Error()
            },
          })
      )

      await expect(service.fileExists('some', 'object1')).rejects.toThrow()
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
    })
  })

  describe('Upload configs', () => {
    const configData = {
      file1: 'Content of file1',
      file2: 'Content of file2',
    }

    it('should upload files to blob store', async () => {
      const storagePath = randomUUID()
      minioClient.putObject = jest.fn().mockResolvedValue({})
      await service.uploadConfig(storagePath, configData)

      expect(minioClient.putObject).toBeCalledTimes(2)
      expect(minioClient.putObject).toBeCalledWith(
        bucket,
        `${storagePath}/file1`,
        configData['file1']
      )
      expect(minioClient.putObject).toBeCalledWith(
        bucket,
        `${storagePath}/file2`,
        configData['file2']
      )
    })

    it.each([undefined, null, '', ' \t\n'])(
      'should not upload anything, if storage path is undefined',
      async (path: string) => {
        await expect(service.uploadConfig(path, configData)).rejects.toThrow(
          Error
        )
        expect(minioClient.putObject).not.toBeCalled()
      }
    )

    it('should not do anything, if an empty list of data is provided', async () => {
      const storagePath = randomUUID()
      await service.uploadConfig(storagePath, {})
      expect(minioClient.putObject).not.toBeCalled()
    })
  })

  describe('Remove object', () => {
    it('should remove all objects from the blob store', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(items.filter((item) => item.name.startsWith('some')))
        )

      await service.removePath('some')

      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, 'some', true, '')
      expect(minioClient.removeObject).toBeCalledWith(bucket, items[0].name)
      expect(minioClient.removeObject).toBeCalledWith(bucket, items[1].name)
    })

    it('should not do anything, if the item name is undefined', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() => Readable.from([{ prefix: 'some' }]))

      await service.removePath('some')

      expect(minioClient.removeObject).not.toBeCalled()
    })

    it('should forward exeptions happened by calling the blob store client', async () => {
      minioClient.removeObject = jest.fn().mockRejectedValue(new Error())

      await expect(service.removePath('some')).rejects.toThrow()
    })
  })

  describe('List top level items', () => {
    it('should return a list folder names', async () => {
      const items = [
        { prefix: 'some/', name: undefined },
        { prefix: 'some/', name: undefined },
        { prefix: 'other/', name: undefined },
      ]

      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() =>
          Readable.from(
            items.reduce(
              (uniqueList, item) =>
                uniqueList.map((pItem) => pItem.prefix).includes(item.prefix)
                  ? uniqueList
                  : [...uniqueList, item],
              []
            )
          )
        )

      const list = await service.listTopLevelFolders()

      expect(list.length).toBe(2)
      expect(list).toContainEqual('some')
      expect(list).toContainEqual('other')
      expect(minioClient.listObjectsV2).toBeCalledWith(bucket, '', false, '')
    })

    it('should handle the case with an empty stream gracefully', async () => {
      minioClient.listObjectsV2 = jest
        .fn()
        .mockImplementation(() => Readable.from([]))

      const list = await service.listTopLevelFolders()

      expect(list.length).toBe(0)
    })

    it('should throw an error in case of minio client returning null', async () => {
      minioClient.listObjectsV2 = jest.fn().mockReturnValue(null)

      await expect(service.listTopLevelFolders()).rejects.toThrow()
    })

    it('should forward an error thrown by the returned stream', async () => {
      minioClient.listObjectsV2 = jest.fn().mockImplementation(
        () =>
          new Readable({
            objectMode: true,
            read: () => {
              throw new Error()
            },
          })
      )

      await expect(service.listTopLevelFolders()).rejects.toThrow()
    })
  })
})
