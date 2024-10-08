import { HttpStatus } from '@nestjs/common'
import { ENABLE_TASKS_CONTROLLER } from 'src/config'
import { SubscriptionEntity } from 'src/namespace/subscriptions/entity/subscription.entity'
import * as supertest from 'supertest'
import { Repository } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ApprovalAuditEntity,
  ApprovalEntity,
} from '../src/namespace/releases/approvals/approvals.entity'
import {
  CommentAuditEntity,
  CommentEntity,
} from '../src/namespace/releases/comments/comment.entity'
import {
  AddCommentDto,
  Reference,
  ReferenceType,
} from '../src/namespace/releases/comments/comments.utils'
import {
  ApprovalMode,
  ReleaseAuditEntity,
  ReleaseEntity,
} from '../src/namespace/releases/release.entity'
import {
  AddReleaseDto,
  UpdateReleaseDto,
} from '../src/namespace/releases/releases.utils'
import {
  TaskAuditEntity,
  TaskEntity,
} from '../src/namespace/releases/tasks/tasks.entity'
import {
  AddRemoveAssigneesDto,
  AddTaskDto,
  UpdateTaskDto,
} from '../src/namespace/releases/tasks/tasks.utils'
import { NamespaceTestEnvironment, NestTestingApp, NestUtil } from './util'

let testNamespace: NamespaceTestEnvironment

let nestTestingApp: NestTestingApp
let nestUtil: NestUtil

let apiToken

let releaseRepo: Repository<ReleaseEntity>
let releaseAuditRepo: Repository<ReleaseAuditEntity>

let approvalRepo: Repository<ApprovalEntity>
let approvalAuditRepo: Repository<ApprovalAuditEntity>

let commentRepo: Repository<CommentEntity>
let commentAuditRepo: Repository<CommentAuditEntity>

let subscriptionRepo: Repository<SubscriptionEntity>

let taskRepo: Repository<TaskEntity>
let taskAuditRepo: Repository<TaskAuditEntity>

