// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { GetLogger } from '@B-S-F/autopilot-utils'
import { Octokit } from 'octokit'

const logger = GetLogger()

export async function getAppInstallation(
  octokit: Octokit,
  org: string,
  repo: string | undefined,
) {
  try {
    if (repo) {
      logger.debug(`Looking for app installation in ${org}/${repo}`)
      return await octokit.request(`GET /repos/${org}/${repo}/installation`)
    } else {
      logger.debug(`Looking for app installation in ${org}`)
      return await octokit.request(`GET /orgs/${org}/installation`)
    }
  } catch (e) {
    if ((e as Error).message) {
      const target = repo ? `${org}/${repo}` : org
      logger.error(
        `Error looking for app installation in ${target}: ${
          (e as Error).message
        }`,
      )
      process.exit(1)
    }
    throw e
  }
}
