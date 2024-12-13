// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { expect } from 'vitest'
import { HttpStatus } from '@nestjs/common'
import * as supertest from 'supertest'
import { readFile } from 'fs/promises'
import { NamespaceTestEnvironment, NestTestingApp } from './nest-util'
import { Run, RunResult, RunStatus } from '../../src/namespace/run/run.entity'
import { Repository } from 'typeorm'

export async function postRun(
  testContext: {
    nestTestingApp: NestTestingApp
    testNamespace: NamespaceTestEnvironment
    apiToken: string
  },
  body: any,
): Promise<number> {
  const httpServer = await testContext.nestTestingApp.app.getHttpServer()

  const response = await supertest
    .agent(httpServer)
    .post(`/api/v1/namespaces/${testContext.testNamespace.namespace.id}/runs`)
    .send(body)
    .set('Authorization', `Bearer ${testContext.apiToken}`)
    .expect(HttpStatus.ACCEPTED)

  expect(response.body.id, `The id of created run does not exist`).toBeDefined()
  expect(
    response.headers.location.endsWith(`${response.body.id}`),
    `The location header of created run is not as expected`,
  ).toBeTruthy()
  expect(
    response.body.status,
    `The status of created run is not as expected, it is ${response.body.status}`,
  ).oneOf([RunStatus.Running, RunStatus.Pending])
  expect(
    response.body.config,
    `The config ref of created run is not as expected, it is ${response.body.config}`,
  ).match(/^.*\/namespaces\/\d+\/configs\/\d+$/)

  return response.body.id
}

export async function getRun(
  testContext: {
    nestTestingApp: NestTestingApp
    testNamespace: NamespaceTestEnvironment
    apiToken: string
  },
  runId: number,
): Promise<any> {
  return await supertest
    .agent(testContext.nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testContext.testNamespace.namespace.id}/runs/${runId}`,
    )
    .set('Authorization', `Bearer ${testContext.apiToken}`)
    .expect(HttpStatus.OK)
}

export async function awaitPendingRun(
  testContext: {
    nestTestingApp: NestTestingApp
    testNamespace: NamespaceTestEnvironment
    apiToken: string
  },
  runId: number,
): Promise<void> {
  let run = await getRun(testContext, runId)
  while (run.status === RunStatus.Pending) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    run = await getRun(testContext, runId)
  }
}

export async function completeRun(
  testContext: {
    nestTestingApp: NestTestingApp
    testNamespace: NamespaceTestEnvironment
    apiToken: string
  },
  runId: number,
  overallResult: RunResult,
) {
  await awaitPendingRun(testContext, runId)
  await getRun(testContext, runId)

  // mark run as completed
  await testContext.nestTestingApp.repositories.runRepository
    .createQueryBuilder()
    .update(Run)
    .set({
      status: RunStatus.Completed,
      overallResult: overallResult,
      completionTime: new Date(),
    })
    .where('id = :id', { id: runId })
    .execute()
}

async function createEmptyConfig(
  testContext: {
    nestTestingApp: NestTestingApp
    testNamespace: NamespaceTestEnvironment
    apiToken: string
  },
  configDto: any,
): Promise<number> {
  const createConfigResponse = await supertest
    .agent(testContext.nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testContext.testNamespace.namespace.id}/configs`,
    )
    .send(configDto)
    .set('Authorization', `Bearer ${testContext.apiToken}`)
    .set('Content-Type', 'application/json')
    .expect(HttpStatus.CREATED)
  expect(
    createConfigResponse.body,
    `The id property of the created config does not exist`,
  ).toHaveProperty('id')
  return createConfigResponse.body.id
}

async function addFilesToConfig(
  testContext: {
    nestTestingApp: NestTestingApp
    testNamespace: NamespaceTestEnvironment
    apiToken: string
  },
  configId: number,
  file: {
    filepath: string
    filename: string
    contentType: string
  },
): Promise<supertest.Test> {
  const fileContent = await readFile(file.filepath)
  return await supertest
    .agent(testContext.nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testContext.testNamespace.namespace.id}/configs/${configId}/files`,
    )
    .field('filename', file.filename)
    .attach('content', fileContent, {
      filename: file.filename,
      contentType: file.contentType,
    })
    .set('Authorization', `Bearer ${testContext.apiToken}`)
    .expect(HttpStatus.CREATED)
}

export async function createConfig(
  testContext: {
    nestTestingApp: NestTestingApp
    testNamespace: NamespaceTestEnvironment
    apiToken: string
  },
  testName: string,
  files?: {
    filepath: string
    filename: string
    contentType: string
  }[],
): Promise<number> {
  const configId: number = await createEmptyConfig(testContext, {
    name: testName,
  })

  if (files !== undefined) {
    for (const file of files) {
      await addFilesToConfig(testContext, configId, file)
    }
  }

  return configId
}

export async function checkRun(
  nestTestingApp: NestTestingApp,
  runId: number,
): Promise<void> {
  const runEntity: Run =
    await nestTestingApp.repositories.runRepository.findOneBy({
      id: runId,
    })
  expect(runEntity.id, `Run in database has not the right id`).toEqual(runId)
  expect(runEntity.status, `Run in database has not the right status`).oneOf([
    RunStatus.Running,
    RunStatus.Pending,
  ])
  expect(
    runEntity.storagePath.length,
    `Run in database does not have a storage path`,
  ).toBeDefined()
}

export async function checkRepositoryEntriesCount(
  repository: Repository<any>,
  expectedNumber: number,
): Promise<void> {
  expect(
    await repository.count(),
    `Expected ${expectedNumber} elements in database`,
  ).toBe(expectedNumber)
}

export function expectStatus(
  response: supertest.Response,
  status: number,
  context?: string,
): void {
  if (response.status !== status) {
    throw new Error(
      `Expected status ${status} but received ${
        response.status
      }${context ? ' for ' + context : ''}: ${JSON.stringify(response.body)}`,
    )
  }
}
