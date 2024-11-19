import { GetLogger } from '@B-S-F/autopilot-utils'

export const { GH_APP_ID, GH_APP_PRIVATE_KEY, GH_APP_ORG, GH_APP_REPO } =
  process.env

export const checkEnvVariables = () => {
  const logger = GetLogger()
  const { GH_APP_ID, GH_APP_PRIVATE_KEY, GH_APP_ORG, GH_APP_REPO } = process.env
  let exit = false
  if (!GH_APP_ID) {
    logger.error('GH_APP_ID is not set')
    exit = true
  }
  if (!GH_APP_PRIVATE_KEY) {
    logger.error('GH_APP_PRIVATE_KEY is not set')
    exit = true
  }
  if (!(GH_APP_ORG || (GH_APP_ORG && GH_APP_REPO))) {
    logger.error(
      'Either GH_APP_ORG or both GH_APP_ORG and GH_APP_REPO must be set',
    )
    exit = true
  }
  if (exit) {
    process.exit(1)
  }
}
