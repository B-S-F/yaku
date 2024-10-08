import { EntityList, ListQueryHandler } from '@B-S-F/api-commons-lib'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryRunner, Repository } from 'typeorm'
import { TaskAssignedData } from '../../../mailing/mailing.service'
import { NotificationType } from '../../../mailing/mailing.utils'
import { Action, AuditActor } from '../../../namespace/audit/audit.entity'
import { RequestUser } from '../../../namespace/module.utils'
import { Namespace } from '../../../namespace/namespace/namespace.entity'
import { UsersService } from '../../../namespace/users/users.service'
import { UserInNamespaceDto } from '../../../namespace/users/users.utils'
import { NotificationService } from '../../../notifications/notification.service'
import {
  checkForClosed,
  getQgConfigFileContent,
  getRelease,
} from '../module.utils'
import { ReleaseEntity } from '../release.entity'
import { TaskNotificationsService } from './task-notifications.service'
import { ReminderMode, TaskAuditService, TaskEntity } from './tasks.entity'
import { AssigneesDto, Reference, TaskDto, TaskState } from './tasks.utils'

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repository: Repository<TaskEntity>,
    @Inject(TaskAuditService)
    private readonly taskAuditService: TaskAuditService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(TaskNotificationsService)
    private readonly taskNotificationService: TaskNotificationsService
  ) {}

  async get(
    namespaceId: number,
    releaseId: number,
    taskId: number
  ): Promise<TaskDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.getWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        taskId
      )
      const dto = await this.toTaskDto(res)
      await queryRunner.commitTransaction()
      return dto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async getWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    taskId: number
  ): Promise<TaskEntity> {
    return await queryRunner.manager.findOneOrFail(TaskEntity, {
      where: {
        id: taskId,
        namespace: { id: namespaceId },
        release: { id: releaseId },
      },
      relations: ['namespace', 'release'],
    })
  }

  async list(
    namespaceId: number,
    releaseId: number,
    listQueryHandler: ListQueryHandler,
    taskStateFilter?: TaskState,
    assigneesFilter?: string[]
  ): Promise<EntityList<TaskDto>> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.listWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        listQueryHandler,
        taskStateFilter,
        assigneesFilter
      )
      const dto = await this.toEntityList(res)
      await queryRunner.commitTransaction()
      return dto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async listWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    listQueryHandler: ListQueryHandler,
    taskStateFilter?: TaskState,
    assigneesFilter?: string[]
  ): Promise<EntityList<TaskEntity>> {
    const queryBuilder = queryRunner.manager
      .getRepository(TaskEntity)
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.namespace', 'Namespace')
      .leftJoinAndSelect('task.release', 'Release')
      .where('task.namespaceId = :namespaceId', { namespaceId })
      .andWhere('task.releaseId = :releaseId', { releaseId })

    if (assigneesFilter) {
      queryBuilder.andWhere('task.assignees @> :assignees', {
        assignees: assigneesFilter,
      })
    }

    if (taskStateFilter) {
      const closed = taskStateFilter === TaskState.CLOSED
      queryBuilder.andWhere('task.closed = :closed', { closed })
    }

    listQueryHandler.addToQueryBuilder(queryBuilder, 'task')

    const itemCount = await queryBuilder.getCount()
    const { entities } = await queryBuilder.getRawAndEntities()

    return {
      entities,
      itemCount,
    }
  }

  async create(
    namespaceId: number,
    releaseId: number,
    title: string,
    dueDate: Date,
    reminder: ReminderMode,
    description: string,
    actor: RequestUser
  ): Promise<TaskDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.createWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        title,
        dueDate,
        reminder,
        description,
        actor
      )
      const dto = await this.toTaskDto(res)
      await queryRunner.commitTransaction()
      return dto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async createWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    title: string,
    dueDate: Date,
    reminder: ReminderMode,
    description: string,
    actor: RequestUser
  ): Promise<TaskEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const newTask = new TaskEntity()
    newTask.namespace = { id: namespaceId } as Namespace
    newTask.release = { id: releaseId } as ReleaseEntity
    newTask.title = title
    newTask.dueDate = dueDate
    newTask.reminder = reminder
    newTask.description = description
    newTask.createdBy = actor.id
    newTask.lastModifiedBy = actor.id
    newTask.creationTime = new Date()
    newTask.lastModificationTime = new Date()
    newTask.closed = false
    newTask.assignees = []
    const task = await queryRunner.manager.save(newTask)
    await this.taskAuditService.append(
      namespaceId,
      task.id,
      {},
      task.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.CREATE,
      queryRunner.manager
    )
    return task
  }

  async createReferenceTask(
    namespaceId: number,
    releaseId: number,
    reference: Reference,
    dueDate: Date,
    reminder: ReminderMode,
    actor: RequestUser
  ): Promise<TaskDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.createReferenceTaskWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        reference,
        dueDate,
        reminder,
        actor
      )
      const dto = await this.toTaskDto(res)
      await queryRunner.commitTransaction()
      return dto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async createReferenceTaskWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    reference: Reference,
    dueDate: Date,
    reminder: ReminderMode,
    actor: RequestUser
  ): Promise<TaskEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)
    const taskContext = await this.getTaskContext(
      queryRunner,
      namespaceId,
      releaseId,
      reference
    )

    const newTask = new TaskEntity()
    newTask.namespace = { id: namespaceId } as Namespace
    newTask.release = { id: releaseId } as ReleaseEntity
    newTask.chapter = reference.chapter
    newTask.requirement = reference.requirement
    newTask.check = reference.check
    newTask.title = taskContext.title
    newTask.dueDate = dueDate
    newTask.reminder = reminder
    newTask.description = taskContext.description
    newTask.createdBy = actor.id
    newTask.lastModifiedBy = actor.id
    newTask.creationTime = new Date()
    newTask.lastModificationTime = new Date()
    newTask.closed = false
    newTask.assignees = []
    const task = await queryRunner.manager.save(newTask)
    await this.taskAuditService.append(
      namespaceId,
      task.id,
      {},
      task.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.CREATE,
      queryRunner.manager
    )
    return task
  }

  /**
   * Get the task context from the configuration file based on the reference.
   * @param queryRunner The query runner
   * @param namespaceId The namespace id
   * @param releaseId The release id
   * @param reference The reference
   * @returns The task context with title and description e.g. { title: 'Chapter 1 - Requirement 1: Requirement title', description: 'Requirement text' }
   * @throws NotFoundException If the reference is not found
   */
  private async getTaskContext(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    reference: Reference
  ): Promise<{ title: string; description: string }> {
    const qgConfigData = await getQgConfigFileContent(
      queryRunner,
      namespaceId,
      releaseId
    )

    try {
      const chapter = qgConfigData['chapters'][reference.chapter]
      const hasRequirement =
        reference.requirement && reference.requirement.length > 0
      const hasCheck = reference.check && reference.check.length > 0

      if (hasRequirement && hasCheck) {
        const check =
          qgConfigData['chapters'][reference.chapter]['requirements'][
            reference.requirement
          ]['checks'][reference.check]
        return {
          title: `${reference.chapter}_${reference.requirement}_${reference.check}: ${check['title']}`,
          description: 'This task has no description',
        }
      }

      if (hasRequirement) {
        const requirement =
          qgConfigData['chapters'][reference.chapter]['requirements'][
            reference.requirement
          ]
        return {
          title: `${reference.chapter}_${reference.requirement}: ${requirement['title']}`,
          description: requirement['text'] || 'This task has no description',
        }
      }

      return {
        title: `${reference.chapter}: ${chapter['title']}`,
        description: chapter['text'] || 'This task has no description',
      }
    } catch (e) {
      throw new NotFoundException(
        `Reference not found, namespace: ${namespaceId}, release: ${releaseId}, reference: ${JSON.stringify(
          reference
        )}`
      )
    }
  }

  async update(
    namespaceId: number,
    releaseId: number,
    taskId: number,
    title: string,
    dueDate: Date,
    reminder: ReminderMode,
    description: string,
    actor: RequestUser
  ): Promise<TaskDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.updateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        taskId,
        title,
        dueDate,
        reminder,
        description,
        actor
      )
      const dto = await this.toTaskDto(res)
      await queryRunner.commitTransaction()
      return dto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async updateWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    taskId: number,
    title: string,
    dueDate: Date,
    reminder: ReminderMode,
    description: string,
    actor: RequestUser
  ): Promise<TaskEntity> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const currentTask = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      taskId
    )

    if (!currentTask) {
      throw new Error('Unexpected state when retrieving release')
    }
    this.checkForClosed(currentTask)

    const originalTask = currentTask.DeepCopy()

    if (title) currentTask.title = title
    if (dueDate) currentTask.dueDate = dueDate
    if (reminder) currentTask.reminder = reminder
    if (description) currentTask.description = description
    currentTask.lastModifiedBy = actor.id
    currentTask.lastModificationTime = new Date()

    const task = await queryRunner.manager.save(currentTask)
    await this.taskAuditService.append(
      namespaceId,
      taskId,
      originalTask.DeepCopyWithoutRelations(),
      task.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )
    return task
  }

  async close(
    namespaceId: number,
    releaseId: number,
    taskId: number,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      await this.updateTaskStateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        taskId,
        TaskState.CLOSED,
        actor
      )
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async reopen(
    namespaceId: number,
    releaseId: number,
    taskId: number,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      await this.updateTaskStateWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        taskId,
        TaskState.OPEN,
        actor
      )
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async updateTaskStateWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    taskId: number,
    newState: TaskState,
    actor: RequestUser
  ): Promise<void> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const currentTask = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      taskId
    )

    if (!currentTask) {
      throw new Error('Unexpected state when retrieving release')
    }

    switch (newState) {
      case TaskState.CLOSED:
        if (currentTask.closed) return
        currentTask.closed = true
        break
      case TaskState.OPEN:
        if (!currentTask.closed) return
        currentTask.closed = false
        break
      default:
        throw new Error('Invalid task state')
    }

    const originalTask = currentTask.DeepCopy()

    currentTask.lastModifiedBy = actor.id
    currentTask.lastModificationTime = new Date()

    const task = await queryRunner.manager.save(currentTask)
    await this.taskAuditService.append(
      namespaceId,
      taskId,
      originalTask.DeepCopyWithoutRelations(),
      task.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )
  }

  async delete(
    namespaceId: number,
    releaseId: number,
    taskId: number,
    actor: RequestUser
  ): Promise<void> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      await this.deleteWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        taskId,
        actor
      )
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async deleteWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    taskId: number,
    actor: RequestUser
  ): Promise<void> {
    // TODO: cleanup
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const task = await queryRunner.manager.findOne(TaskEntity, {
      where: {
        id: taskId,
        namespace: { id: namespaceId },
        release: { id: releaseId },
      },
      relations: ['namespace', 'release'],
    })

    if (!task) {
      return
    }

    await this.taskNotificationService.removeTaskNotifications(
      queryRunner.manager,
      [task.id]
    )

    await queryRunner.manager.remove(task)
    await this.taskAuditService.append(
      namespaceId,
      taskId,
      task.DeepCopyWithoutRelations(),
      {},
      AuditActor.convertFrom(actor),
      Action.DELETE,
      queryRunner.manager
    )
  }

  async removeAllWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    actor: RequestUser
  ): Promise<void> {
    const tasks = await queryRunner.manager.find(TaskEntity, {
      where: {
        namespace: { id: namespaceId },
        release: { id: releaseId },
      },
    })

    /*
     * This method is only called on release removal.
     */

    for (const task of tasks) {
      await this.taskNotificationService.removeTaskNotifications(
        queryRunner.manager,
        [task.id]
      )

      await this.taskAuditService.append(
        namespaceId,
        task.id,
        task.DeepCopyWithoutRelations(),
        {},
        AuditActor.convertFrom(actor),
        Action.DELETE,
        queryRunner.manager
      )

      await queryRunner.manager.remove(task)
    }
  }

  async listAssignees(
    namespaceId: number,
    releaseId: number,
    taskId: number
  ): Promise<string[]> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.listAssigneesWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        taskId
      )
      await queryRunner.commitTransaction()
      return res
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async listAssigneesWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    taskId: number
  ): Promise<string[]> {
    const task = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      taskId
    )
    return task.assignees
  }

  async addAssignees(
    namespaceId: number,
    releaseId: number,
    taskId: number,
    assignees: string[],
    actor: RequestUser
  ): Promise<AssigneesDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.addAssigneesWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        taskId,
        assignees,
        actor
      )
      await queryRunner.commitTransaction()
      return res
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async addAssigneesWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    taskId: number,
    assignees: string[],
    actor: RequestUser
  ): Promise<AssigneesDto> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const currentTask = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      taskId
    )
    this.checkForClosed(currentTask)

    const originalTask = currentTask.DeepCopy()

    await this.checkAssignees(namespaceId, assignees)

    currentTask.assignees = [
      ...new Set([...currentTask.assignees, ...assignees]),
    ]
    currentTask.lastModifiedBy = actor.id
    currentTask.lastModificationTime = new Date()

    const task = await queryRunner.manager.save(currentTask)
    await this.taskAuditService.append(
      namespaceId,
      taskId,
      originalTask.DeepCopyWithoutRelations(),
      task.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )

    const newAssignees = assignees.filter(
      (assignee) => !originalTask.assignees.includes(assignee)
    )
    for (const assignee of newAssignees) {
      await this.pushAssignedNotification(assignee, currentTask)
    }

    return {
      assignees: await this.assigneesToUser(task.assignees),
    }
  }

  async removeAssignees(
    namespaceId: number,
    releaseId: number,
    taskId: number,
    assignees: string[],
    actor: RequestUser
  ): Promise<AssigneesDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')
      const res = await this.removeAssigneesWithTransaction(
        queryRunner,
        namespaceId,
        releaseId,
        taskId,
        assignees,
        actor
      )
      await queryRunner.commitTransaction()
      return res
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async removeAssigneesWithTransaction(
    queryRunner: QueryRunner,
    namespaceId: number,
    releaseId: number,
    taskId: number,
    assignees: string[],
    actor: RequestUser
  ): Promise<AssigneesDto> {
    const release = await getRelease(queryRunner, namespaceId, releaseId)
    checkForClosed(release)

    const currentTask = await this.getWithTransaction(
      queryRunner,
      namespaceId,
      releaseId,
      taskId
    )
    this.checkForClosed(currentTask)

    const originalTask = currentTask.DeepCopy()

    await this.checkAssignees(namespaceId, assignees)

    currentTask.assignees = currentTask.assignees.filter(
      (a) => !assignees.includes(a)
    )
    currentTask.lastModifiedBy = actor.id
    currentTask.lastModificationTime = new Date()

    const task = await queryRunner.manager.save(currentTask)
    await this.taskAuditService.append(
      namespaceId,
      taskId,
      originalTask.DeepCopyWithoutRelations(),
      task.DeepCopyWithoutRelations(),
      AuditActor.convertFrom(actor),
      Action.UPDATE,
      queryRunner.manager
    )

    return {
      assignees: await this.assigneesToUser(task.assignees),
    }
  }

  async checkAssignees(
    nammespaceId: number,
    assignees: string[]
  ): Promise<void> {
    const namespaceUsers = await this.usersService.list(nammespaceId)
    for (const assignee of assignees) {
      if (!namespaceUsers.find((user) => user.id === assignee)) {
        throw new NotFoundException(
          `User ${assignee} not found in namespace ${nammespaceId}`
        )
      }
    }
  }

  async assigneesToUser(assignees: string[]): Promise<UserInNamespaceDto[]> {
    return await Promise.all(
      assignees.map((assignee) => this.usersService.getUser(assignee))
    )
  }

  async pushAssignedNotification(
    assigneeId: string,
    task: TaskEntity
  ): Promise<void> {
    if (!task.release || !task.namespace) {
      throw new Error(
        'Unexpected state when pushing notification, missing relational data in task'
      )
    }
    const assignee = await this.usersService.getUser(assigneeId)
    const data: TaskAssignedData = {
      user_name: assignee.firstName ? assignee.firstName : assignee.displayName,
      namespace_name: task.namespace.name,
      release_id: task.release.id,
      task_id: task.id,
      task_title: task.title,
      task_description: task.description,
    }
    await this.notificationService.pushNotification(
      assigneeId,
      'Task Assigned',
      {
        type: NotificationType.TaskAssigned,
        data,
      }
    )
  }

  checkForClosed(task: TaskEntity): void {
    if (task.closed) {
      throw new BadRequestException(
        `Task has been closed, namespace: ${task.namespace.id}, release: ${task.release.id}, task: ${task.id}`
      )
    }
  }

  async toTaskDto(task: TaskEntity): Promise<TaskDto> {
    const dto = new TaskDto()
    dto.id = task.id
    if (task.chapter) {
      dto.reference = {
        chapter: task.chapter,
        requirement: task.requirement,
        check: task.check,
      }
    }
    dto.title = task.title
    dto.dueDate = task.dueDate
    dto.reminder = task.reminder
    dto.description = task.description
    dto.createdBy = await this.usersService.getUser(task.createdBy)
    dto.lastModifiedBy = await this.usersService.getUser(task.lastModifiedBy)
    dto.creationTime = task.creationTime
    dto.lastModificationTime = task.lastModificationTime
    dto.closed = task.closed
    dto.assignees = await this.assigneesToUser(task.assignees)
    return dto
  }

  async toEntityList(
    tasks: EntityList<TaskEntity>
  ): Promise<EntityList<TaskDto>> {
    return {
      entities: await Promise.all(
        tasks.entities.map((task) => this.toTaskDto(task))
      ),
      itemCount: tasks.itemCount,
    }
  }
}
