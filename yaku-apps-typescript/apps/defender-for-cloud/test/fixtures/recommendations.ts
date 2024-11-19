// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const recommendationsProperties1 = {
  resourceDetails: {
    Source: 'Azure',
    Id: '/subscriptions/00000000-0000-0000-0000-0000000000/resourceGroups/badge-storage-accountproviders/Microsoft.Network/virtualNetworks/private-link-vnet',
  },
  displayName: 'Azure DDoS Protection Standard should be enabled',
  status: {
    code: 'Unhealthy',
    cause: 'VnetHasNoAppGateways',
    description:
      'There are no Application Gateway resources attached to this Virtual Network',
  },
}

export const recommendationsProperties2 = {
  resourceDetails: {
    Source: 'Azure',
    Id: '/subscriptions/00000000-0000-0000-0000-0000000000/resourceGroups/providers/Microsoft.Network/virtualNetworks/private-link-test-vnet/subnets/subnetPrivateLink',
  },
  displayName: 'Subnets should be associated with a network security group',
  status: {
    code: 'Unhealthy',
    cause: 'OffByPolicy',
    description: 'The recommendation is disabled in policy',
  },
}

export const recommendationsProperties3 = {
  resourceDetails: {
    Source: 'Azure',
    Id: '/subscriptions/00000000-0000-0000-0000-0000000000/resourceGroups/badge-storage-accountproviders/Microsoft.Network/virtualNetworks/private-link-vnet',
  },
  displayName: 'GKE cluster auto upgrade feature should be enabled',
  status: {
    code: 'Unhealthy',
  },
}

export const recommendationsProperties4 = {
  resourceDetails: {
    Source: 'Azure',
    Id: '/subscriptions/00000000-0000-0000-0000-0000000000/resourceGroups/badge-storage-accountproviders/Microsoft.Network/virtualNetworks/private-link-vnet',
  },
  displayName: 'GKE cluster auto upgrade feature should be enabled',
  status: {
    code: 'Healthy',
  },
}

export const recommendationsMetadataProperties1 = {
  displayName: 'Azure DDoS Protection Standard should be enabled',
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/a7aca53f-2ed4-4466-a25e-0b45ade68efd',
  description:
    'Defender for Cloud has discovered virtual networks with Application Gateway resources unprotected by the DDoS protection service. These resources contain public IPs. Enable mitigation of network volumetric and protocol attacks.',
  remediationDescription:
    "<br>1. Select a virtual network to enable the DDoS protection service standard on.<br>2. Select the Standard option.<br>3. Click 'Save'.",
  categories: ['Networking'],
  severity: 'Medium',
  userImpact: 'Moderate',
  implementationEffort: 'Moderate',
  threats: ['ThreatResistance', 'DenialOfService'],
}

export const recommendationsMetadataProperties2 = {
  displayName: 'Subnets should be associated with a network security group',
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/e71308d3-144b-4262-b144-efdc3cc90517',
  description:
    "Protect your subnet from potential threats by restricting access to it with a network security group (NSG). NSGs contain a list of Access Control List (ACL) rules that allow or deny network traffic to your subnet. When an NSG is associated with a subnet, the ACL rules apply to all the VM instances and integrated services in that subnet, but don't apply to internal traffic inside the subnet. To secure resources in the same subnet from one another, enable NSG directly on the resources as well.<br>Note that the following subnet types will be listed as not applicable: GatewaySubnet, AzureFirewallSubnet, AzureBastionSubnet.",
  remediationDescription:
    "To enable Network Security Groups on your subnets:<br>1. Select a subnet to enable NSG on.<br>2. Click the 'Network security group' section.<br>3. Follow the steps and select an existing network security group to attach to this specific subnet.",
  categories: ['IoT'],
  severity: 'High',
  userImpact: 'High',
  implementationEffort: 'Moderate',
  threats: ['MaliciousInsider', 'DataSpillage', 'DataExfiltration'],
}

