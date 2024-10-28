import {
  toListQueryOptions,
  UrlHandlerFactory,
  validateBody,
  validateId,
} from '@B-S-F/api-commons-lib'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { isArray } from 'class-validator'
import { Request, Response } from 'express'
import { EntityNotFoundError } from 'typeorm'
import { getUserFromRequest } from '../../../namespace/module.utils'
import { TaskAuthGuard } from './tasks.auth.guard'
import { TaskService } from './tasks.service'
import {
  AddReferenceTaskDto,
  addReferenceTaskDtoSchema,
  AddRemoveAssigneesDto,
  addRemoveAssigneesDtoSchema,
  AddTaskDto,
  addTaskDtoSchema,
  allowedSortPropertiesTaskList,
  AssigneesDto,
  createPaginationData,
  TaskDto,
  TaskListDto,
  TaskQueryOptions,
  taskQueryOptionsSchema,
  UpdateTaskDto,
  updateTaskDtoSchema,
} from './tasks.utils'

@UseGuards(TaskAuthGuard)
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiTags('Releases')
@Controller('namespaces/:namespaceId/releases/:releaseId/tasks')
export class TaskController {
  constructor(
    @Inject(TaskService) private readonly service: TaskService,
    @Inject(UrlHandlerFactory) private readonly urlHandler: UrlHandlerFactory
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tasks for a release',
    description: 'Get all tasks for a release',
  })
  @ApiOkResponse({
    description: 'List of tasks',
    type: TaskListDto,
  })
  async getTasks(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Query() queryOptions: TaskQueryOptions,
    @Res({ passthrough: true }) response: Response
  ): Promise<TaskListDto> {
    validateId(namespaceId)
    validateId(releaseId)

    // Nestjs does not wrap single values in an array when using query parameters, so we need to do it manually
    if (!isArray(queryOptions.assignees) && queryOptions.assignees) {
      queryOptions.assignees = [queryOptions.assignees]
    }

    const listQueryOptions = toListQueryOptions(
      queryOptions,
      taskQueryOptionsSchema,
      allowedSortPropertiesTaskList as any,
      'id'
    )

    const requestUrl = this.urlHandler.getHandler(response)
    const tasks = await this.service.list(
      namespaceId,
      releaseId,
      listQueryOptions,
      queryOptions.state,
      queryOptions.assignees
    )

    return createPaginationData(
      queryOptions,
      requestUrl,
      tasks.itemCount,
      tasks.entities
    )
  }

  @Get(':taskId')
  @ApiOperation({
    summary: 'Get a task',
    description: 'Get a task',
  })
  @ApiOkResponse({
    description: 'Task',
    type: TaskDto,
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
  })
  async getTask(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('taskId') taskId: number
  ): Promise<TaskDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(taskId)

    try {
      return await this.service.get(namespaceId, releaseId, taskId)
    } catch (e) {
      if (e.name === EntityNotFoundError.name) {
        throw new NotFoundException(
          `Task not found, namespace: ${namespaceId}, release: ${releaseId}, task: ${taskId}`
        )
      }
      throw e
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Add a task',
    description: 'Add a task',
  })
  @ApiCreatedResponse({
    description: 'Task added',
    type: TaskDto,
  })
  async addTask(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: AddTaskDto,
    @Req() request: Request
  ): Promise<TaskDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, addTaskDtoSchema)

    const user = getUserFromRequest(request)
    return await this.service.create(
      namespaceId,
      releaseId,
      body.title,
      body.dueDate,
      body.reminder,
      body.description,
      user
    )
  }

  @Post('referenceTask')
  @ApiOperation({
    summary: 'Add a task mapped to a configuration reference',
    description: 'Add a task mapped to a configuration reference',
  })
  @ApiCreatedResponse({
    description: 'Task added',
    type: TaskDto,
  })
  async addReferenceTask(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Body() body: AddReferenceTaskDto,
    @Req() request: Request
  ): Promise<TaskDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateBody(body, addReferenceTaskDtoSchema)

    const user = getUserFromRequest(request)
    return await this.service.createReferenceTask(
      namespaceId,
      releaseId,
      body.reference,
      body.dueDate,
      body.reminder,
      user
    )
  }

  @Post(':taskId/close')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Close a task',
    description: 'Close a task',
  })
  @ApiOkResponse({
    description: 'Task closed',
  })
  async closeTask(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('taskId') taskId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(taskId)

    const user = getUserFromRequest(request)
    return await this.service.close(namespaceId, releaseId, taskId, user)
  }

  @Post(':taskId/reopen')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reopen a task',
    description: 'Reopen a task',
  })
  @ApiOkResponse({
    description: 'Task reopened',
  })
  async reopenTask(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('taskId') taskId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(taskId)

    const user = getUserFromRequest(request)
    return await this.service.reopen(namespaceId, releaseId, taskId, user)
  }

  @Patch(':taskId')
  @ApiOperation({
    summary: 'Update a task',
    description: 'Update a task',
  })
  @ApiOkResponse({
    description: 'Task updated',
    type: TaskDto,
  })
  async updateTask(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('taskId') taskId: number,
    @Body() body: UpdateTaskDto,
    @Req() request: Request
  ): Promise<TaskDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(taskId)
    validateBody(body, updateTaskDtoSchema)

    const user = getUserFromRequest(request)
    return await this.service.update(
      namespaceId,
      releaseId,
      taskId,
      body.title,
      body.dueDate,
      body.reminder,
      body.description,
      user
    )
  }

  @Delete(':taskId')
  @ApiOperation({
    summary: 'Delete a task',
    description: 'Delete a task',
  })
  @ApiOkResponse({
    description: 'Task removed',
  })
  async removeTask(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('taskId') taskId: number,
    @Req() request: Request
  ): Promise<void> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(taskId)

    const user = getUserFromRequest(request)
    return await this.service.delete(namespaceId, releaseId, taskId, user)
  }

  @Post(':taskId/assignees')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Assign users to a task',
    description: 'Assign users to a task',
  })
  @ApiOkResponse({
    description: 'Users assigned to task',
  })
  async assignTask(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('taskId') taskId: number,
    @Body() body: AddRemoveAssigneesDto,
    @Req() request: Request
  ): Promise<AssigneesDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(taskId)
    validateBody(body, addRemoveAssigneesDtoSchema)

    const user = getUserFromRequest(request)
    return await this.service.addAssignees(
      namespaceId,
      releaseId,
      taskId,
      body.assignees,
      user
    )
  }

  @Delete(':taskId/assignees')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Remove assignees from a task',
    description: 'Remove assignees from a task',
  })
  @ApiOkResponse({
    description: 'Assignees removed from task',
  })
  async removeAssignees(
    @Param('namespaceId') namespaceId: number,
    @Param('releaseId') releaseId: number,
    @Param('taskId') taskId: number,
    @Body() body: AddRemoveAssigneesDto,
    @Req() request: Request
  ): Promise<AssigneesDto> {
    validateId(namespaceId)
    validateId(releaseId)
    validateId(taskId)
    validateBody(body, addRemoveAssigneesDtoSchema)

    const user = getUserFromRequest(request)
    return await this.service.removeAssignees(
      namespaceId,
      releaseId,
      taskId,
      body.assignees,
      user
    )
  }
}