describe('Check release endpoints', () => {
  beforeEach(async () => {
    nestUtil = new NestUtil()
    nestTestingApp = await nestUtil.startNestApplication()
    const databaseContent = await nestUtil.initDatabaseContent()
    testNamespace = databaseContent.testNamespace

    apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[0])

    releaseRepo = nestTestingApp.repositories.releaseRepository
    releaseAuditRepo = nestTestingApp.repositories.releaseAuditRepository
    approvalRepo = nestTestingApp.repositories.approvalRepository
    approvalAuditRepo = nestTestingApp.repositories.approvalAuditRepository
    commentRepo = nestTestingApp.repositories.commentRepository
    commentAuditRepo = nestTestingApp.repositories.commentAuditRepository
    subscriptionRepo = nestTestingApp.repositories.subscriptionRepository
    taskRepo = nestTestingApp.repositories.taskRepository
    taskAuditRepo = nestTestingApp.repositories.taskAuditRepository
  })

  afterEach(async () => {
    await nestTestingApp.app.close()
  })

  it('Create and delete a release, check the audit trail', async () => {
    await checkDatabaseEntries(0, releaseAuditRepo)
    await checkDatabaseEntries(0, releaseRepo)

    console.log('=== Create config')

    const createConfigDto = {
      name: 'Test Config',
      description: 'Config for releases integration test',
    }

    const createConfigResponse = await createConfig(createConfigDto)
    expectStatus(createConfigResponse, HttpStatus.CREATED, 'createConfig')
    expect(createConfigResponse.body).toHaveProperty('id')
    const configId = createConfigResponse.body.id

    const createReleaseDto = {
      name: 'Test release',
      plannedDate: new Date('2024-03-25T13:32:07.749Z'),
      qgConfigId: configId,
      approvalMode: 'one' as ApprovalMode,
    }

    console.log('=== Create release')

    const createResponseDto = await createRelease(createReleaseDto)
    expectStatus(createResponseDto, HttpStatus.CREATED, 'createRelease')

    await checkDatabaseEntries(1, releaseRepo)
    await checkDatabaseEntries(1, releaseAuditRepo)

    expect(createResponseDto.body).toHaveProperty('id')
    const releaseId = createResponseDto.body.id

    await addComment(createResponseDto.body.id, {
      reference: { type: ReferenceType.RELEASE },
      content: 'This is a comment',
      todo: false,
    })

    console.log('=== Delete release')

    const deleteResponseDto = await deleteRelease(releaseId)
    expectStatus(deleteResponseDto, HttpStatus.OK, 'deleteRelease')

    await checkDatabaseEntries(0, releaseRepo)
    await checkDatabaseEntries(2, releaseAuditRepo)
  })

  it('should integrate with the ui happy path', async () => {
    console.log('=== Create config')
    const createConfigDto = {
      name: 'Test Config',
      description: 'Config for releases integration test',
    }

    const createConfigResponse = await createConfig(createConfigDto)
    expectStatus(createConfigResponse, HttpStatus.CREATED, 'createConfig')
    expect(createConfigResponse.body).toHaveProperty('id')

    const config = `header:
  name: PerformanceTest_Fibonacci
  version: '1.1'
metadata:
  version: 'v1'

autopilots:
  validateSomething:
    run: |
      echo '{ "status": "GREEN" }'
      echo '{ "reason": "Everything is awesome" }'
      echo '{ "result": { "criterion": "Awesomeness check", "fulfilled": true, "justification": "Everything is awesome" } }'
chapters:
  '1':
    title: Test config should work
    requirements:
      '1':
        title: Awesomeness Requirement
        checks:
          '1':
            title: Awesomeness compute
            automation:
                autopilot: validateSomething
    `
    await addQgConfig(createConfigResponse.body.id, config)

    await getQgConfig(createConfigResponse.body.id)
    expectStatus(createConfigResponse, HttpStatus.CREATED, 'addQgConfig')
    console.log('=== Create release')
    const createReleaseDto = {
      name: 'Test release',
      plannedDate: new Date('2024-03-25T13:32:07.749Z'),
      qgConfigId: createConfigResponse.body.id,
      approvalMode: 'one' as ApprovalMode,
    }
    const createReleaseResponse = await createRelease(createReleaseDto)

    expectStatus(createReleaseResponse, HttpStatus.CREATED, 'createRelease')
    expect(createReleaseResponse.body).toHaveProperty('id')
    await checkDatabaseEntries(1, releaseRepo)
    await checkDatabaseEntries(1, releaseAuditRepo)

    console.log('=== Add approver')
    const possibleApprovers = await listUsersOfNamespace()

    expectStatus(possibleApprovers, HttpStatus.OK, 'listUsersOfNamespace')
    expect(possibleApprovers.body.data).toHaveLength(7)

    const usersInApprovers = possibleApprovers.body.data.filter((approver) =>
      testNamespace.users.some((user) => approver.id === user.id)
    )

    expect(usersInApprovers).toHaveLength(7)

    await addApprover(createReleaseResponse.body.id, testNamespace.users[0].id)
    expectStatus(possibleApprovers, HttpStatus.OK, 'addApprover')
    await checkDatabaseEntries(1, approvalRepo)
    await checkDatabaseEntries(1, approvalAuditRepo)

    console.log('=== Add comments')
    const releaseCommentResponse = await addComment(
      createReleaseResponse.body.id,
      {
        reference: { type: ReferenceType.RELEASE },
        content: 'This is comment 1',
        todo: false,
      }
    )
    expectStatus(releaseCommentResponse, HttpStatus.CREATED, 'addComment')
    expect(releaseCommentResponse.body).toHaveProperty('id')

    apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[1])

    const commentCommentResponse = await addComment(
      createReleaseResponse.body.id,
      {
        reference: {
          type: ReferenceType.COMMENT,
          id: releaseCommentResponse.body.id,
        },
        content: 'This is comment 2',
        todo: true,
      }
    )

    expectStatus(commentCommentResponse, HttpStatus.CREATED, 'addComment')

    apiToken = await nestTestingApp.utils.getUserToken(testNamespace.users[0])

    const checkCommentResponse = await addComment(
      createReleaseResponse.body.id,
      {
        reference: {
          type: ReferenceType.CHECK,
          chapter: '1',
          requirement: '1',
          check: '1',
        },
        content: 'This is comment 3',
        todo: false,
      }
    )

    expectStatus(checkCommentResponse, HttpStatus.CREATED, 'addComment')
    await checkDatabaseEntries(3, commentRepo)
    await checkDatabaseEntries(3, commentAuditRepo)

    console.log('=== get all comments')
    const getAllCommentsResponse = await getComments(
      createReleaseResponse.body.id
    )
    expectStatus(getAllCommentsResponse, HttpStatus.OK, 'getComments')
    expect(getAllCommentsResponse.body.data).toHaveLength(2)

    console.log('=== resolve comment')
    const resolveCommentResponse = await resolveComment(
      createReleaseResponse.body.id,
      releaseCommentResponse.body.id
    )
    expectStatus(resolveCommentResponse, HttpStatus.OK, 'resolveComment')
    await checkDatabaseEntries(3, commentRepo)
    await checkDatabaseEntries(4, commentAuditRepo)

    console.log('=== get comments by reference')
    const getByReferenceResponse = await getByReference(
      createReleaseResponse.body.id,
      {
        type: ReferenceType.RELEASE,
      }
    )
    expectStatus(getByReferenceResponse, HttpStatus.OK, 'getByReference')
    expect(getByReferenceResponse.body.comments).toHaveLength(1)
    expect(getByReferenceResponse.body.comments[0].status).toBe('resolved')
    expect(getByReferenceResponse.body.comments[0].replies).toHaveLength(1)
    const check1_1_1 = await getByReference(createReleaseResponse.body.id, {
      type: ReferenceType.CHECK,
      check: '1',
      requirement: '1',
      chapter: '1',
    })
    expect(check1_1_1.body.comments).toHaveLength(1)
    expect(check1_1_1.body.comments[0].status).toBe('created')
    expect(check1_1_1.body.comments[0].replies).toHaveLength(0)

    console.log('=== Approve release')
    const approvalResponse = await approve(
      createReleaseResponse.body.id,
      'This is a comment',
      apiToken
    )
    expectStatus(approvalResponse, HttpStatus.OK, 'approve')
    const approversResponse = await listApprovers(createReleaseResponse.body.id)
    expectStatus(approversResponse, HttpStatus.OK, 'listApprovers')
    expect(approversResponse.body.data).toHaveLength(1)
    expect(approversResponse.body.data[0].user).toStrictEqual({
      displayName: testNamespace.users[0].displayName,
      id: testNamespace.users[0].id,
      email: testNamespace.users[0].email,
      username: testNamespace.users[0].username,
      firstName: testNamespace.users[0].displayName.split(' ')[0],
      lastName: testNamespace.users[0].displayName.split(' ')[1],
    })
    expect(approversResponse.body.data[0].state).toBe('approved')
    const releaseAfterApproval = await getRelease(createReleaseResponse.body.id)
    expectStatus(releaseAfterApproval, HttpStatus.OK, 'getRelease')
    expect(releaseAfterApproval.body.approvalState).toBe('approved')

    console.log('=== get all comments after approve')
    const getAllCommentsResponseAfterApprove = await getComments(
      createReleaseResponse.body.id
    )
    expectStatus(
      getAllCommentsResponseAfterApprove,
      HttpStatus.OK,
      'getComments'
    )
    expect(getAllCommentsResponseAfterApprove.body.data).toHaveLength(3)

    console.log('=== Get release history')
    const releaseHistory = await getReleaseHistory(
      createReleaseResponse.body.id
    )
    expectStatus(releaseHistory, HttpStatus.OK, 'getReleaseHistory')
    expect(releaseHistory.body.data).toHaveLength(5)
    expect(
      releaseHistory.body.data.filter((entry) => entry.type === 'comment')
    ).toHaveLength(2)
    expect(
      releaseHistory.body.data.filter((entry) => entry.type === 'event')
    ).toHaveLength(3)

    await checkDatabaseEntries(1, subscriptionRepo)

    console.log('=== Unsubscribe to release')
    const subscriptionResponse2 = await manageSubscription(
      createReleaseResponse.body.id,
      'unsubscribe'
    )
    expectStatus(subscriptionResponse2, HttpStatus.OK, 'unsubscribe')

    await checkDatabaseEntries(0, subscriptionRepo)

    console.log('=== Subscribe to release')
    const subscriptionResponse = await manageSubscription(
      createReleaseResponse.body.id,
      'subscribe'
    )
    expectStatus(subscriptionResponse, HttpStatus.OK, 'subscribe')

    console.log('=== Check subscription status')
    const subscriptionStatusResponse = await getSubscriptionStatus(
      createReleaseResponse.body.id,
      testNamespace.users[0].id
    )
    expectStatus(
      subscriptionStatusResponse,
      HttpStatus.OK,
      'check subscription status'
    )

    await checkDatabaseEntries(1, subscriptionRepo)
    if (ENABLE_TASKS_CONTROLLER === 'true') {
      console.log('=== Create a task for the release')
      const addTaskDto = {
        title: 'Test task',
        dueDate: new Date('2024-03-25T13:32:07.749Z'),
        description: 'Test description',
      } as AddTaskDto

      const addTaskResponse = await addTask(
        createReleaseResponse.body.id,
        addTaskDto
      )
      expectStatus(addTaskResponse, HttpStatus.CREATED, 'addTask')

      await checkDatabaseEntries(1, taskRepo)

      console.log('=== Update the task reminder')
      const updateTaskDto = {
        reminder: 'overdue',
      } as UpdateTaskDto

      const updateTaskResponse = await updateTask(
        createReleaseResponse.body.id,
        addTaskResponse.body.id,
        updateTaskDto
      )
      expectStatus(updateTaskResponse, HttpStatus.OK, 'updateTask')

      console.log('=== Add assignees to the task')
      const addAssigneesDto = {
        assignees: [testNamespace.users[0].id],
      } as AddRemoveAssigneesDto

      const addAssigneesResponse = await addAssignees(
        createReleaseResponse.body.id,
        addTaskResponse.body.id,
        addAssigneesDto
      )
      expectStatus(addAssigneesResponse, HttpStatus.OK, 'addAssignees')

      console.log('=== List all tasks of the release')
      const tasksResponse = await listTasks(createReleaseResponse.body.id)
      expectStatus(tasksResponse, HttpStatus.OK, 'listTasks')
      expect(tasksResponse.body.data).toHaveLength(1)
      expect(tasksResponse.body.data[0].assignees).toHaveLength(1)
      expect(tasksResponse.body.data[0].assignees[0].id).toBe(
        testNamespace.users[0].id
      )

      console.log('=== Remove assignees from the task')
      const removeAssigneesDto = {
        assignees: [testNamespace.users[0].id],
      } as AddRemoveAssigneesDto

      const removeAssigneesResponse = await removeAssignees(
        createReleaseResponse.body.id,
        addTaskResponse.body.id,
        removeAssigneesDto
      )
      expectStatus(removeAssigneesResponse, HttpStatus.OK, 'removeAssignees')

      console.log('=== Close the task')
      const closeTaskResponse = await closeTask(
        createReleaseResponse.body.id,
        addTaskResponse.body.id
      )
      expectStatus(closeTaskResponse, HttpStatus.OK, 'closeTask')

      console.log('=== Try to update the closed task')
      const updateTaskDto2 = {
        dueDate: new Date('2025-03-25T13:32:07.749Z'),
      } as UpdateTaskDto

      const updateTaskResponse2 = await updateTask(
        createReleaseResponse.body.id,
        addTaskResponse.body.id,
        updateTaskDto2
      )
      expectStatus(updateTaskResponse2, HttpStatus.BAD_REQUEST, 'updateTask')

      console.log('=== Try to add assignees to the closed task')
      const addAssigneesDto2 = {
        assignees: [testNamespace.users[0].id],
      } as AddRemoveAssigneesDto

      const addAssigneesResponse2 = await addAssignees(
        createReleaseResponse.body.id,
        addTaskResponse.body.id,
        addAssigneesDto2
      )
      expectStatus(
        addAssigneesResponse2,
        HttpStatus.BAD_REQUEST,
        'addAssignees'
      )

      console.log('=== Reopen the task')
      const reopenTaskResponse = await reopenTask(
        createReleaseResponse.body.id,
        addTaskResponse.body.id
      )

      expectStatus(reopenTaskResponse, HttpStatus.OK, 'reopenTask')

      console.log('=== Delete the task')
      const deleteTaskResponse = await deleteTask(
        createReleaseResponse.body.id,
        addTaskResponse.body.id
      )
      expectStatus(deleteTaskResponse, HttpStatus.OK, 'deleteTask')

      await checkDatabaseEntries(0, taskRepo)
      await checkDatabaseEntries(7, taskAuditRepo)
    }
  })

  it('should support rejection of a release', async () => {
    console.log('=== Create config')
    const createConfigDto = {
      name: 'Test Config',
      description: 'Config for releases integration test',
    }
    const createConfigResponse = await createConfig(createConfigDto)
    expectStatus(createConfigResponse, HttpStatus.CREATED, 'createConfig')
    expect(createConfigResponse.body).toHaveProperty('id')

    const createReleaseDto = {
      name: 'Test release',
      plannedDate: new Date('2024-03-25T13:32:07.749Z'),
      qgConfigId: createConfigResponse.body.id,
      approvalMode: 'one' as ApprovalMode,
    }
    const createReleaseResponse = await createRelease(createReleaseDto)
    expectStatus(createReleaseResponse, HttpStatus.CREATED, 'createRelease')

    console.log('=== Add approver')
    const addApproverResponse = await addApprover(
      createReleaseResponse.body.id,
      testNamespace.users[0].id
    )
    expectStatus(addApproverResponse, HttpStatus.CREATED, 'addApprover')

    console.log('=== Approve release')
    const approvalResponse = await approve(
      createReleaseResponse.body.id,
      'This is a comment',
      apiToken
    )
    expectStatus(approvalResponse, HttpStatus.OK, 'approve')

    console.log('=== Reject release')
    const resetResponse = await reset(
      createReleaseResponse.body.id,
      'This is a comment',
      apiToken
    )
    expectStatus(resetResponse, HttpStatus.OK, 'reset')

    const releaseAfterRejection = await getRelease(
      createReleaseResponse.body.id
    )
    expectStatus(releaseAfterRejection, HttpStatus.OK, 'getRelease')
    expect(releaseAfterRejection.body.approvalState).toBe('pending')
  })

  it('should not allow modification of a closed release', async () => {
    console.log('=== Create config')
    const createConfigDto = {
      name: 'Test Config',
      description: 'Config for releases integration test',
    }
    const createConfigResponse = await createConfig(createConfigDto)
    expectStatus(createConfigResponse, HttpStatus.CREATED, 'createConfig')
    expect(createConfigResponse.body).toHaveProperty('id')

    const createReleaseDto = {
      name: 'Test release',
      plannedDate: new Date('2024-03-25T13:32:07.749Z'),
      qgConfigId: createConfigResponse.body.id,
      approvalMode: 'one' as ApprovalMode,
    }
    const createReleaseResponse = await createRelease(createReleaseDto)
    expectStatus(createReleaseResponse, HttpStatus.CREATED, 'createRelease')

    console.log('=== Close release')
    const closeReleaseResponse = await closeRelease(
      createReleaseResponse.body.id
    )
    expectStatus(closeReleaseResponse, HttpStatus.OK, 'closeRelease')

    console.log('=== Try to update the release')
    const updateReleaseDto = {
      approvalMode: 'all',
    } as UpdateReleaseDto
    const updateReleaseResponse = await updateRelease(
      createReleaseResponse.body.id,
      updateReleaseDto
    )
    expectStatus(updateReleaseResponse, HttpStatus.BAD_REQUEST, 'updateRelease')
    expect(updateReleaseResponse.body).toHaveProperty('message')
    expect(updateReleaseResponse.body.message).toContain(
      'Release has been closed'
    )

    console.log('=== Try to add comment')
    const commentDto = {
      reference: { type: ReferenceType.RELEASE },
      content: 'This is a comment',
      todo: false,
    } as AddCommentDto

    const addCommentResponse = await addComment(
      createReleaseResponse.body.id,
      commentDto
    )
    expectStatus(addCommentResponse, HttpStatus.BAD_REQUEST, 'addComment')
    expect(addCommentResponse.body).toHaveProperty('message')
    expect(addCommentResponse.body.message).toContain('Release has been closed')

    console.log('=== Try to resolve comment')
    const resolveCommentResponse = await resolveComment(
      createReleaseResponse.body.id,
      '1'
    )
    expectStatus(
      resolveCommentResponse,
      HttpStatus.BAD_REQUEST,
      'resolveComment'
    )
    expect(resolveCommentResponse.body).toHaveProperty('message')
    expect(resolveCommentResponse.body.message).toContain(
      'Release has been closed'
    )

    console.log('=== Try to add approver')
    const addApproverResponse = await addApprover(
      createReleaseResponse.body.id,
      testNamespace.users[0].id
    )
    expectStatus(addApproverResponse, HttpStatus.BAD_REQUEST, 'addApprover')
    expect(addApproverResponse.body).toHaveProperty('message')
    expect(addApproverResponse.body.message).toContain(
      'Release has been closed'
    )

    console.log('=== Try to approve')
    const approveResponse = await approve(
      createReleaseResponse.body.id,
      'This is a comment',
      apiToken
    )
    expectStatus(approveResponse, HttpStatus.BAD_REQUEST, 'approve')
    expect(approveResponse.body).toHaveProperty('message')
    expect(approveResponse.body.message).toContain('Release has been closed')
    if (ENABLE_TASKS_CONTROLLER === 'true') {
      console.log('=== Add task to the release')
      const addTaskDto = {
        title: 'Test task',
        dueDate: new Date('2024-03-25T13:32:07.749Z'),
        description: 'Test description',
      } as AddTaskDto

      const addTaskResponse = await addTask(
        createReleaseResponse.body.id,
        addTaskDto
      )
      expectStatus(addTaskResponse, HttpStatus.BAD_REQUEST, 'addTask')
      expect(addTaskResponse.body).toHaveProperty('message')
      expect(addTaskResponse.body.message).toContain('Release has been closed')

      console.log('=== Update the task reminder')
      const updateTaskDto = {
        reminder: 'overdue',
      } as UpdateTaskDto

      const updateTaskResponse = await updateTask(
        createReleaseResponse.body.id,
        1,
        updateTaskDto
      )
      expectStatus(updateTaskResponse, HttpStatus.BAD_REQUEST, 'updateTask')
      expect(updateTaskResponse.body.message).toContain(
        'Release has been closed'
      )

      console.log('=== Add assignees to the task')
      const addAssigneesDto = {
        assignees: [testNamespace.users[0].id],
      } as AddRemoveAssigneesDto

      const addAssigneesResponse = await addAssignees(
        createReleaseResponse.body.id,
        1,
        addAssigneesDto
      )
      expectStatus(addAssigneesResponse, HttpStatus.BAD_REQUEST, 'addAssignees')
      expect(addAssigneesResponse.body).toHaveProperty('message')
      expect(addAssigneesResponse.body.message).toContain(
        'Release has been closed'
      )
    }
  })

  it('should update a release successfully', async () => {
    console.log('=== Create config')
    const createConfigDto = {
      name: 'Test Config',
      description: 'Config for releases integration test',
    }
    const createConfigResponse = await createConfig(createConfigDto)
    expectStatus(createConfigResponse, HttpStatus.CREATED, 'createConfig')
    expect(createConfigResponse.body).toHaveProperty('id')

    const createReleaseDto = {
      name: 'Test release',
      plannedDate: new Date('2024-03-25T13:32:07.749Z'),
      qgConfigId: createConfigResponse.body.id,
      approvalMode: 'one' as ApprovalMode,
    }
    const createReleaseResponse = await createRelease(createReleaseDto)
    expectStatus(createReleaseResponse, HttpStatus.CREATED, 'createRelease')

    console.log('=== Add approver')
    const addApproverResponse = await addApprover(
      createReleaseResponse.body.id,
      testNamespace.users[0].id
    )
    expectStatus(addApproverResponse, HttpStatus.CREATED, 'addApprover')

    console.log('=== Update release without any fields')
    let updateReleaseResponse = await updateRelease(
      createReleaseResponse.body.id,
      {}
    )
    expectStatus(updateReleaseResponse, HttpStatus.BAD_REQUEST, 'updateRelease')
    expect(updateReleaseResponse.body).toHaveProperty('message')
    expect(updateReleaseResponse.body.message).toContain('At least one field')

    console.log('=== Update release with name field')
    updateReleaseResponse = await updateRelease(createReleaseResponse.body.id, {
      name: 'New name',
    })
    expectStatus(updateReleaseResponse, HttpStatus.OK, 'updateRelease')
    expect(updateReleaseResponse.body).toHaveProperty('name')
    expect(updateReleaseResponse.body.name).toBe('New name')

    console.log('=== Update release with mode field')
    updateReleaseResponse = await updateRelease(createReleaseResponse.body.id, {
      approvalMode: 'all' as ApprovalMode,
    })
    expectStatus(updateReleaseResponse, HttpStatus.OK, 'updateRelease')
    expect(updateReleaseResponse.body).toHaveProperty('approvalMode')
    expect(updateReleaseResponse.body.approvalMode).toBe('all')

    console.log('=== Update release with planned date field')
    updateReleaseResponse = await updateRelease(createReleaseResponse.body.id, {
      plannedDate: new Date('2025-03-25T13:32:07.749Z'),
    })
    expectStatus(updateReleaseResponse, HttpStatus.OK, 'updateRelease')
    expect(updateReleaseResponse.body).toHaveProperty('plannedDate')
    expect(updateReleaseResponse.body.plannedDate).toBe(
      '2025-03-25T13:32:07.749Z'
    )
  })
})