export const recommendationsMetadataProperties3 = {
  displayName: 'GKE cluster auto upgrade feature should be enabled',
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/e71308d3-144b-4262-b144-efdc3cc90517',
  description:
    "This recommendation evaluates the management network property of a node pool for the key-value pair, 'key': 'autoUpgrade'.",
  remediationDescription:
    'A GKE cluster auto upgrade feature, which keeps clusters and node pools on the latest stable version of Kubernetes',
  categories: ['Compute'],
  severity: 'High',
  userImpact: 'High',
  implementationEffort: 'Low',
  threats: ['MaliciousInsider', 'DataSpillage'],
}

export const combinedRecommendationsProperties1 = {
  resourceDetails: {
    Source: 'Azure',
    Id: '/subscriptions/00000000-0000-0000-0000-0000000000/resourceGroups/badge-storage-accountproviders/Microsoft.Network/virtualNetworks/private-link-vnet',
  },
  displayName: 'Azure DDoS Protection Standard should be enabled',
  status: {
    code: 'Unhealthy',
    cause: 'VnetHasNoAppGateways',
    description:
      'There are no Application Gateway resources attached to this Virtual Network',
  },
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/a7aca53f-2ed4-4466-a25e-0b45ade68efd',
  description:
    'Defender for Cloud has discovered virtual networks with Application Gateway resources unprotected by the DDoS protection service. These resources contain public IPs. Enable mitigation of network volumetric and protocol attacks.',
  remediationDescription:
    "<br>1. Select a virtual network to enable the DDoS protection service standard on.<br>2. Select the Standard option.<br>3. Click 'Save'.",
  categories: ['Networking'],
  severity: 'Medium',
  userImpact: 'Moderate',
  implementationEffort: 'Moderate',
  threats: ['ThreatResistance', 'DenialOfService'],
}

export const combinedRecommendationsProperties2 = {
  resourceDetails: {
    Source: 'Azure',
    Id: '/subscriptions/00000000-0000-0000-0000-0000000000/resourceGroups/providers/Microsoft.Network/virtualNetworks/private-link-test-vnet/subnets/subnetPrivateLink',
  },
  displayName: 'Subnets should be associated with a network security group',
  status: {
    code: 'Unhealthy',
    cause: 'OffByPolicy',
    description: 'The recommendation is disabled in policy',
  },
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/e71308d3-144b-4262-b144-efdc3cc90517',
  description:
    "Protect your subnet from potential threats by restricting access to it with a network security group (NSG). NSGs contain a list of Access Control List (ACL) rules that allow or deny network traffic to your subnet. When an NSG is associated with a subnet, the ACL rules apply to all the VM instances and integrated services in that subnet, but don't apply to internal traffic inside the subnet. To secure resources in the same subnet from one another, enable NSG directly on the resources as well.<br>Note that the following subnet types will be listed as not applicable: GatewaySubnet, AzureFirewallSubnet, AzureBastionSubnet.",
  remediationDescription:
    "To enable Network Security Groups on your subnets:<br>1. Select a subnet to enable NSG on.<br>2. Click the 'Network security group' section.<br>3. Follow the steps and select an existing network security group to attach to this specific subnet.",
  categories: ['IoT'],
  severity: 'High',
  userImpact: 'High',
  implementationEffort: 'Moderate',
  threats: ['MaliciousInsider', 'DataSpillage', 'DataExfiltration'],
}

export const mockedHealthyRecommendation1 = {
  type: 'mockedType1',
  id: 'mockedId1',
  name: 'mockedName1',
  properties: recommendationsProperties4,
}

export const mockedHealthyRecommendation2 = {
  type: 'mockedType2',
  id: 'mockedId2',
  name: 'mockedName2',
  properties: recommendationsProperties4,
}

export const mockedUnhealthyRecommendation1 = {
  type: 'mockedType1',
  id: 'mockedId1',
  name: 'mockedName1',
  properties: recommendationsProperties1,
}

export const mockedUnhealthyRecommendation2 = {
  type: 'mockedType2',
  id: 'mockedId2',
  name: 'mockedName2',
  properties: recommendationsProperties2,
}

export const mockedCombinedRecommendationsFirstSet = [
  {
    type: 'mockedType1',
    id: 'mockedId1',
    name: 'mockedName1',
    properties: combinedRecommendationsProperties1,
  },
  {
    type: 'mockedType2',
    id: 'mockedId2',
    name: 'mockedName2',
    properties: combinedRecommendationsProperties2,
  },
]

