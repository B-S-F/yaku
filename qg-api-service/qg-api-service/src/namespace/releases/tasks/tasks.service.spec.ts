import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { LoggerModule } from 'nestjs-pino'
import { EntityManager, QueryRunner } from 'typeorm'
import { RequestUser } from '../../../namespace/module.utils'
import { UsersService } from '../../../namespace/users/users.service'
import { NotificationService } from '../../../notifications/notification.service'
import { TaskNotificationsService } from './task-notifications.service'
import { ReminderMode, TaskAuditService, TaskEntity } from './tasks.entity'
import { TaskService } from './tasks.service'

describe('TasksService', () => {
  let service: TaskService
  let queryRunner: QueryRunner

  const user1 = {
    id: 'user1_id',
    username: 'user1',
    displayName: 'User 1',
  } as RequestUser
  const user2 = {
    id: 'user2_id',
    username: 'user2',
    displayName: 'User 2',
  } as RequestUser

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    const module = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()],
      providers: [
        TaskService,
        {
          provide: TaskAuditService,
          useValue: {
            append: jest.fn(),
          },
        },
        {
          provide: TaskNotificationsService,
          useValue: {
            removeTaskNotifications: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            pushNotification: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn().mockImplementation((id: string) => {
              if (id === user1.id) {
                return user1
              } else if (id === user2.id) {
                return user2
              }
              return null
            }),
            list: jest.fn().mockImplementation(() => [user1, user2]),
          },
        },
        {
          provide: getRepositoryToken(TaskEntity),
          useValue: {
            manager: {
              connection: {
                createQueryRunner: jest.fn(() => queryRunner),
              },
            },
          },
        },
      ],
    }).compile()

    service = module.get(TaskService)
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOneOrFail: jest.fn() as any,
        findOne: jest.fn() as any,
        find: jest.fn() as any,
        save: jest.fn() as any,
        delete: jest.fn() as any,
        getRepository: jest.fn() as any,
      } as EntityManager,
    } as any
  })

  describe('closedTask', () => {
    const testDate = new Date('2024-03-25T15:40:27.026Z')
    const task = {
      id: 1,
      namespace: { id: 2 },
      release: { id: 3 },
      dueDate: testDate,
      reminder: ReminderMode.DISABLED,
      description: 'Description 1',
      createdBy: user2.id,
      lastModifiedBy: user1.id,
      creationTime: testDate,
      lastModificationTime: testDate,
      closed: true,
      assignees: [user1.id, user2.id],
    } as TaskEntity

    beforeEach(() => {
      const getWithTransaction = jest.spyOn(service, 'getWithTransaction')
      getWithTransaction.mockResolvedValue(task)
    })

    it('should not be possible to update a closed task', async () => {
      await expect(
        service.update(2, 3, 1, 'title', testDate, undefined, undefined, user1)
      ).rejects.toThrowError()
    })

    it('should not be possible to add assignees to a closed task', async () => {
      await expect(
        service.addAssignees(2, 3, 1, [user2.id], user1)
      ).rejects.toThrowError()
    })

    it('should not be possible to remove assignees from a closed task', async () => {
      await expect(
        service.removeAssignees(2, 3, 1, [user2.id], user1)
      ).rejects.toThrowError()
    })
  })

  describe('closedRelease', () => {
    beforeEach(() => {
      jest.mock('../module.utils', () => ({
        getRelease: jest.fn().mockResolvedValue({ closed: true }),
      }))
    })

    it('should not be possible to create a task for a closed release', async () => {
      await expect(
        service.create(
          2,
          3,
          'title',
          new Date(),
          ReminderMode.DISABLED,
          'Description 1',
          user1
        )
      ).rejects.toThrowError()
    })

    it('should not be possible to close a task for a closed release', async () => {
      await expect(service.close(2, 3, 1, user1)).rejects.toThrowError()
    })

    it('should not be possible to reset a task for a closed release', async () => {
      await expect(service.reopen(2, 3, 1, user1)).rejects.toThrowError()
    })

    it('should not be possible to update a task for a closed release', async () => {
      await expect(
        service.update(
          2,
          3,
          1,
          'title',
          new Date(),
          undefined,
          undefined,
          user1
        )
      ).rejects.toThrowError()
    })

    it('should not be possible to add assignees to a task for a closed release', async () => {
      await expect(
        service.addAssignees(2, 3, 1, [user2.id], user1)
      ).rejects.toThrowError()
    })

    it('should not be possible to remove assignees from a task for a closed release', async () => {
      await expect(
        service.removeAssignees(2, 3, 1, [user2.id], user1)
      ).rejects.toThrowError()
    })
  })

  describe('toTaskDto', () => {
    it('should convert a task entity to a task DTO', async () => {
      const testDate = new Date('2024-03-25T15:40:27.026Z')
      const task = {
        id: 1,
        namespace: { id: 2 },
        release: { id: 3 },
        dueDate: testDate,
        reminder: ReminderMode.DISABLED,
        description: 'Description 1',
        createdBy: user2.id,
        lastModifiedBy: user1.id,
        creationTime: testDate,
        lastModificationTime: testDate,
        closed: false,
        assignees: [user1.id, user2.id],
      } as TaskEntity

      const dto = await service.toTaskDto(task)

      expect(dto).toEqual({
        id: 1,
        dueDate: testDate,
        reminder: 'disabled',
        description: 'Description 1',
        createdBy: user2,
        lastModifiedBy: user1,
        creationTime: testDate,
        lastModificationTime: testDate,
        closed: false,
        assignees: [user1, user2],
      })
    })

    it('should convert a task entity with a reference to a task DTO', async () => {
      const testDate = new Date('2024-03-25T15:40:27.026Z')
      const task = {
        id: 1,
        namespace: { id: 2 },
        release: { id: 3 },
        dueDate: testDate,
        reminder: ReminderMode.DISABLED,
        description: 'Description 1',
        createdBy: user2.id,
        lastModifiedBy: user1.id,
        creationTime: testDate,
        lastModificationTime: testDate,
        closed: false,
        assignees: [user1.id, user2.id],
        chapter: '1',
        requirement: '1',
        check: '1',
      } as TaskEntity

      const dto = await service.toTaskDto(task)

      expect(dto).toEqual({
        id: 1,
        dueDate: testDate,
        reminder: 'disabled',
        description: 'Description 1',
        createdBy: user2,
        lastModifiedBy: user1,
        creationTime: testDate,
        lastModificationTime: testDate,
        closed: false,
        assignees: [user1, user2],
        reference: {
          chapter: '1',
          requirement: '1',
          check: '1',
        },
      })
    })
  })

  describe('toEntityList', () => {
    it('should convert a list of task entities to a list of task DTOs', async () => {
      const testDate = new Date('2024-03-25T15:40:27.026Z')
      const tasks = [
        {
          id: 1,
          namespace: { id: 2 },
          release: { id: 3 },
          dueDate: testDate,
          reminder: ReminderMode.DISABLED,
          description: 'Description 1',
          createdBy: user2.id,
          lastModifiedBy: user1.id,
          creationTime: testDate,
          lastModificationTime: testDate,
          closed: false,
          assignees: [user1.id, user2.id],
        } as TaskEntity,
        {
          id: 2,
          namespace: { id: 2 },
          release: { id: 3 },
          dueDate: testDate,
          reminder: ReminderMode.OVERDUE,
          description: 'Description 2',
          createdBy: user1.id,
          lastModifiedBy: user2.id,
          creationTime: testDate,
          lastModificationTime: testDate,
          closed: true,
          assignees: [user1.id],
          chapter: '1',
          requirement: '1',
          check: '1',
        } as TaskEntity,
      ]

      const dtos = await service.toEntityList({
        entities: tasks,
        itemCount: tasks.length,
      })

      expect(dtos).toEqual({
        entities: [
          {
            id: 1,
            dueDate: testDate,
            reminder: 'disabled',
            description: 'Description 1',
            createdBy: user2,
            lastModifiedBy: user1,
            creationTime: testDate,
            lastModificationTime: testDate,
            closed: false,
            assignees: [user1, user2],
          },
          {
            id: 2,
            dueDate: testDate,
            reminder: 'overdue',
            description: 'Description 2',
            createdBy: user1,
            lastModifiedBy: user2,
            creationTime: testDate,
            lastModificationTime: testDate,
            closed: true,
            assignees: [user1],
            reference: {
              chapter: '1',
              requirement: '1',
              check: '1',
            },
          },
        ],
        itemCount: 2,
      })
    })
  })

  describe('checkAssignees', () => {
    it('should resolve if all assignees are valid', async () => {
      const assignees = [user1.id, user2.id]

      await expect(
        service.checkAssignees(1, assignees)
      ).resolves.toBeUndefined()
    })

    it('should throw an error if at least one assignee is invalid', async () => {
      const assignees = [user1.id, 'invalid_id']

      await expect(service.checkAssignees(1, assignees)).rejects.toThrowError()
    })
  })

  describe('checkForClosed', () => {
    it('should resolve if the task is not closed', async () => {
      const task = {
        closed: false,
        id: 1,
        namespace: { id: 2 },
        release: { id: 3 },
      } as TaskEntity

      expect(service.checkForClosed(task)).toBeUndefined()
    })

    it('should throw an error if the task is closed', async () => {
      const task = {
        closed: true,
        id: 1,
        namespace: { id: 2 },
        release: { id: 3 },
      } as TaskEntity

      expect(() => service.checkForClosed(task)).toThrowError()
    })
  })
})
