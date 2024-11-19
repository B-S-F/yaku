// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Octokit } from 'octokit'
import { ProxyAgent, fetch as undiciFetch } from 'undici'
import githubAppJwt from 'universal-github-app-jwt'
import {
  GH_APP_ID,
  GH_APP_PRIVATE_KEY,
  GH_APP_ORG,
  GH_APP_REPO,
  checkEnvVariables,
} from './config.js'
import { getAppInstallation } from './octokit/get-app-installation.js'
import { getAppAccess } from './octokit/get-app-access.js'
import { AppOutput, GetLogger } from '@B-S-F/autopilot-utils'

export async function authCmd(options) {
  checkEnvVariables()
  const token = await ghAppAuth()
  const appOutput = new AppOutput()
  if (options.tokenOnly) {
    console.log(token)
  } else {
    appOutput.addOutput({ GITHUB_TOKEN: token })
    appOutput.write()
  }
}

const customFetch = (url: URL, options: any) => {
  const logger = GetLogger()
  if (process.env.HTTPS_PROXY) {
    logger.debug(`Using HTTPS proxy: ${process.env.HTTPS_PROXY}`)
    options.agent = new ProxyAgent({
      uri: process.env.HTTPS_PROXY,
    })
  } else if (process.env.HTTP_PROXY) {
    logger.debug(`Using HTTP proxy: ${process.env.HTTP_PROXY}`)
    options.agent = new ProxyAgent({
      uri: process.env.HTTP_PROXY,
    })
  }
  return undiciFetch(url, {
    ...options,
    dispatcher: options.agent,
  })
}

export async function ghAppAuth() {
  const logger = GetLogger()
  const { token } = await githubAppJwt({
    id: GH_APP_ID!,
    privateKey: GH_APP_PRIVATE_KEY!,
  })
  const octokit = new Octokit({
    auth: token,
    request: {
      fetch: customFetch,
    },
  })
  const target = GH_APP_REPO ? `${GH_APP_ORG}/${GH_APP_REPO}` : GH_APP_ORG
  const installation = await getAppInstallation(
    octokit,
    GH_APP_ORG!,
    GH_APP_REPO,
  )
  if (!installation || !installation!.data.id) {
    logger.error(`No app installation found in ${target}!`)
    process.exit(1)
  }
  const installationId = installation.data.id
  const appSlug = installation.data.app_slug
  logger.debug(
    `Found installation with id ${installationId} in ${target} for app ${appSlug}`,
  )
  logger.debug(`Requesting access token for installation ${installationId}`)
  const access = await getAppAccess(octokit, installationId)
  if (!access || !access.data.token) {
    logger.error(
      `No access token received for app installation ${installationId} in ${target}!`,
    )
    process.exit(1)
  }
  logger.info(
    `Logged in as '${appSlug}'. Please store the token in the environment variable 'GH_TOKEN'.`,
  )
  return access.data.token
}