export const mockedRecommendationsUnitTestsFirstSet = [
  {
    type: 'mockedType1',
    id: 'mockedId1',
    name: 'mockedName1',
    properties: recommendationsProperties1,
  },
  {
    type: 'mockedType2',
    id: 'mockedId2',
    name: 'mockedName2',
    properties: recommendationsProperties2,
  },
]

export const mockedRecommendationsUnitTestsSecondSet = [
  {
    type: 'mockedType3',
    id: 'mockedId3',
    name: 'mockedName3',
    properties: recommendationsProperties1,
  },
  {
    type: 'mockedType4',
    id: 'mockedId4',
    name: 'mockedName4',
    properties: recommendationsProperties2,
  },
]

export const mockedRecommendationsUnitTestsThirdSet = [
  {
    type: 'mockedType5',
    id: 'mockedId5',
    name: 'mockedName5',
    properties: recommendationsProperties1,
  },
  {
    type: 'mockedType6',
    id: 'mockedId6',
    name: 'mockedName6',
    properties: recommendationsProperties2,
  },
]

export const mockedRecommendationsMetadataUnitTestsFirstSet = [
  {
    type: 'mockedType1',
    id: 'mockedId1',
    name: 'mockedName1',
    properties: recommendationsMetadataProperties1,
  },
  {
    type: 'mockedType2',
    id: 'mockedId2',
    name: 'mockedName2',
    properties: recommendationsMetadataProperties2,
  },
]

export const mockedRecommendationsMetadataUnitTestsSecondSet = [
  {
    type: 'mockedType3',
    id: 'mockedId3',
    name: 'mockedName3',
    properties: recommendationsMetadataProperties1,
  },
  {
    type: 'mockedType4',
    id: 'mockedId4',
    name: 'mockedName4',
    properties: recommendationsMetadataProperties2,
  },
]

export const mockedRecommendationsMetadataUnitTestsThirdSet = [
  {
    type: 'mockedType5',
    id: 'mockedId5',
    name: 'mockedName5',
    properties: recommendationsMetadataProperties1,
  },
  {
    type: 'mockedType6',
    id: 'mockedId6',
    name: 'mockedName6',
    properties: recommendationsMetadataProperties2,
  },
]

export const recommendationsMetadataPropertiesMissingFields = {
  displayName: 'Azure DDoS Protection Standard should be enabled',
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/a7aca53f-2ed4-4466-a25e-0b45ade68efd',
  description:
    'Defender for Cloud has discovered virtual networks with Application Gateway resources unprotected by the DDoS protection service. These resources contain public IPs. Enable mitigation of network volumetric and protocol attacks.',
  remediationDescription:
    "<br>1. Select a virtual network to enable the DDoS protection service standard on.<br>2. Select the Standard option.<br>3. Click 'Save'.",
  categories: ['Networking'],
  severity: 'Medium',
}

export const recommendationsMetadataPropertiesEmptyFields = {
  displayName: 'Subnets should be associated with a network security group',
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/e71308d3-144b-4262-b144-efdc3cc90517',
  description:
    "Protect your subnet from potential threats by restricting access to it with a network security group (NSG). NSGs contain a list of Access Control List (ACL) rules that allow or deny network traffic to your subnet. When an NSG is associated with a subnet, the ACL rules apply to all the VM instances and integrated services in that subnet, but don't apply to internal traffic inside the subnet. To secure resources in the same subnet from one another, enable NSG directly on the resources as well.<br>Note that the following subnet types will be listed as not applicable: GatewaySubnet, AzureFirewallSubnet, AzureBastionSubnet.",
  remediationDescription:
    "To enable Network Security Groups on your subnets:<br>1. Select a subnet to enable NSG on.<br>2. Click the 'Network security group' section.<br>3. Follow the steps and select an existing network security group to attach to this specific subnet.",
  categories: ['IoT'],
  severity: 'High',
  userImpact: '',
  implementationEffort: '',
  threats: [],
}

