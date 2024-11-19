import { ApiClient } from '@B-S-F/yaku-client-lib'
import {
  handleStandardParams,
  logResultAsJson,
  logSuccess,
  parseIntParameter,
} from '../common.js'

export async function listNewTokens(client: ApiClient) {
  handleStandardParams(client)
  await logResultAsJson(client.listNewTokens())
}

export async function createNewToken(client: ApiClient, description: string) {
  handleStandardParams(client)
  await logResultAsJson(client.createNewToken(description))
}

export async function revokeNewToken(client: ApiClient, id: string) {
  handleStandardParams(client)
  const tokenId = parseIntParameter(id, 'id')
  await logSuccess(
    client.revokeNewToken(tokenId),
    `Token with id ${id} has been revoked. The change will be effective in at most 60 seconds.`,
  )
}
