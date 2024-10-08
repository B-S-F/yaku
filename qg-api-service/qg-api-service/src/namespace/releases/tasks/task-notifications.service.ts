import { Inject } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { EntityManager, In, Not, Repository } from 'typeorm'
import { TaskRecurringData } from '../../../mailing/mailing.service'
import { NotificationType } from '../../../mailing/mailing.utils'
import { UsersService } from '../../users/users.service'
import { NotificationService } from '../../../notifications/notification.service'
import {
  ReminderMode,
  TaskEntity,
  TaskNotificationEntity,
} from './tasks.entity'

const DEFAULT_RECURRING_NOTIFICATION_INTERVAL = 1000 * 60 * 60 * 24 // 24 hours
const DEFAULT_REMINDER_TASK_INTERVAL = 1000 * 60 * 30 // 30 minutes

export class TaskNotificationsService {
  constructor(
    @InjectPinoLogger(TaskNotificationsService.name)
    private readonly logger = new PinoLogger({
      pinoHttp: {
        level: 'info',
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),
    @InjectRepository(TaskNotificationEntity)
    private readonly taskNotificationRepository: Repository<TaskNotificationEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService
  ) {}

  async removeTaskNotifications(
    entityManager: EntityManager,
    taskIds: number[]
  ) {
    await entityManager.delete(TaskNotificationEntity, {
      task: {
        id: In(taskIds),
      },
    })
  }

  @Interval('reminderTask', DEFAULT_REMINDER_TASK_INTERVAL)
  async reminderTask() {
    this.logger.info('Running reminder task')
    const queryRunner =
      this.taskRepository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ COMMITTED')
    try {
      // Ensures that only one instance of the reminder task can access the task_notification table
      await queryRunner.query(
        'LOCK TABLE task_notification IN ACCESS EXCLUSIVE MODE NOWAIT'
      )
      await this.synchronizeTaskNotifications(queryRunner.manager)
      await this.sendTaskNotifications(queryRunner.manager)
      return await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
      this.logger.info('Reminder task finished')
    }
  }

  private async sendTaskNotifications(entityManager: EntityManager) {
    const now = new Date()
    const taskNotifications = await this.getValidTaskNotifications(
      entityManager,
      now
    )

    for (const taskNotification of taskNotifications) {
      const task = taskNotification.task
      if (!task.namespace || !task.release) {
        throw new Error(
          'Unexpected state when pushing notification, missing relational data in task'
        )
      }

      const baseNotification: Omit<TaskRecurringData, 'user_name'> = {
        namespace_name: task.namespace.name,
        release_id: task.release.id,
        task_id: task.id,
        task_title: task.title,
        task_description: task.description,
      }

      for (const assigneeId of task.assignees) {
        const assignee = await this.usersService.getUser(assigneeId)
        const data: TaskRecurringData = {
          ...baseNotification,
          user_name: assignee.firstName
            ? assignee.firstName
            : assignee.displayName,
        }
        this.notificationService.pushNotification(
          assignee.id,
          'Task reminder',
          {
            type: NotificationType.TaskRecurring,
            data,
          }
        )
      }

      taskNotification.lastNotified = now
      await entityManager.save(taskNotification)
    }
  }

  private async getValidTaskNotifications(
    entityManager: EntityManager,
    currentDate: Date
  ) {
    const lastNotifiedThreshold = new Date(
      currentDate.getTime() - DEFAULT_RECURRING_NOTIFICATION_INTERVAL
    )
    return await entityManager
      .createQueryBuilder(TaskNotificationEntity, 'taskNotification')
      .leftJoinAndSelect('taskNotification.task', 'task')
      .leftJoinAndSelect('task.namespace', 'namespace')
      .leftJoinAndSelect('task.release', 'release')
      .where(
        `release.closed = false
        AND task.closed = false
        AND task.reminder != :disabledReminder
        AND taskNotification.lastNotified < :lastNotifiedThreshold
        AND NOT (task.reminder = :overdueReminder AND task.dueDate > :currentDate)`,
        {
          disabledReminder: ReminderMode.DISABLED,
          overdueReminder: ReminderMode.OVERDUE,
          lastNotifiedThreshold,
          currentDate,
        }
      )
      .getMany()
  }

  private async synchronizeTaskNotifications(entityManager: EntityManager) {
    const currentTaskNotifications = await this.getTaskNotifications(
      entityManager
    )
    const currentTaskIds = currentTaskNotifications.map(
      (taskNotification) => taskNotification.task.id
    )

    const newTaskNotifications = await entityManager
      .createQueryBuilder(TaskEntity, 'task')
      .leftJoinAndSelect('task.release', 'release')
      .where({
        id: Not(In(currentTaskIds)),
      })
      .andWhere('release.closed = false')
      .andWhere('task.closed = false')
      .andWhere('task.reminder != :reminder', {
        reminder: ReminderMode.DISABLED,
      })
      .getMany()
      .then((tasks) =>
        tasks.map((task) => {
          const taskNotification = new TaskNotificationEntity()
          taskNotification.lastNotified = new Date(0)
          taskNotification.task = task
          return taskNotification
        })
      )

    await entityManager.save(newTaskNotifications)
  }

  private async getTaskNotifications(entityManager: EntityManager) {
    return await entityManager
      .createQueryBuilder(TaskNotificationEntity, 'taskNotification')
      .leftJoinAndSelect('taskNotification.task', 'task')
      .leftJoinAndSelect('task.namespace', 'namespace')
      .leftJoinAndSelect('task.release', 'release')
      .getMany()
  }
}
