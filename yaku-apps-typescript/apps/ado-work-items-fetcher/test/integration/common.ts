import * as fs from 'fs'
import * as path from 'path'
import { expect } from 'vitest'
import { MOCK_SERVER_CERT_PATH } from '../../../../integration-tests/src/util'

export const fixturesPath: string = path.join(__dirname, 'fixtures')
export const evidencePath: string = path.join(__dirname, 'evidence_tmp')
export const adoFetcherExecutable: string = path.join(
  __dirname,
  '..',
  '..',
  'dist',
  'index.js'
)

export const mockServerPort = 8080

export const defaultAdoEnvironment = {
  ADO_URL: `https://localhost:${mockServerPort}`,
  ADO_API_ORG: 'adoApiOrg',
  ADO_API_PROJECT: 'adoApiProject',
  ADO_API_PERSONAL_ACCESS_TOKEN: 'pat', // will be base64-encoded as OnBhdA== in the auth header
  ADO_CONFIG_FILE_PATH: path.join(fixturesPath, 'config.yaml'),
  evidence_path: evidencePath,
  NODE_EXTRA_CA_CERTS: MOCK_SERVER_CERT_PATH,
} as const

export function verifyNoOutputFileWasWritten() {
  const outputFile: string = path.join(evidencePath, 'data.json')
  expect(fs.existsSync(outputFile)).toEqual(false)
}
