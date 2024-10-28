import {
  Body,
  Controller,
  Get,
  Inject,
  NotAcceptableException,
  Patch,
  Req,
} from '@nestjs/common'
import { UserProfileService } from './user-profile.service'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotAcceptableResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Request } from 'express'
import { KeyCloakUser } from '@B-S-F/api-keycloak-auth-lib'
import { GetUserProfileDto } from './dto/get-user-profile.dto'
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'
import { z } from 'zod'
import { validateBody } from '@B-S-F/api-commons-lib'
import { EditorType } from './utils/types'

@ApiBearerAuth()
@ApiOAuth2(['openid'])
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
@ApiNotAcceptableResponse({ description: 'Only available for keycloak users' })
@ApiTags('User Profile')
@Controller('user-profile')
export class UserProfileController {
  constructor(
    @Inject(UserProfileService) private readonly service: UserProfileService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve user profile',
  })
  @ApiOkResponse({
    type: GetUserProfileDto,
    description: 'User profile',
  })
  async get(@Req() request: Request): Promise<GetUserProfileDto> {
    const user: KeyCloakUser = request.user as KeyCloakUser
    const userKeyCloakSub = user.kc_sub

    if (userKeyCloakSub) {
      return await this.service.get(userKeyCloakSub)
    }
    throw new NotAcceptableException(
      `User profiles are only available for keycloak users`
    )
  }

  @Patch()
  @ApiOperation({
    summary: "Update the user's profile",
  })
  @ApiOkResponse({
    type: GetUserProfileDto,
    description: 'User updated successfully',
  })
  async update(
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @Req() request: Request
  ): Promise<GetUserProfileDto> {
    validateBody(updateUserProfileDto, userProfileSchema)
    const user: KeyCloakUser = request.user as KeyCloakUser
    const userKeyCloakSub = user.kc_sub

    if (userKeyCloakSub) {
      return await this.service.update(userKeyCloakSub, updateUserProfileDto)
    }
    throw new NotAcceptableException(
      `User profiles are only available for keycloak users`
    )
  }
}

const editorEnum = Object.values(EditorType) as [string, ...string[]]

const userProfileSchema = z.object({
  emailNotifications: z.boolean().optional(),
  editor: z.enum(editorEnum).optional(),
})
