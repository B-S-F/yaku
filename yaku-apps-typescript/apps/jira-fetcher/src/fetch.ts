import fetch from 'node-fetch'
import { ProxyAgent } from 'proxy-agent'
import { AppError } from '@B-S-F/autopilot-utils'

export interface JiraResponse {
  issues: []
  maxResults: number
  startAt: number
  total: number
}

export interface Dictionary {
  [key: string]: any
}

const SEARCH_PATH = 'rest/api/2/search'

const fetchProxyAgent = new ProxyAgent()

const getFilters = (configData: any) => {
  return {
    maxResults: -1, // takes the limit
    startAt: 0,
    jql: configData.query,
    fields: configData.neededFields,
  }
}

export const getAuthorization = (
  pat: string | undefined,
  username: string | undefined,
  password: string | undefined
): string => {
  if (!pat && !(username && password)) {
    throw new AppError(
      'No authentication data was provided, either pass JIRA_PAT or JIRA_USERNAME and JIRA_USER_PORTAL_PASSWORD'
    )
  }
  if (pat?.trim()) {
    return `Bearer ${pat.trim()}`
  } else {
    return (
      'Basic' + ' ' + Buffer.from(username + ':' + password).toString('base64')
    )
  }
}

const getHeaders = (
  pat: string | undefined,
  username: string | undefined,
  password: string | undefined
) => {
  return {
    Authorization: getAuthorization(pat, username, password),
    'Content-Type': 'application/json',
  }
}

export const fetchData = async (
  url: string,
  pat: string | undefined,
  username: string | undefined,
  password: string | undefined,
  configData: Dictionary
) => {
  const headers = getHeaders(pat, username, password)
  const apiUrl = new URL(url + '/' + SEARCH_PATH)
  const body = getFilters(configData)
  const data: any[] = []
  let responseObj: JiraResponse

  do {
    const response = await fetch(apiUrl.href, {
      method: 'POST',
      mode: 'cors',
      headers: headers,
      body: JSON.stringify(body),
      agent: fetchProxyAgent,
    } as any)
    if (response.status !== 200) {
      const msg = await response.text()
      throw new AppError(
        `Something went wrong while requesting data from Jira! ${response.status} ${msg}`
      )
    }
    const responseText = await response.text()
    try {
      responseObj = JSON.parse(responseText)
    } catch (error) {
      if (
        responseText.includes('Please activate JavaScript in your browser.')
      ) {
        const message =
          'Incorrect username or password! Please make sure you use your WAM/Portal credentials, ' +
          'in case of which the password is different from the NT user account. '
        throw new AppError(`${message}. Status code: ${response.status}`)
      } else {
        throw new AppError(
          `Something went wrong while requesting data from Jira! Status code: ${response.status}`
        )
      }
    }
    data.push(...responseObj.issues)
    body.startAt += responseObj.maxResults
  } while (body.startAt < responseObj.total)

  return data
}

export const prepareDataToBeExported = (issues: any[], url: string) => {
  return issues.map((issue) => {
    return {
      id: issue.id,
      url: new URL(url + '/browse/' + issue.key).href,
      ...issue.fields,
    }
  })
}

export const __t = process.env.VITEST
  ? {
      getFilters,
      getHeaders,
    }
  : null
