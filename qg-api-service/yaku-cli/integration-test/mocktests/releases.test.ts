// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from 'vitest'
import { RunProcessResult } from '../cli/process'
import { CommandFacade } from '../cli/utils'
import { Environment, EnvironmentFacade } from '../cli/environment-utils'
import { MockServer, ServerHost } from '../cli/mockserver'
import { loginMockServerResponse } from '../fixtures/login-server-response'
import * as fs from 'fs'
import { createReleasesMockServerResponse } from '../fixtures/create-releases-mock-server-response'
import { EOL } from 'os'

const testYakurc = '.yakurc-test'
const yakuCliExecutable: string = `${__dirname}/../../dist/index.js`

const cmdManager: CommandFacade = new CommandFacade(
  yakuCliExecutable,
  testYakurc
)

const envManager: EnvironmentFacade = new EnvironmentFacade(
  yakuCliExecutable,
  testYakurc
)

describe('Integration tests for releases', async () => {
  const port: number = 8080
  const serverHost: ServerHost = new ServerHost(
    'http',
    'localhost',
    String(port),
    '/api/v1'
  )

  const environment: Environment = {
    name: 'test-env',
    url: serverHost.getApiEndpoint(),
    token: Buffer.from('dummyToken', 'binary').toString('base64'),
    namespaceId: 1,
  }

  const mockServerEnvironmentOptions = loginMockServerResponse(port)
  let mockServer: MockServer | undefined

  beforeAll(async () => {
    expect(fs.existsSync(yakuCliExecutable)).to.be.true
    mockServer = new MockServer(mockServerEnvironmentOptions)
    await envManager.createEnvironment(environment)
    await mockServer?.stop()
    mockServer = undefined
  })

  afterAll(async () => {
    await envManager.deleteEnvironment(environment.name)
  })

  it('correctly calls the help command', async () => {
    const result: RunProcessResult =
      await cmdManager.runCommand('releases help')

    const expectedMessage: string[] = [
      'Usage: yaku releases|re [options] [command]',
      'Manage releases',
      'Options:',
      '  -h, --help                    display help for command',
      'Commands:',
      '  list|ls [options] [page]      List all releases',
      '  show|s <releaseId>            Show a specific release',
      '  delete [options] <releaseId>  Delete a release',
      '  help [command]                display help for command',
    ]

    const stdoutArray: string[] = result.stdout
      .split('\n')
      .filter((line) => line.length > 0)

    expect(stdoutArray).toEqual(expectedMessage)
    expect(result.stderr).toEqual('')
  })

  describe('Releases show', async () => {
    const mockServerOptions = createReleasesMockServerResponse(1, port, 1)
    let mockServer: MockServer | undefined

    beforeEach(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterEach(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should show a release', async () => {
      const result: RunProcessResult =
        await cmdManager.runCommand(`releases show 1`)

      const expectedData = {
        id: '1',
        name: 'QG4.2 Battery Management BatMax',
        approvalMode: 'one',
        approvalState: 'pending',
        createdBy: {
          id: '8cfe061c-d8f3-4c54-9546-30de72b7dc13',
          username: 'user@user.user',
          email: 'user@user.user',
          displayName: 'user@user.user user@user.user',
          firstName: 'user@user.user',
          lastName: 'user@user.user',
        },
        creationTime: '2024-09-13T10:56:45.503Z',
        lastModifiedBy: {
          id: '8cfe061c-d8f3-4c54-9546-30de72b7dc13',
          username: 'user@user.user',
          email: 'user@user.user',
          displayName: 'user@user.user user@user.user',
          firstName: 'user@user.user',
          lastName: 'user@user.user',
        },
        lastModificationTime: '2024-09-13T10:56:45.503Z',
        plannedDate: '2024-03-25T13:32:07.749Z',
        qgConfigId: 2,
        closed: false,
        lastRunId: 2,
      }

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(stdoutObject).toEqual(expectedData)
    })
  })

  describe('Releases list', async () => {
    const mockServerOptions = createReleasesMockServerResponse(1, port, 1)
    let mockServer: MockServer | undefined

    beforeEach(async () => {
      mockServer = new MockServer(mockServerOptions)
    })

    afterEach(async () => {
      await mockServer?.stop()
      mockServer = undefined
    })

    it('should list releases', async () => {
      const result: RunProcessResult =
        await cmdManager.runCommand(`releases list`)

      const expectedData = {
        pagination: {
          pageNumber: 1,
          pageSize: 20,
          totalCount: 2,
        },
        data: [
          {
            id: 1,
            name: 'QG4.2 Battery Management BatMax',
            approvalMode: 'one',
            approvalState: 'pending',
            createdBy: {
              id: '8cfe061c-d8f3-4c54-9546-30de72b7dc13',
              username: 'user@user.user',
              email: 'user@user.user',
              displayName: 'user@user.user user@user.user',
              firstName: 'user@user.user',
              lastName: 'user@user.user',
            },
            creationTime: '2024-09-13T10:56:45.503Z',
            lastModifiedBy: {
              id: '8cfe061c-d8f3-4c54-9546-30de72b7dc13',
              username: 'user@user.user',
              email: 'user@user.user',
              displayName: 'user@user.user user@user.user',
              firstName: 'user@user.user',
              lastName: 'user@user.user',
            },
            lastModificationTime: '2024-09-13T10:56:45.503Z',
            plannedDate: '2024-03-25T13:32:07.749Z',
            qgConfigId: 2,
            closed: false,
            lastRunId: 2,
          },
        ],
        links: {
          first: `${serverHost.getApiEndpoint()}/namespaces/1/releases?page=1&items=20`,
          last: `${serverHost.getApiEndpoint()}/namespaces/1/releases?page=1&items=20`,
          next: `${serverHost.getApiEndpoint()}/namespaces/1/releases?page=1&items=20`,
        },
      }

      const stdoutObject = JSON.parse(result.stdout)
      expect(result.exitCode).toEqual(0)
      expect(result.stderr).toHaveLength(0)
      expect(stdoutObject).toEqual(expectedData)
    })

    it('shows a help message for releases list', async () => {
      const result: RunProcessResult =
        await cmdManager.runCommand('releases list -h')

      const expectedMessage: string[] = [
        'Usage: yaku releases list|ls [options] [page]',
        'List all releases',
        'Arguments:',
        '  page                                     The page requested, defaults to page 1',
        'Options:',
        '  -i, --itemCount <value>                  Number of items requested per page, defaults to 20',
        '  -a, --ascending                          Revert sort order for the items',
        '  -s, --sortBy [property]                  Sort results by the given property',
        '  -f, --filterBy [property=value1,value2]  Filter values according to the given property, show only elements which have one of the given value',
        '  -h, --help                               display help for command',
      ]

      const stdoutArray: string[] = result.stdout
        .split(EOL)
        .filter((line) => line.length > 0)
      expect(stdoutArray).toEqual(expectedMessage)
      expect(result.stderr).toEqual('')
    })
  })
})
