import { SetMetadata } from '@nestjs/common'

export const IsPublicAPI = 'isPublicApi'
export const Public = () => SetMetadata(IsPublicAPI, true)
