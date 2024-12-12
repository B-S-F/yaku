// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import {
  azureDevopsWorkItemsFetcher,
  azureDevopsWorkItemsEvaluator,
} from './azureDevopsWorkItems'
import { artifactoryFetcher } from './artifactory'
import { docupediaFetcher } from './docupedia'
import { gitFetcher } from './git'
import { jsonEvaluator } from './json'
import { jiraEvaluator, jiraFetcher } from './jira'
import { manualAnswerEvaluator } from './manualAnswer'
import { pdfSignatureEvaluator } from './pdfSignatures'
import { sharepointEvaluator, sharepointFetcher } from './sharepoint'
import { sonarqubeEvaluator, sonarqubeFetcher } from './sonarqube'
import { splunkFetcher } from './splunk'

export const APP_SAMPLE = [
  azureDevopsWorkItemsFetcher,
  azureDevopsWorkItemsEvaluator,
  artifactoryFetcher,
  docupediaFetcher,
  gitFetcher,
  jiraFetcher,
  jiraEvaluator,
  jsonEvaluator,
  manualAnswerEvaluator,
  pdfSignatureEvaluator,
  sharepointEvaluator,
  sharepointFetcher,
  sonarqubeEvaluator,
  sonarqubeFetcher,
  splunkFetcher,
]