async function checkDatabaseEntries(
  count: number,
  repo: Repository<any>
): Promise<void> {
  console.log('========== Check database entries')
  expect(
    (await repo.find()).length,
    `Repo ${repo.constructor.name} does not contain the expected ${count} elements`
  ).toBe(count)
}

async function createConfig(configDto: any): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(`/api/v1/namespaces/${testNamespace.namespace.id}/configs`)
    .send(configDto)
    .set('Authorization', `Bearer ${apiToken}`)
    .set('Content-Type', 'application/json')
}

async function addQgConfig(
  configId: string,
  config: string
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files`
    )
    .field('filename', 'qg-config.yaml')
    .attach('content', Buffer.from(config), {
      filename: 'qg-config.yaml',
      contentType: 'application/yaml',
    })
    .set('Authorization', `Bearer ${apiToken}`)
}

async function getQgConfig(
  configId: string,
  fileName = 'qg-config.yaml'
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testNamespace.namespace.id}/configs/${configId}/files/${fileName}`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function createRelease(
  createReleaseResponse: AddReleaseDto
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(`/api/v1/namespaces/${testNamespace.namespace.id}/releases`)
    .send(createReleaseResponse)
    .set('Authorization', `Bearer ${apiToken}`)
    .set('Content-Type', 'application/json')
}

async function getRelease(releaseId: string): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function closeRelease(releaseId: string): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/close`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function updateRelease(
  releaseId: string,
  updateReleaseRequest: UpdateReleaseDto
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .patch(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}`
    )
    .send(updateReleaseRequest)
    .set('Authorization', `Bearer ${apiToken}`)
    .set('Content-Type', 'application/json')
}

