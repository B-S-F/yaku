// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const alertProperties1 = {
  compromisedEntity: 'runner-aks-dev',
  alertType: 'K8S_PrivilegedContainer',
  alertDisplayName: 'Privileged container detected',
  description:
    "Kubernetes audit log analysis detected a new privileged container. A privileged container has access to the node's resources and breaks the isolation between containers. If compromised, an attacker can use the privileged container to gain access to the node.",
  severity: 'Informational',
  timeGeneratedUtc: '2023-11-30T03:16:14.5970315Z',
  productComponentName: 'Containers',
  remediationSteps:
    '["Find the container in the alert details.","If the container doesn’t need to run in privileged mode, remove the privileges from the container.","If the container is not legitimate, escalate the alert to the information security team."]',
  alertUri:
    'https://portal.azure.com/#blade/Microsoft_Azure_Security_AzureDefenderForData/AlertBlade/alertId/00000000-0000-0000-0000-0000000000/subscriptionId/00000000-0000-0000-0000-0000000000',
}

export const alertProperties2 = {
  compromisedEntity: 'dev1aks',
  alertType: 'K8S.NODE_SuspectDownloadArtifacts',
  alertDisplayName: 'Detected suspicious file download',
  description:
    'Analysis of processes running within a container or directly on a Kubernetes node, has detected a suspicious download of a remote file.',
  severity: 'Low',
  timeGeneratedUtc: '2023-10-02T11:10:23.2999447Z',
  productComponentName: 'Containers',
  remediationSteps:
    '["Review and confirm that the command identified in the alert was legitimate activity that you expect to see on this host or device. If not, escalate the alert to the information security team."]',
  alertUri:
    'https://portal.azure.com/#blade/Microsoft_Azure_Security_AzureDefenderForData/AlertBlade/alertId/00000000-0000-0000-0000-0000000000/subscriptionId/00000000-0000-0000-0000-0000000000',
}

export const mockedAlertsUnitTestsFirstSet = [
  {
    id: 'mockedId1',
    properties: alertProperties1,
  },
  {
    id: 'mockedId2',
    properties: alertProperties2,
  },
]

export const mockedAlertsUnitTestsSecondSet = [
  {
    id: 'mockedId3',
    properties: alertProperties1,
  },
  {
    id: 'mockedId4',
    properties: alertProperties2,
  },
]

export const mockedAlertsUnitTestsThirdSet = [
  {
    id: 'mockedId5',
    properties: alertProperties1,
  },
  {
    id: 'mockedId6',
    properties: alertProperties2,
  },
]

export const mockedAlertsIntegrationTests = [
  {
    id: 'mockedId1',
    properties: alertProperties1,
  },
  {
    id: 'mockedId2',
    properties: alertProperties2,
  },
  {
    id: 'mockedId3',
    properties: alertProperties1,
  },
  {
    id: 'mockedId4',
    properties: alertProperties1,
  },
]

export const integrationTestResultsAlertsFixture1 = [
  {
    result: {
      criterion: 'Open Security Alert Defender for Cloud',
      justification:
        'Found security alert with id: mockedId1 and display name: Privileged container detected',
      fulfilled: false,
      metadata: alertProperties1,
    },
  },
  {
    result: {
      criterion: 'Open Security Alert Defender for Cloud',
      justification:
        'Found security alert with id: mockedId2 and display name: Detected suspicious file download',
      fulfilled: false,
      metadata: alertProperties2,
    },
  },
  {
    result: {
      criterion: 'Open Security Alert Defender for Cloud',
      justification:
        'Found security alert with id: mockedId3 and display name: Privileged container detected',
      fulfilled: false,
      metadata: alertProperties1,
    },
  },
  {
    result: {
      criterion: 'Open Security Alert Defender for Cloud',
      justification:
        'Found security alert with id: mockedId4 and display name: Privileged container detected',
      fulfilled: false,
      metadata: alertProperties1,
    },
  },
  {
    status: 'RED',
    reason: 'Retrieved 4 alerts based on given filters',
  },
]

export const integrationTestResultsAlertsFixture2 = [
  {
    result: {
      criterion: 'Open Security Alert Defender for Cloud',
      justification:
        'Found security alert with id: mockedId1 and display name: Privileged container detected',
      fulfilled: false,
      metadata: alertProperties1,
    },
  },
  {
    result: {
      criterion: 'Open Security Alert Defender for Cloud',
      justification:
        'Found security alert with id: mockedId3 and display name: Privileged container detected',
      fulfilled: false,
      metadata: alertProperties1,
    },
  },
  {
    result: {
      criterion: 'Open Security Alert Defender for Cloud',
      justification:
        'Found security alert with id: mockedId4 and display name: Privileged container detected',
      fulfilled: false,
      metadata: alertProperties1,
    },
  },
  {
    status: 'RED',
    reason: 'Retrieved 3 alerts based on given filters',
  },
]

export const integrationTestResultsAlertsFixture3 = [
  {
    result: {
      criterion: 'Open Security Alert Defender for Cloud',
      justification:
        'Found security alert with id: mockedId2 and display name: Detected suspicious file download',
      fulfilled: false,
      metadata: alertProperties2,
    },
  },
  {
    status: 'RED',
    reason: 'Retrieved 1 alerts based on given filters',
  },
]

export const integrationTestResultsFixtureFAILED = [
  {
    status: 'FAILED',
    reason: 'Request failed with status code 400',
  },
]

export const integrationTestResultsFixtureForClientSecretFAILED = [
  {
    status: 'FAILED',
    reason: 'Request failed with status code 401',
  },
]

export const integrationTestResultsAlertsFixtureGREEN = [
  {
    result: {
      criterion:
        'There are no alerts found based on given filters for Defender for Cloud',
      justification: 'No alerts found based on given filters',
      fulfilled: true,
      metadata: {},
    },
  },
  {
    status: 'GREEN',
    reason: 'No alerts found based on given filters',
  },
]