export const combinedRecommendationsEmptyFields1 = {
  resourceDetails: {
    Source: 'Azure',
    Id: '/subscriptions/00000000-0000-0000-0000-0000000000/resourceGroups/badge-storage-accountproviders/Microsoft.Network/virtualNetworks/private-link-vnet',
  },
  displayName: 'Azure DDoS Protection Standard should be enabled',
  status: {
    code: 'Unhealthy',
    cause: 'VnetHasNoAppGateways',
    description:
      'There are no Application Gateway resources attached to this Virtual Network',
  },
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/a7aca53f-2ed4-4466-a25e-0b45ade68efd',
  description:
    'Defender for Cloud has discovered virtual networks with Application Gateway resources unprotected by the DDoS protection service. These resources contain public IPs. Enable mitigation of network volumetric and protocol attacks.',
  remediationDescription:
    "<br>1. Select a virtual network to enable the DDoS protection service standard on.<br>2. Select the Standard option.<br>3. Click 'Save'.",
  categories: ['Networking'],
  severity: 'Medium',
  userImpact: '',
  implementationEffort: '',
  threats: [],
}

export const combinedRecommendationsEmptyFields2 = {
  resourceDetails: {
    Source: 'Azure',
    Id: '/subscriptions/00000000-0000-0000-0000-0000000000/resourceGroups/providers/Microsoft.Network/virtualNetworks/private-link-test-vnet/subnets/subnetPrivateLink',
  },
  displayName: 'Subnets should be associated with a network security group',
  status: {
    code: 'Unhealthy',
    cause: 'OffByPolicy',
    description: 'The recommendation is disabled in policy',
  },
  assessmentType: 'BuiltIn',
  policyDefinitionId:
    '/providers/Microsoft.Authorization/policyDefinitions/e71308d3-144b-4262-b144-efdc3cc90517',
  description:
    "Protect your subnet from potential threats by restricting access to it with a network security group (NSG). NSGs contain a list of Access Control List (ACL) rules that allow or deny network traffic to your subnet. When an NSG is associated with a subnet, the ACL rules apply to all the VM instances and integrated services in that subnet, but don't apply to internal traffic inside the subnet. To secure resources in the same subnet from one another, enable NSG directly on the resources as well.<br>Note that the following subnet types will be listed as not applicable: GatewaySubnet, AzureFirewallSubnet, AzureBastionSubnet.",
  remediationDescription:
    "To enable Network Security Groups on your subnets:<br>1. Select a subnet to enable NSG on.<br>2. Click the 'Network security group' section.<br>3. Follow the steps and select an existing network security group to attach to this specific subnet.",
  categories: ['IoT'],
  severity: 'High',
  userImpact: '',
  implementationEffort: '',
  threats: [],
}

export const mockedRecommendationsMetadataMissingFields = [
  {
    type: 'mockedType1',
    id: 'mockedId1',
    name: 'mockedName1',
    properties: recommendationsMetadataPropertiesMissingFields,
  },
  {
    type: 'mockedType2',
    id: 'mockedId2',
    name: 'mockedName2',
    properties: recommendationsMetadataPropertiesEmptyFields,
  },
]

export const mockedCombinedRecommendationsWithEmptyFields = [
  {
    type: 'mockedType1',
    id: 'mockedId1',
    name: 'mockedName1',
    properties: combinedRecommendationsEmptyFields1,
  },
  {
    type: 'mockedType2',
    id: 'mockedId2',
    name: 'mockedName2',
    properties: combinedRecommendationsEmptyFields2,
  },
]

export const mockedRecommendationsIntegrationTests = [
  {
    id: 'mockedId1',
    name: 'mockedName1',
    properties: recommendationsProperties1,
  },
  {
    id: 'mockedId2',
    name: 'mockedName2',
    properties: recommendationsProperties2,
  },
  {
    id: 'mockedId3',
    name: 'mockedName3',
    properties: recommendationsProperties3,
  },
]

export const mockedRecommendationsMetadataIntegrationTests = [
  {
    id: 'mockedId1',
    name: 'mockedName1',
    properties: recommendationsMetadataProperties1,
  },
  {
    id: 'mockedId2',
    name: 'mockedName2',
    properties: recommendationsMetadataProperties2,
  },
  {
    id: 'mockedId3',
    name: 'mockedName3',
    properties: recommendationsMetadataProperties3,
  },
]

