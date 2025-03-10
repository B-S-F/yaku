// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { HttpStatus } from '@nestjs/common'
import { readFile } from 'fs/promises'
import { SetupServer, setupServer } from 'msw/node'
import path from 'path'
import { ENABLE_TASKS_CONTROLLER } from 'src/config'
import {
  AddApproverDto,
  UpdateApprovalDto,
} from 'src/namespace/releases/approvals/approvals.util'
import { ReminderMode } from 'src/namespace/releases/tasks/tasks.entity'
import {
  AddRemoveAssigneesDto,
  AddTaskDto,
} from 'src/namespace/releases/tasks/tasks.utils'
import { Readable } from 'stream'
import * as supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MailingService } from '../src/mailing/mailing.service'
import { NotificationType } from '../src/mailing/mailing.utils'
import {
  AddCommentDto,
  ReferenceType,
  UpdateCommentDto,
} from '../src/namespace/releases/comments/comments.utils'
import { ApprovalMode } from '../src/namespace/releases/release.entity'
import { AddReleaseDto } from '../src/namespace/releases/releases.utils'
import { RunResult } from '../src/namespace/run/run.entity'
import { SecretStorage } from '../src/namespace/secret/secret-storage.service'
import { SubscriptionPostDto } from '../src/namespace/subscriptions/subscription.dto'
import {
  BlobStore,
  MinIOStoreImpl,
} from '../src/namespace/workflow/minio.service'
import { UpdateUserProfileDto } from '../src/user/user-profile/dto/update-user-profile.dto'
import { handlers } from './mocks/handlers'
import { MailingServiceMock } from './mocks/mailing'
import {
  NamespaceTestEnvironment,
  NestTestingApp,
  NestUtil,
  checkRun,
  completeRun,
  createConfig,
  expectStatus,
  postRun,
} from './util'

