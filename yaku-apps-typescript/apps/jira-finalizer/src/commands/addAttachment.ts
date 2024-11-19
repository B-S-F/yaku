// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import getClient from '../utils/getClient.js'

export default async function (
  issueId: string,
  filePath: string
): Promise<void> {
  const client = getClient()
  const res = await client.addAttachment(issueId, filePath)
  console.log(`Attached file with ID: ${res[0].id}`)
  return
}