function setMetadata(recommendation, metadata) {
  metadata = {
    status: recommendation.properties?.status?.code,
    resourceDetails: recommendation.properties?.resourceDetails,
    policyDefinitionId: metadata.properties?.policyDefinitionId,
    assessmentType: metadata.properties?.assessmentType,
    description: metadata.properties?.description,
    remediationDescription: metadata.properties?.remediationDescription,
    categories: metadata.properties?.categories,
    severity: metadata.properties?.severity,
    userImpact: metadata.properties?.userImpact,
    implementationEffort: metadata.properties?.implementationEffort,
    threats: metadata.properties?.threats,
  }
  return metadata
}

export const integrationTestResultsRecommendationsFixture1 = [
  {
    result: {
      criterion: 'Open Security Recommendation Defender for Cloud',
      justification:
        'Found security recommendation with id: mockedId1 and display name: Azure DDoS Protection Standard should be enabled',
      fulfilled: false,
      metadata: setMetadata(
        mockedRecommendationsIntegrationTests[0],
        mockedRecommendationsMetadataIntegrationTests[0],
      ),
    },
  },
  {
    result: {
      criterion: 'Open Security Recommendation Defender for Cloud',
      justification:
        'Found security recommendation with id: mockedId2 and display name: Subnets should be associated with a network security group',
      fulfilled: false,
      metadata: setMetadata(
        mockedRecommendationsIntegrationTests[1],
        mockedRecommendationsMetadataIntegrationTests[1],
      ),
    },
  },
  {
    result: {
      criterion: 'Open Security Recommendation Defender for Cloud',
      justification:
        'Found security recommendation with id: mockedId3 and display name: GKE cluster auto upgrade feature should be enabled',
      fulfilled: false,
      metadata: setMetadata(
        mockedRecommendationsIntegrationTests[2],
        mockedRecommendationsMetadataIntegrationTests[2],
      ),
    },
  },
  {
    status: 'RED',
    reason: 'Retrieved 3 security recommendations based on given filters',
  },
]

export const integrationTestResultsRecommendationsFixture2 = [
  {
    result: {
      criterion: 'Open Security Recommendation Defender for Cloud',
      justification:
        'Found security recommendation with id: mockedId2 and display name: Subnets should be associated with a network security group',
      fulfilled: false,
      metadata: setMetadata(
        mockedRecommendationsIntegrationTests[1],
        mockedRecommendationsMetadataIntegrationTests[1],
      ),
    },
  },
  {
    result: {
      criterion: 'Open Security Recommendation Defender for Cloud',
      justification:
        'Found security recommendation with id: mockedId3 and display name: GKE cluster auto upgrade feature should be enabled',
      fulfilled: false,
      metadata: setMetadata(
        mockedRecommendationsIntegrationTests[2],
        mockedRecommendationsMetadataIntegrationTests[2],
      ),
    },
  },
  {
    status: 'RED',
    reason: 'Retrieved 2 security recommendations based on given filters',
  },
]

export const integrationTestResultsRecommendationsFixture3 = [
  {
    result: {
      criterion: 'Open Security Recommendation Defender for Cloud',
      justification:
        'Found security recommendation with id: mockedId3 and display name: GKE cluster auto upgrade feature should be enabled',
      fulfilled: false,
      metadata: setMetadata(
        mockedRecommendationsIntegrationTests[2],
        mockedRecommendationsMetadataIntegrationTests[2],
      ),
    },
  },
  {
    status: 'RED',
    reason: 'Retrieved 1 security recommendations based on given filters',
  },
]

export const integrationTestResultsRecommendationsFixtureGREEN = [
  {
    result: {
      criterion:
        'There are no security recommendations found based on given filters for Defender for Cloud',
      justification: 'No security recommendations found based on given filters',
      fulfilled: true,
      metadata: {},
    },
  },
  {
    status: 'GREEN',
    reason: 'No security recommendations found based on given filters',
  },
]
