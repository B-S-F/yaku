import { BadRequestException, NotFoundException } from '@nestjs/common'
import { QueryRunner } from 'typeorm'
import { parse } from 'yaml'
import {
  ConfigEntity,
  FileContentEntity,
  FileEntity,
} from '../configs/config.entity'
import { ReleaseEntity } from './release.entity'

export async function getRelease(
  queryRunner: QueryRunner,
  namespaceId: number,
  releaseId: number
): Promise<ReleaseEntity> {
  const release = await queryRunner.manager.findOne(ReleaseEntity, {
    where: {
      namespace: { id: namespaceId },
      id: releaseId,
    },
    relations: ['config', 'namespace'],
  })

  if (!release) {
    throw new NotFoundException(
      `Release not found, namespace: ${namespaceId}, release: ${releaseId}`
    )
  }

  return release
}

export async function getQgConfigFileContent(
  queryRunner: QueryRunner,
  namespaceId: number,
  releaseId: number
): Promise<object> {
  const release = await getRelease(queryRunner, namespaceId, releaseId)

  const config = await queryRunner.manager.findOne(ConfigEntity, {
    where: { namespace: { id: namespaceId }, id: release.config.id },
    relations: ['namespace'],
  })

  if (!config) {
    throw new NotFoundException(
      `Config not found, namespace: ${namespaceId}, config: ${release.config.id}`
    )
  }

  const qgConfigFile = await queryRunner.manager.findOne(FileEntity, {
    where: {
      filename: 'qg-config.yaml',
      config: { globalId: config.globalId },
    },
  })

  if (!qgConfigFile) {
    throw new NotFoundException(
      `qg-config.yaml not found in config, config: ${release.config.id}`
    )
  }

  const qgConfigFileContent = await queryRunner.manager.findOne(
    FileContentEntity,
    {
      where: { file: { id: qgConfigFile.id } },
    }
  )

  if (!qgConfigFileContent) {
    throw new NotFoundException(
      `qg-config.yaml not found in config, config: ${release.config.id}`
    )
  }

  return parse(qgConfigFileContent.content)
}

export function checkForClosed(release: ReleaseEntity): void {
  if (release.closed) {
    throw new BadRequestException(
      `Release has been closed, namespace: ${release.namespace.id}, release: ${release.id}`
    )
  }
}
