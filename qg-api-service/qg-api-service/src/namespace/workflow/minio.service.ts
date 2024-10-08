import { streamToString } from '@B-S-F/api-commons-lib'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import * as Minio from 'minio'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import * as path from 'path'
import { Readable } from 'stream'

@Injectable()
export class BlobStoreConfig {
  constructor(readonly bucket: string) {}
}

export abstract class BlobStore {
  abstract downloadResult(
    storagePath: string,
    filename: string
  ): Promise<Readable>

  abstract fileExists(storagePath: string, filename: string): Promise<boolean>

  abstract downloadLogs(workflowName: string): Promise<string>

  abstract uploadConfig(
    storagePath: string,
    configData: { [name: string]: string }
  ): Promise<void>

  abstract removePath(subpath: string): Promise<void>

  abstract listTopLevelFolders(): Promise<string[]>
}

@Injectable()
export class MinIOStoreImpl extends BlobStore {
  @InjectPinoLogger(BlobStore.name)
  private readonly logger = new PinoLogger({
    pinoHttp: {
      level: 'trace',
      serializers: {
        req: () => undefined,
        res: () => undefined,
      },
    },
  })

  private readonly bucket: string

  constructor(
    @Inject(Minio.Client) private readonly minioClient: Minio.Client,
    @Inject(BlobStoreConfig) minioConfig: BlobStoreConfig
  ) {
    super()
    this.bucket = minioConfig.bucket
  }

  async downloadLogs(workflowName: string): Promise<string> {
    try {
      const logFile = await this.getBlobObjectMetadata(workflowName, 'main.log')
      if (!logFile) {
        return null
      }
      const stream = await this.minioClient.getObject(this.bucket, logFile.name)
      return await streamToString(stream)
    } catch (err) {
      this.logger.error({ msg: `Error while downloading log file: ${err}` })
      return null
    }
  }

  async downloadResult(
    storagePath: string,
    filename: string
  ): Promise<Readable> {
    const file = await this.getBlobObjectMetadata(storagePath, filename)
    if (!file) {
      throw new NotFoundException(`Result ${filename} not found`)
    }

    const stream = await this.minioClient.getObject(this.bucket, file.name)
    if (!stream) {
      throw new Error(`Minio returned unexpectedly null on file ${file.name}`)
    }
    return stream
  }

  async fileExists(storagePath: string, filename: string): Promise<boolean> {
    const metadata = await this.getBlobObjectMetadata(storagePath, filename)
    this.logger.trace({
      msg: `fileExists received Metadata: ${JSON.stringify(metadata)}`,
    })
    return Boolean(metadata)
  }

  async uploadConfig(
    storagePath: string,
    configData: { [filename: string]: string }
  ): Promise<void> {
    if (!storagePath?.trim()) {
      throw new Error('Upload needs a subfolder')
    }
    const promises = Object.keys(configData).map((key) => {
      return this.minioClient.putObject(
        this.bucket,
        path.join(storagePath, key),
        configData[key]
      )
    })
    await Promise.all(promises)
  }

  async removePath(subpath: string): Promise<void> {
    const items = await this.listItems(subpath, true)
    for (const item of items) {
      if (item.name) {
        await this.minioClient.removeObject(this.bucket, item.name)
      }
    }
  }

  async listTopLevelFolders(): Promise<string[]> {
    const items = await this.listItems('', false)
    return items
      .filter((item) => Boolean(item.prefix))
      .map((item) => item.prefix.split('/')[0])
  }

  private async getBlobObjectMetadata(
    folder: string,
    filename: string
  ): Promise<Minio.BucketItem> {
    if (!folder?.trim()) {
      throw new Error('MinIO path of object is not defined')
    }
    if (!filename?.trim()) {
      throw new Error('Filename of requested object is not defined')
    }

    const files = await this.listItems(folder, true)
    return (
      files.filter((file: Minio.BucketItem) =>
        file.name.endsWith(filename)
      )[0] ?? null
    )
  }

  private async listItems(
    path: string,
    recursive: boolean
  ): Promise<Minio.BucketItem[]> {
    const stream = this.minioClient.listObjectsV2(
      this.bucket,
      path,
      recursive,
      ''
    )
    if (!stream) {
      throw new Error('Unexpected return of a null stream')
    }
    const items: Minio.BucketItem[] = []
    for await (const item of stream) {
      items.push(item)
    }
    return items
  }
}