async function deleteRelease(releaseId: string): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .delete(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function listUsersOfNamespace(): Promise<supertest.Test> {
  const get_namespaces = await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(`/api/v1/namespaces/${testNamespace.namespace.id}/users`)
    .set('Authorization', `Bearer ${apiToken}`)
  return get_namespaces
}

async function addApprover(
  releaseId: string,
  id: string
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/approvers`
    )
    .send({ user: id })
    .set('Authorization', `Bearer ${apiToken}`)
    .set('Content-Type', 'application/json')
}

async function listApprovers(releaseId: string): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/approvers`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function approve(
  releaseId: string,
  comment: string,
  tokenOfUser
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/approve`
    )
    .send({ comment })
    .set('Authorization', `Bearer ${tokenOfUser}`)
}

async function reset(
  releaseId: string,
  comment: string,
  tokenOfUser
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/reset`
    )
    .send({ comment })
    .set('Authorization', `Bearer ${tokenOfUser}`)
}

async function addComment(
  releaseId: string,
  comment: AddCommentDto
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/comments`
    )
    .send(comment)
    .set('Authorization', `Bearer ${apiToken}`)
    .set('Content-Type', 'application/json')
}

async function resolveComment(
  releaseId: string,
  commentId: string
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/comments/${commentId}/resolve`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function getByReference(
  releaseId: string,
  reference: Reference
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/comments/get-by-reference`
    )
    .send(reference)
    .set('Authorization', `Bearer ${apiToken}`)
}

async function getComments(releaseId: string): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/comments`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function getReleaseHistory(releaseId: string): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/history`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function manageSubscription(
  releaseId: number,
  operation: string
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(`/api/v1/subscriptions/manage`)
    .send({ releaseId: releaseId, operation: operation })
    .set('Authorization', `Bearer ${apiToken}`)
}

async function getSubscriptionStatus(
  releaseId: number,
  userId: string
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(`/api/v1/subscriptions/status/${userId}/${releaseId}`)
    .set('Authorization', `Bearer ${apiToken}`)
}

function expectStatus(
  response: supertest.Response,
  status: number,
  context: string
): void {
  if (response.status !== status) {
    throw new Error(
      `Expected status ${status} but received ${
        response.status
      } for ${context}: ${JSON.stringify(response.body)}`
    )
  }
}

async function listTasks(releaseId: number): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function getTask(
  releaseId: number,
  taskId: number
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function addTask(
  releaseId: number,
  task: AddTaskDto
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks`
    )
    .send(task)
    .set('Authorization', `Bearer ${apiToken}`)
}

async function updateTask(
  releaseId: number,
  taskId: number,
  task: UpdateTaskDto
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .patch(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}`
    )
    .send(task)
    .set('Authorization', `Bearer ${apiToken}`)
}

async function deleteTask(
  releaseId: number,
  taskId: number
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .delete(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function closeTask(
  releaseId: number,
  taskId: number
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}/close`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function reopenTask(
  releaseId: number,
  taskId: number
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}/reopen`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}

async function addAssignees(
  releaseId: number,
  taskId: number,
  dto: AddRemoveAssigneesDto
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .post(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}/assignees`
    )
    .send(dto)
    .set('Authorization', `Bearer ${apiToken}`)
}

async function removeAssignees(
  releaseId: number,
  taskId: number,
  dto: AddRemoveAssigneesDto
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .delete(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}/assignees`
    )
    .send(dto)
    .set('Authorization', `Bearer ${apiToken}`)
}

async function getAssignees(
  releaseId: number,
  taskId: number
): Promise<supertest.Test> {
  return await supertest
    .agent(nestTestingApp.app.getHttpServer())
    .get(
      `/api/v1/namespaces/${testNamespace.namespace.id}/releases/${releaseId}/tasks/${taskId}/assignees`
    )
    .set('Authorization', `Bearer ${apiToken}`)
}
