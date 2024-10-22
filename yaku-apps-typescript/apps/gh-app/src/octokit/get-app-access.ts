import { GetLogger } from '@B-S-F/autopilot-utils'
import { Octokit } from 'octokit'

const logger = GetLogger()

export async function getAppAccess(octokit: Octokit, installationId: number) {
  try {
    return await octokit.request(
      `POST /app/installations/${installationId}/access_tokens`
    )
  } catch (e) {
    if ((e as Error).message) {
      logger.error(
        `Error requesting access token for app installation ${installationId}: ${
          (e as Error).message
        }`
      )
      process.exit(1)
    }
    throw e
  }
}
