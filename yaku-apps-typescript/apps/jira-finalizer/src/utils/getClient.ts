import { JiraClient, RestClientImpl } from '../../lib/index.js'
// import { DebugClient } from "../../lib/index.js";

import {
  JIRA_API_URL,
  JIRA_API_VERSION,
  JIRA_PASSWORD,
  JIRA_USERNAME,
} from '../config.js'

export default (): JiraClient => {
  if (!JIRA_USERNAME) {
    throw new Error('Environment JIRA_USERNAME is not defined')
  }
  if (!JIRA_PASSWORD) {
    throw new Error('Environment JIRA_PASSWORD is not defined')
  }
  const basicAuth = Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD}`).toString(
    'base64',
  )
  const crudClient = new RestClientImpl(
    JIRA_API_URL + `/${JIRA_API_VERSION}`,
    basicAuth,
  )
  return new JiraClient(crudClient)
}
