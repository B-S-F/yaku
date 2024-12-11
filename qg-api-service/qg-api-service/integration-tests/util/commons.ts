// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { expect } from 'vitest'
import { HttpStatus } from '@nestjs/common'
import * as supertest from 'supertest'
import { readFile } from 'fs/promises'
import { NamespaceTestEnvironment, NestTestingApp } from "./nest-util"
import { Run, RunResult, RunStatus } from '../../src/namespace/run/run.entity'
import { Repository } from 'typeorm'

export async function postRun(nestTestingApp: NestTestingApp, testNamespace: NamespaceTestEnvironment, body: any, apiToken: string): Promise<number> {
  const httpServer = await nestTestingApp.app.getHttpServer()

  const response = await supertest
    .agent(httpServer)
    .post(`/api/v1/namespaces/${testNamespace.namespace.id}/runs`)
    .send(body)
    .set('Authorization', `Bearer ${apiToken}`)
    .expect(HttpStatus.ACCEPTED)

  expect(
    response.body.id,
    `The id of created run does not exist`,
  ).toBeDefined()
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

export async function getRun(nestTestingApp: NestTestingApp, testNamespace: NamespaceTestEnvironment, runId: number, apiToken: string): Promise<any> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(`/api/v1/namespaces/${testNamespace.namespace.id}/runs/${runId}`)
    .set('Authorization', `Bearer ${apiToken}`)
    .expect(HttpStatus.OK)
}

export async function awaitPendingRun(nestTestingApp: NestTestingApp, testNamespace: NamespaceTestEnvironment, runId: number, apiToken: string): Promise<void> {
  let run = await getRun(nestTestingApp, testNamespace, runId, apiToken)
  while (run.status === RunStatus.Pending) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    run = await getRun(nestTestingApp, testNamespace, runId, apiToken)
  }
}

export async function completeRun(nestTestingApp: NestTestingApp, testNamespace: NamespaceTestEnvironment, runId: number, apiToken: string, overallResult: RunResult) {
  await awaitPendingRun(nestTestingApp, testNamespace, runId, apiToken)
  await getRun(nestTestingApp, testNamespace, runId, apiToken)

  // mark run as completed
  await nestTestingApp.repositories.runRepository
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

export async function createEmptyConfig(
  nestTestingApp: NestTestingApp, 
  testNamespace: NamespaceTestEnvironment, 
  configDto: any,
  apiToken: string
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(`/api/v1/namespaces/${testNamespace.namespace.id}/configs`)
    .send(configDto)
    .set('Authorization', `Bearer ${apiToken}`)
    .set('Content-Type', 'application/json')
    .expect(HttpStatus.CREATED)
}

export async function addFilesToConfig(
  nestTestingApp: NestTestingApp, 
  testNamespace: NamespaceTestEnvironment, 
  configId: number,
  apiToken: string,
  file: {
    filepath: string
    filename: string
    contentType: string
  }
): Promise<supertest.Test> {
  const fileContent = await readFile(file.filepath)
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files`,
    )
    .field('filename', file.filename)
    .attach('content', fileContent, {
      filename: file.filename,
      contentType: file.contentType,
    })
    .set('Authorization', `Bearer ${apiToken}`)
    .expect(HttpStatus.CREATED)
}

export async function createConfigWithFiles(
  nestTestingApp: NestTestingApp, 
  testNamespace: NamespaceTestEnvironment, 
  testName: string,
  apiToken: string, 
  files: {
    filepath: string
    filename: string
    contentType: string
  }[],
): Promise<number> {
  const response = await createEmptyConfig(
    nestTestingApp, 
    testNamespace, 
    { name: testName },
    apiToken
  )
  const configId: number = response.body.id

  for (const file of files) {
    await addFilesToConfig(
      nestTestingApp, 
      testNamespace, 
      configId,
      apiToken,
      file
    )
  }
  return configId
}

export async function checkRun(nestTestingApp: NestTestingApp, runId: number): Promise<void> {
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

export async function checkRepositoryEntriesCount(repository: Repository<any>, expectedNumber: number): Promise<void> {
  expect(
    await repository.count(),
    `Expected ${expectedNumber} elements in database`,
  ).toBe(expectedNumber)
}