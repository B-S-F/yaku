import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryRunner, Repository } from 'typeorm'
import { UserProfile } from './user-profile.entity'
import { GetUserProfileDto } from './dto/get-user-profile.dto'
import { CreateUserProfileDto } from './dto/create-user-profile.dto'
import { UpdateUserProfileDto } from './dto/update-user-profile.dto'

type UserProfileDto =
  | GetUserProfileDto
  | UpdateUserProfileDto
  | CreateUserProfileDto

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly repository: Repository<UserProfile>
  ) {}

  async get(kc_id: string): Promise<GetUserProfileDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ COMMITTED')

      const userProfile = await queryRunner.manager.findOne(UserProfile, {
        where: { id: kc_id },
      })

      let userProfileDto = null
      if (!userProfile) {
        userProfileDto = this.create(kc_id)
      } else {
        userProfileDto = new GetUserProfileDto(userProfile)
      }

      await queryRunner.commitTransaction()
      return userProfileDto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async create(
    kc_id: string,
    createUserProfileDto?: CreateUserProfileDto
  ): Promise<GetUserProfileDto> {
    const queryRunner: QueryRunner =
      this.repository.manager.connection.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ UNCOMMITTED')

      const userProfile = this.toUserProfile(kc_id, createUserProfileDto)
      await queryRunner.manager.save(UserProfile, userProfile)

      const newUserProfileDto = new GetUserProfileDto(userProfile)
      await queryRunner.commitTransaction()
      return newUserProfileDto
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  async update(
    kc_id: string,
    updateUserProfileDto: UpdateUserProfileDto
  ): Promise<GetUserProfileDto> {
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction('READ UNCOMMITTED')

      const currentUserProfile = await queryRunner.manager.findOne(
        UserProfile,
        {
          where: { id: kc_id },
        }
      )

      let newUserProfile: UserProfile = null

      if (!currentUserProfile) {
        const newUserProfileDto = await this.create(kc_id, updateUserProfileDto)
        newUserProfile = this.toUserProfile(kc_id, newUserProfileDto)
      } else {
        // Combine default DTO with new DTO. Useful for incomplete new DTO
        const currentUserProfileDto = new GetUserProfileDto(currentUserProfile)
        const newUserProfileDto = {
          ...currentUserProfileDto,
          ...updateUserProfileDto,
        }
        newUserProfile = this.toUserProfile(kc_id, newUserProfileDto)
        await queryRunner.manager.save(newUserProfile)
      }

      await queryRunner.commitTransaction()
      return new GetUserProfileDto(newUserProfile)
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
  }

  toUserProfile(kc_id: string, dto?: UserProfileDto): UserProfile {
    const userProfile = new UserProfile()
    userProfile.id = kc_id

    if (!dto) {
      return userProfile
    }

    Object.assign(userProfile, dto)

    return userProfile
  }
}