describe('Notifications', () => {
  let nestTestingApp: NestTestingApp
  let allRequests: Request[] = []
  let server: SetupServer

  let apiToken: string
  let testNamespace: NamespaceTestEnvironment
  const testName = 'Notification (Integration Test)'
  const testFilename = 'qg-config.yaml'
  const testContentType = 'application/yaml'
  let testContext

  beforeEach(async () => {
    const nestUtil = new NestUtil()
    nestTestingApp = await nestUtil.startNestApplication()
    const databaseContent = await nestUtil.initDatabaseContent()
    testNamespace = databaseContent.testNamespace
    apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[0])

    server = setupServer(...handlers)
    server.listen()
    allRequests = []
    server.events.on('request:start', ({ request }) => {
      console.log('MSW attached:')
      const url = new URL(request.url)
      if (!url.host.match(/localhost|127\.0\.0\.1/)) {
        allRequests.push(request)
      }
    })

    vi.spyOn(
      nestTestingApp.testingModule.get<SecretStorage>(SecretStorage),
      'getSecrets',
    ).mockImplementation(() => Promise.resolve({}))
    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'uploadPayload',
    ).mockImplementation(() => {
      return Promise.resolve()
    })
    vi.spyOn(
      nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
      'fileExists',
    ).mockImplementation(() => Promise.resolve(true))

    testContext = {
      nestTestingApp: nestTestingApp,
      testNamespace: testNamespace,
      apiToken: apiToken,
    }
  })

  afterEach(async () => {
    server.close()
    await nestTestingApp.app.close()
    vi.resetAllMocks()
  })

  describe('Comments with mentions', () => {
    it('should notify mentions and subscribers when %s comment is created', async () => {
      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml',
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
      ).mockImplementation(async (): Promise<Readable> => {
        const buffer = await readFile(resultFile)
        const readableStream = new Readable({
          read() {
            this.push(buffer, 'utf-8')
            this.push(null)
          },
        })

        return Promise.resolve(readableStream)
      })

      // set acting user
      apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[0])

      // create config + run
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      // create release
      const createReleaseDto = {
        name: 'Test release',
        plannedDate: new Date('2024-03-25T13:32:07.749Z'),
        qgConfigId: body.configId,
        approvalMode: 'one' as ApprovalMode,
      }
      const createResponseDto = await createRelease(createReleaseDto)
      const releaseId = createResponseDto.body.id

      // create comment
      const createCommentDto = {
        todo: false,
        content:
          '@b95b1ccc-64ac-42b0-acfc-ddd866d09659 @user2@bosch.com @ffffffff-64ac-42b0-acfc-ddd866d09659 @does@not.exist',
        reference: {
          type: ReferenceType.RELEASE,
        },
      }
      const addCommentResponse = await addComment(releaseId, createCommentDto)
      expectStatus(addCommentResponse, HttpStatus.CREATED, 'addComment')
      expect(addCommentResponse.body.content).toBe(
        '@user1@bosch.com @user2@bosch.com @DELETED_USER @does@not.exist',
      )
    })
  })

  describe('Comments', () => {
    const mentionsApprovalReleaseTitle =
      'You have been mentioned in a comment related to a release approval'
    const mentionsCheckTitle =
      'You have been mentioned in a comment related to a check'
    const participantsTitle = 'A new comment was added to your discussion'

    it.each([
      [
        'ReferenceType.CHECK',
        {
          actingUserId: 0,
          subscribersId: [5],
          noEmailNotificationsId: [1],
          comment: {
            reference: {
              type: ReferenceType.CHECK,
              chapter: '1',
              requirement: '1',
              check: '1',
            },
            content: `@user0@bosch.com creates new check comment mentioning @user1@bosch.com, @user2@bosch.com and @user3@bosch.com`,
            todo: false,
          },
          expectedCalls: [
            [
              'user5@bosch.com',
              participantsTitle,
              {
                type: NotificationType.Comment,
              },
            ],
            [
              'user2@bosch.com',
              mentionsCheckTitle,
              {
                type: NotificationType.Mention,
              },
            ],
            [
              'user3@bosch.com',
              mentionsCheckTitle,
              {
                type: NotificationType.Mention,
              },
            ],
          ],
        },
      ],
      [
        'ReferenceType.RELEASE',
        {
          actingUserId: 3,
          subscribersId: [5],
          noEmailNotificationsId: [1],
          comment: {
            reference: {
              type: ReferenceType.RELEASE,
            },
            content: `@user3@bosch.com creates release comment and mentions @user2@bosch.com`,
            todo: false,
          },
          expectedCalls: [
            [
              'user5@bosch.com',
              participantsTitle,
              {
                type: NotificationType.CommentApprovalRelease,
              },
            ],
            [
              'user2@bosch.com',
              mentionsApprovalReleaseTitle,
              {
                type: NotificationType.MentionApprovalRelease,
              },
            ],
          ],
        },
      ],
    ])(
      'should notify mentions and subscribers when %s comment is created',
      async (_, input) => {
        const configFile = path.join(
          __dirname,
          'mocks',
          'qg-config-10-findings-red-status.yaml',
        )
        const resultFile = path.join(
          __dirname,
          'mocks',
          'qg-result-10-findings-red-status.yaml',
        )
        vi.spyOn(
          nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
          'downloadResult',
        ).mockImplementation(async (): Promise<Readable> => {
          const buffer = await readFile(resultFile)
          const readableStream = new Readable({
            read() {
              this.push(buffer, 'utf-8')
              this.push(null)
            },
          })

          return Promise.resolve(readableStream)
        })

        // turn off email notifications for users
        for (const userId of input.noEmailNotificationsId) {
          apiToken = await nestTestingApp.utils.getUserToken(
            testNamespace.users[userId],
          )
          await updateUserPofile({
            emailNotifications: false,
            editor: 'code',
          } as UpdateUserProfileDto)
        }

        // set acting user
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[input.actingUserId],
        )

        // create config + run
        const body = {
          configId: await createConfig(testContext, testName, [
            {
              filepath: configFile,
              filename: testFilename,
              contentType: testContentType,
            },
          ]),
        }

        const runId = await postRun(testContext, body)
        await checkRun(nestTestingApp, runId)

        await completeRun(testContext, runId, RunResult.Red)

        // create release
        const createReleaseDto = {
          name: 'Test release',
          plannedDate: new Date('2024-03-25T13:32:07.749Z'),
          qgConfigId: body.configId,
          approvalMode: 'one' as ApprovalMode,
        }
        const createResponseDto = await createRelease(createReleaseDto)
        const releaseId = createResponseDto.body.id

        // subscribe users to release
        for (const userId of input.subscribersId) {
          apiToken = await nestTestingApp.utils.getUserToken(
            testNamespace.users[userId],
          )
          await subscribeToRelease({
            releaseId,
            operation: 'subscribe',
          } as SubscriptionPostDto)
        }

        // change back to acting user
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[input.actingUserId],
        )

        // set spy
        const mailSpy = vi.spyOn(
          nestTestingApp.testingModule.get<MailingServiceMock>(MailingService),
          'pushNotification',
        )

        // create comment
        const addCommentResponse = await addComment(releaseId, input.comment)
        expectStatus(addCommentResponse, HttpStatus.CREATED, 'addComment')

        // assert notifications
        expect(mailSpy).toHaveBeenCalledTimes(input.expectedCalls.length)
        for (let i = 0; i < mailSpy.mock.calls.length; i++) {
          // recipient
          expect(mailSpy.mock.calls[i][0]).toEqual(input.expectedCalls[i][0])
          // notification title
          expect(mailSpy.mock.calls[i][1]).toEqual(input.expectedCalls[i][1])
          // notification type
          expect(mailSpy.mock.calls[i][2]).toEqual(
            expect.objectContaining(input.expectedCalls[i][2]),
          )
        }
      },
    )

    it.each([
      [
        'ReferenceType.CHECK',
        {
          actingUserId: 0,
          subscribersId: [5],
          noEmailNotificationsId: [1],
          createComment: {
            reference: {
              type: ReferenceType.CHECK,
              chapter: '1',
              requirement: '1',
              check: '1',
            },
            content: `@user0@bosch.com creates new check comment mentioning @user1@bosch.com, @user2@bosch.com and @user3@bosch.com`,
            todo: false,
          },
          updateComment: {
            content: `@user0@bosch.com edits check comment mentioning @user1@bosch.com, @user2@bosch.com and also @user4@bosch.com`,
          },
          expectedCalls: [
            [
              'user4@bosch.com',
              mentionsCheckTitle,
              {
                type: NotificationType.Mention,
              },
            ],
          ],
        },
      ],
      [
        'RefrenceType.RELEASE',
        {
          actingUserId: 3,
          subscribersId: [5],
          noEmailNotificationsId: [1],
          createComment: {
            reference: {
              type: ReferenceType.RELEASE,
            },
            content:
              '@user3@bosch.com creates release comment and mentions @user2@bosch.com',
            todo: false,
          },
          updateComment: {
            content:
              '@tuser3@bosch.com edits release comment and mentions @user4@bosch.com',
          },
          expectedCalls: [
            [
              'user4@bosch.com',
              mentionsApprovalReleaseTitle,
              {
                type: NotificationType.MentionApprovalRelease,
              },
            ],
          ],
        },
      ],
    ])(
      'should notify new mentions when %s comment is edited',
      async (_, input) => {
        const configFile = path.join(
          __dirname,
          'mocks',
          'qg-config-10-findings-red-status.yaml',
        )
        const resultFile = path.join(
          __dirname,
          'mocks',
          'qg-result-10-findings-red-status.yaml',
        )
        vi.spyOn(
          nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
          'downloadResult',
        ).mockImplementation(async (): Promise<Readable> => {
          const buffer = await readFile(resultFile)
          const readableStream = new Readable({
            read() {
              this.push(buffer, 'utf-8')
              this.push(null)
            },
          })

          return Promise.resolve(readableStream)
        })

        // turn off email notifications for users
        for (const userId of input.noEmailNotificationsId) {
          apiToken = await nestTestingApp.utils.getUserToken(
            testNamespace.users[userId],
          )
          await updateUserPofile({
            emailNotifications: false,
            editor: 'code',
          } as UpdateUserProfileDto)
        }

        // set acting user
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[input.actingUserId],
        )

        // create config + run
        const body = {
          configId: await createConfig(testContext, testName, [
            {
              filepath: configFile,
              filename: testFilename,
              contentType: testContentType,
            },
          ]),
        }

        const runId = await postRun(testContext, body)
        await checkRun(nestTestingApp, runId)

        await completeRun(testContext, runId, RunResult.Red)

        // create release
        const createReleaseDto = {
          name: 'Test release',
          plannedDate: new Date('2024-03-25T13:32:07.749Z'),
          qgConfigId: body.configId,
          approvalMode: 'one' as ApprovalMode,
        }
        const createResponseDto = await createRelease(createReleaseDto)
        const releaseId = createResponseDto.body.id

        // subscribe users to release
        for (const userId of input.subscribersId) {
          apiToken = await nestTestingApp.utils.getUserToken(
            testNamespace.users[userId],
          )
          await subscribeToRelease({
            releaseId,
            operation: 'subscribe',
          } as SubscriptionPostDto)
        }

        // change back to acting user
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[input.actingUserId],
        )

        // create initial comment
        const addCommentResponse = await addComment(
          releaseId,
          input.createComment,
        )
        expectStatus(addCommentResponse, HttpStatus.CREATED, 'addComment')

        // set spy
        const mailSpy = vi.spyOn(
          nestTestingApp.testingModule.get<MailingServiceMock>(MailingService),
          'pushNotification',
        )

        // edit comment
        const updateCommentResponse = await updateComment(
          releaseId,
          addCommentResponse.body.id,
          input.updateComment,
        )
        expectStatus(updateCommentResponse, HttpStatus.OK, 'addComment')

        // assert notifications
        expect(mailSpy).toHaveBeenCalledTimes(input.expectedCalls.length)
        for (let i = 0; i < mailSpy.mock.calls.length; i++) {
          // recipient
          expect(mailSpy.mock.calls[i][0]).toEqual(input.expectedCalls[i][0])
          // notification title
          expect(mailSpy.mock.calls[i][1]).toEqual(input.expectedCalls[i][1])
          // notification type
          expect(mailSpy.mock.calls[i][2]).toEqual(
            expect.objectContaining(input.expectedCalls[i][2]),
          )
        }
      },
    )

    it.each([
      [
        'ReferenceType.CHECK',
        {
          actingUserId: [0, 2, 1],
          subscribersId: [5],
          noEmailNotificationsId: [1],
          createComment: {
            reference: {
              type: ReferenceType.CHECK,
              chapter: '1',
              requirement: '1',
              check: '1',
            },
            content:
              '@user0@bosch.com creates new check comment mentioning @user1@bosch.com, @user2@bosch.com and @user3@bosch.com',
            todo: false,
          },
          firstReplyComment: {
            reference: {
              type: ReferenceType.COMMENT,
            },
            content:
              '@user2@bosch.com replies to check comment and mentions @user3@bosch.com',
            todo: false,
          },
          secondReplyComment: {
            reference: {
              type: ReferenceType.COMMENT,
            },
            content:
              '@user1@bosch.com replies to check comment and mentions @user4@bosch.com',
            todo: false,
          },
          expectedCalls: [
            [
              'user0@bosch.com',
              participantsTitle,
              {
                type: NotificationType.Comment,
              },
            ],
            [
              'user5@bosch.com',
              participantsTitle,
              {
                type: NotificationType.Comment,
              },
            ],
            [
              'user3@bosch.com',
              mentionsCheckTitle,
              {
                type: NotificationType.Mention,
              },
            ],
            [
              'user0@bosch.com',
              participantsTitle,
              {
                type: NotificationType.Comment,
              },
            ],
            [
              'user2@bosch.com',
              participantsTitle,
              {
                type: NotificationType.Comment,
              },
            ],
            [
              'user5@bosch.com',
              participantsTitle,
              {
                type: NotificationType.Comment,
              },
            ],
            [
              'user4@bosch.com',
              mentionsCheckTitle,
              {
                type: NotificationType.Mention,
              },
            ],
          ],
        },
      ],
      [
        'RefrenceType.RELEASE',
        {
          actingUserId: [3, 4, 1],
          subscribersId: [5],
          noEmailNotificationsId: [1],
          createComment: {
            reference: {
              type: ReferenceType.RELEASE,
            },
            content:
              '@user3@bosch.com creates release comment and mentions @user2@bosch.com',
            todo: false,
          },
          firstReplyComment: {
            reference: {
              type: ReferenceType.COMMENT,
            },
            content:
              '@user4@bosch.com replies to release comment and mentions @user0@bosch.com',
            todo: false,
          },
          secondReplyComment: {
            reference: {
              type: ReferenceType.COMMENT,
            },
            content:
              '@user1@bosch.com replies to release comment and mentions @user0@bosch.com',
            todo: false,
          },
          expectedCalls: [
            [
              'user3@bosch.com',
              participantsTitle,
              {
                type: NotificationType.CommentApprovalRelease,
              },
            ],
            [
              'user5@bosch.com',
              participantsTitle,
              {
                type: NotificationType.CommentApprovalRelease,
              },
            ],
            [
              'user0@bosch.com',
              mentionsApprovalReleaseTitle,
              {
                type: NotificationType.MentionApprovalRelease,
              },
            ],
            [
              'user3@bosch.com',
              participantsTitle,
              {
                type: NotificationType.CommentApprovalRelease,
              },
            ],
            [
              'user4@bosch.com',
              participantsTitle,
              {
                type: NotificationType.CommentApprovalRelease,
              },
            ],
            [
              'user5@bosch.com',
              participantsTitle,
              {
                type: NotificationType.CommentApprovalRelease,
              },
            ],
            [
              'user0@bosch.com',
              mentionsApprovalReleaseTitle,
              {
                type: NotificationType.MentionApprovalRelease,
              },
            ],
          ],
        },
      ],
    ])(
      'should notify mentions, participants and subscribers when replying to %s comment',
      async (_, input) => {
        const configFile = path.join(
          __dirname,
          'mocks',
          'qg-config-10-findings-red-status.yaml',
        )
        const resultFile = path.join(
          __dirname,
          'mocks',
          'qg-result-10-findings-red-status.yaml',
        )
        vi.spyOn(
          nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
          'downloadResult',
        ).mockImplementation(async (): Promise<Readable> => {
          const buffer = await readFile(resultFile)
          const readableStream = new Readable({
            read() {
              this.push(buffer, 'utf-8')
              this.push(null)
            },
          })

          return Promise.resolve(readableStream)
        })

        // turn off email notifications for users
        for (const userId of input.noEmailNotificationsId) {
          apiToken = await nestTestingApp.utils.getUserToken(
            testNamespace.users[userId],
          )
          await updateUserPofile({
            emailNotifications: false,
            editor: 'code',
          } as UpdateUserProfileDto)
        }

        // set initial acting user
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[input.actingUserId[0]],
        )

        // create config + run
        const body = {
          configId: await createConfig(testContext, testName, [
            {
              filepath: configFile,
              filename: testFilename,
              contentType: testContentType,
            },
          ]),
        }

        const runId = await postRun(testContext, body)
        await checkRun(nestTestingApp, runId)

        await completeRun(testContext, runId, RunResult.Red)

        // create release
        const createReleaseDto = {
          name: 'Test release',
          plannedDate: new Date('2024-03-25T13:32:07.749Z'),
          qgConfigId: body.configId,
          approvalMode: 'one' as ApprovalMode,
        }
        const createResponseDto = await createRelease(createReleaseDto)
        const releaseId = createResponseDto.body.id

        // subscribe users to release
        for (const userId of input.subscribersId) {
          apiToken = await nestTestingApp.utils.getUserToken(
            testNamespace.users[userId],
          )
          await subscribeToRelease({
            releaseId,
            operation: 'subscribe',
          } as SubscriptionPostDto)
        }

        // change back to inital acting user
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[input.actingUserId[0]],
        )

        // create initial comment
        const addCommentResponse = await addComment(
          releaseId,
          input.createComment,
        )
        expectStatus(addCommentResponse, HttpStatus.CREATED, 'addComment')

        // set spy
        const mailSpy = vi.spyOn(
          nestTestingApp.testingModule.get<MailingServiceMock>(MailingService),
          'pushNotification',
        )

        // set acting user for first reply comment
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[input.actingUserId[1]],
        )

        // first reply to comment
        let replyCommentResponse = await addComment(releaseId, {
          ...input.firstReplyComment,
          reference: {
            ...input.firstReplyComment.reference,
            id: addCommentResponse.body.id,
          },
        })
        expectStatus(replyCommentResponse, HttpStatus.CREATED, 'addComment')

        // set acting user for second reply comment
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[input.actingUserId[2]],
        )

        // second reply to comment
        replyCommentResponse = await addComment(releaseId, {
          ...input.secondReplyComment,
          reference: {
            ...input.secondReplyComment.reference,
            id: addCommentResponse.body.id,
          },
        })
        expectStatus(replyCommentResponse, HttpStatus.CREATED, 'addComment')

        // assert notifications
        expect(mailSpy).toHaveBeenCalledTimes(input.expectedCalls.length)
        for (let i = 0; i < mailSpy.mock.calls.length; i++) {
          // recipient
          expect(mailSpy.mock.calls[i][0]).toEqual(input.expectedCalls[i][0])
          // notification title
          expect(mailSpy.mock.calls[i][1]).toEqual(input.expectedCalls[i][1])
          // notification type
          expect(mailSpy.mock.calls[i][2]).toEqual(
            expect.objectContaining(input.expectedCalls[i][2]),
          )
        }
      },
    )
    it.skipIf(ENABLE_TASKS_CONTROLLER != 'true')(
      'should notify assignees recurring when a task is assigned to them',
      async () => {
        const configFile = path.join(
          __dirname,
          'mocks',
          'qg-config-10-findings-red-status.yaml',
        )
        const resultFile = path.join(
          __dirname,
          'mocks',
          'qg-result-10-findings-red-status.yaml',
        )
        vi.spyOn(
          nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
          'downloadResult',
        ).mockImplementation(async (): Promise<Readable> => {
          const buffer = await readFile(resultFile)
          const readableStream = new Readable({
            read() {
              this.push(buffer, 'utf-8')
              this.push(null)
            },
          })

          return Promise.resolve(readableStream)
        })

        // set initial acting user
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[0],
        )
        // create config + run
        const body = {
          configId: await createConfig(testContext, testName, [
            {
              filepath: configFile,
              filename: testFilename,
              contentType: testContentType,
            },
          ]),
        }

        const runId = await postRun(testContext, body)
        await checkRun(nestTestingApp, runId)

        await completeRun(testContext, runId, RunResult.Red)

        // create release
        const createReleaseDto = {
          name: 'Test release',
          plannedDate: new Date('2024-03-25T13:32:07.749Z'),
          qgConfigId: body.configId,
          approvalMode: 'one' as ApprovalMode,
        }
        const createResponseDto = await createRelease(createReleaseDto)
        const releaseId = createResponseDto.body.id

        // set spy
        const mailSpy = vi.spyOn(
          nestTestingApp.testingModule.get<MailingServiceMock>(MailingService),
          'pushNotification',
        )

        // create task
        const createTaskDto: AddTaskDto = {
          title: 'Test Task',
          description: 'Test Task Description',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
          reminder: ReminderMode.ALWAYS,
        }
        const createTaskResponse = await createTask(releaseId, createTaskDto)
        expectStatus(createTaskResponse, HttpStatus.CREATED, 'createTask')

        // assign task to user
        const assignee = testNamespace.users[1]
        const assignToTaskResponse = await addAssignees(
          releaseId,
          createTaskResponse.body.id,
          {
            assignees: [assignee.id],
          },
        )
        expectStatus(assignToTaskResponse, HttpStatus.OK, 'addAssignees')

        // assert notifications
        expect(mailSpy).toHaveBeenCalledTimes(1)
        // recipient
        expect(mailSpy.mock.calls[0][0]).toEqual(assignee.email)
        // notification title
        expect(mailSpy.mock.calls[0][1]).toEqual('Task Assigned')
        // notification type
        expect(mailSpy.mock.calls[0][2]).toEqual(
          expect.objectContaining({
            type: NotificationType.TaskAssigned,
          }),
        )

        /* Additional manual test steps executed:
         * 5. wait for the reminderTask to be executed
         * 6. Check if the user received a notification
         * 7. close the task
         * 8. Check if the user received a notification -> should not
         */
      },
    )
  })

  describe('Approvals', () => {
    const updatedAprovalStateTitle =
      'The approval status of a release you are subscribed to has changed'
    const addedAsApproverTitle =
      'You have been selected as an approver for a release'

    it('should notify subscribers when ApprovalState has changed', async () => {
      const actingUserId = 0
      const subscribersId = [5]
      const approversId = [1, 2]
      const noEmailNotificationsId = [1]

      const expectedCalls = [
        // approval of release notifications
        [
          'user5@bosch.com',
          updatedAprovalStateTitle,
          {
            type: NotificationType.ApprovalState,
          },
        ],
        [
          'user2@bosch.com',
          updatedAprovalStateTitle,
          {
            type: NotificationType.ApprovalState,
          },
        ],
        // reset approval of release notifications
        [
          'user5@bosch.com',
          updatedAprovalStateTitle,
          {
            type: NotificationType.ApprovalState,
          },
        ],
        [
          'user2@bosch.com',
          updatedAprovalStateTitle,
          {
            type: NotificationType.ApprovalState,
          },
        ],
      ]

      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml',
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
      ).mockImplementation(async (): Promise<Readable> => {
        const buffer = await readFile(resultFile)
        const readableStream = new Readable({
          read() {
            this.push(buffer, 'utf-8')
            this.push(null)
          },
        })

        return Promise.resolve(readableStream)
      })

      // turn off email notifications for users
      for (const userId of noEmailNotificationsId) {
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[userId],
        )
        await updateUserPofile({
          emailNotifications: false,
          editor: 'code',
        } as UpdateUserProfileDto)
      }

      // set acting user
      apiToken = await nestTestingApp.utils.getUserToken(
        testNamespace.users[actingUserId],
      )

      // create config + run
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      const runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)

      // create release
      const createReleaseDto = {
        name: 'Test release',
        plannedDate: new Date('2024-03-25T13:32:07.749Z'),
        qgConfigId: body.configId,
        approvalMode: 'one' as ApprovalMode,
      }
      const createResponseDto = await createRelease(createReleaseDto)
      const releaseId = createResponseDto.body.id

      // subscribe users to release
      for (const userId of subscribersId) {
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[userId],
        )
        await subscribeToRelease({
          releaseId,
          operation: 'subscribe',
        } as SubscriptionPostDto)
      }

      // change back to acting user
      apiToken = await nestTestingApp.utils.getUserToken(
        testNamespace.users[actingUserId],
      )

      // add approvers
      for (const userId of approversId) {
        await addApproverToRelease(releaseId, {
          user: `${testNamespace.users[userId].id}`,
        })
      }

      // set spy
      const mailSpy = vi.spyOn(
        nestTestingApp.testingModule.get<MailingServiceMock>(MailingService),
        'pushNotification',
      )

      // approve release
      for (const userId of approversId) {
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[userId],
        )
        await approveRelease(releaseId, {
          comment: 'All open conversations have been resolved',
        })
      }

      // reset release approval
      for (const userId of approversId) {
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[userId],
        )
        await resetApprovalRelease(releaseId, {
          comment: 'New issues have been found',
        })
      }

      expect(mailSpy).toHaveBeenCalledTimes(expectedCalls.length)
      for (let i = 0; i < mailSpy.mock.calls.length; i++) {
        // recipient
        expect(mailSpy.mock.calls[i][0]).toEqual(expectedCalls[i][0])
        // notification title
        expect(mailSpy.mock.calls[i][1]).toEqual(expectedCalls[i][1])
        // notification type
        expect(mailSpy.mock.calls[i][2]).toEqual(
          expect.objectContaining(expectedCalls[i][2]),
        )
      }
    })

    it('should notify new approver when added to release', async () => {
      const actingUserId = 0
      const subscribersId = [5]
      const approversId = [1, 2]
      const noEmailNotificationsId = [1]

      const expectedCalls = [
        [
          'user2@bosch.com',
          addedAsApproverTitle,
          {
            type: NotificationType.Approval,
          },
        ],
      ]

      const configFile = path.join(
        __dirname,
        'mocks',
        'qg-config-10-findings-red-status.yaml',
      )
      const resultFile = path.join(
        __dirname,
        'mocks',
        'qg-result-10-findings-red-status.yaml',
      )
      vi.spyOn(
        nestTestingApp.testingModule.get<MinIOStoreImpl>(BlobStore),
        'downloadResult',
      ).mockImplementation(async (): Promise<Readable> => {
        const buffer = await readFile(resultFile)
        const readableStream = new Readable({
          read() {
            this.push(buffer, 'utf-8')
            this.push(null)
          },
        })

        return Promise.resolve(readableStream)
      })

      // turn off email notifications for users
      for (const userId of noEmailNotificationsId) {
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[userId],
        )
        await updateUserPofile({
          emailNotifications: false,
          editor: 'code',
        } as UpdateUserProfileDto)
      }

      // set acting user
      apiToken = await nestTestingApp.utils.getUserToken(
        testNamespace.users[actingUserId],
      )

      // create config + run
      const body = {
        configId: await createConfig(testContext, testName, [
          {
            filepath: configFile,
            filename: testFilename,
            contentType: testContentType,
          },
        ]),
      }

      const runId = await postRun(testContext, body)
      await checkRun(nestTestingApp, runId)

      await completeRun(testContext, runId, RunResult.Red)

      // create release
      const createReleaseDto = {
        name: 'Test release',
        plannedDate: new Date('2024-03-25T13:32:07.749Z'),
        qgConfigId: body.configId,
        approvalMode: 'one' as ApprovalMode,
      }
      const createResponseDto = await createRelease(createReleaseDto)
      const releaseId = createResponseDto.body.id

      // subscribe users to release
      for (const userId of subscribersId) {
        apiToken = await nestTestingApp.utils.getUserToken(
          testNamespace.users[userId],
        )
        await subscribeToRelease({
          releaseId,
          operation: 'subscribe',
        } as SubscriptionPostDto)
      }

      // change back to acting user
      apiToken = await nestTestingApp.utils.getUserToken(
        testNamespace.users[actingUserId],
      )

      // set spy
      const mailSpy = vi.spyOn(
        nestTestingApp.testingModule.get<MailingServiceMock>(MailingService),
        'pushNotification',
      )
      // add approvers
      for (const userId of approversId) {
        await addApproverToRelease(releaseId, {
          user: `${testNamespace.users[userId].id}`,
        })
      }

      expect(mailSpy).toHaveBeenCalledTimes(expectedCalls.length)
      for (let i = 0; i < mailSpy.mock.calls.length; i++) {
        // recipient
        expect(mailSpy.mock.calls[i][0]).toEqual(expectedCalls[i][0])
        // notification title
        expect(mailSpy.mock.calls[i][1]).toEqual(expectedCalls[i][1])
        // notification type
        expect(mailSpy.mock.calls[i][2]).toEqual(
          expect.objectContaining(expectedCalls[i][2]),
        )
      }
    })
  })

  async function addComment(
    releaseId: string,
    comment: AddCommentDto,
  ): Promise<supertest.Test> {
    return await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/comments`,
      )
      .send(comment)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }

  async function updateComment(
    releaseId: string,
    commentId: string,
    comment: UpdateCommentDto,
  ): Promise<supertest.Test> {
    return await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .patch(
        `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/comments/${commentId}`,
      )
      .send(comment)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }

  async function updateUserPofile(
    userProfile: UpdateUserProfileDto,
  ): Promise<supertest.Test> {
    return supertest
      .agent(nestTestingApp.app.getHttpServer())
      .patch(`/api/v1/user-profile`)
      .send(userProfile)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }

  async function createRelease(
    createReleaseResponse: AddReleaseDto,
  ): Promise<supertest.Test> {
    return supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(`/api/v1/namespaces/${testNamespace.namespace.id}/releases`)
      .send(createReleaseResponse)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }

  async function subscribeToRelease(
    subscribeToRelease: SubscriptionPostDto,
  ): Promise<supertest.Test> {
    return supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(`/api/v1/subscriptions/manage`)
      .send(subscribeToRelease)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }

  async function createTask(
    releaseId: string,
    task: AddTaskDto,
  ): Promise<supertest.Test> {
    return supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks`,
      )
      .send(task)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }

  async function addAssignees(
    releaseId: number,
    taskId: number,
    dto: AddRemoveAssigneesDto,
  ): Promise<supertest.Test> {
    return await supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}/assignees`,
      )
      .send(dto)
      .set('Authorization', `Bearer ${apiToken}`)
  }

  async function deleteTask(
    releaseId: string,
    taskId: string,
  ): Promise<supertest.Test> {
    return supertest
      .agent(nestTestingApp.app.getHttpServer())
      .delete(
        `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}`,
      )
      .set('Authorization', `Bearer ${apiToken}`)
  }

  async function addApproverToRelease(
    releaseId: string,
    addApproverResponse: AddApproverDto,
  ): Promise<supertest.Test> {
    return supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/approvers`,
      )
      .send(addApproverResponse)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }

  async function approveRelease(
    releaseId: string,
    updateApprovalResponse: UpdateApprovalDto,
  ) {
    return supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/approve`,
      )
      .send(updateApprovalResponse)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }

  async function resetApprovalRelease(
    releaseId: string,
    updateApprovalResponse: UpdateApprovalDto,
  ) {
    return supertest
      .agent(nestTestingApp.app.getHttpServer())
      .post(
        `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/reset`,
      )
      .send(updateApprovalResponse)
      .set('Authorization', `Bearer ${apiToken}`)
      .set('Content-Type', 'application/json')
  }
})
