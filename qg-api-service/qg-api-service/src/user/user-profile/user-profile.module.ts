import { Module } from '@nestjs/common'
import { UserProfileController } from './user-profile.controller'
import { LocalKeyCloakModule } from '../../keycloak/local.keycloak.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserProfile } from './user-profile.entity'
import { UserProfileService } from './user-profile.service'

@Module({
  controllers: [UserProfileController],
  imports: [LocalKeyCloakModule, TypeOrmModule.forFeature([UserProfile])],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserProfileModule {}
