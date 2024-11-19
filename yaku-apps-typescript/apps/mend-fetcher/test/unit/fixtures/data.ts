// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

export const organizationData = {
  uuid: 'organization-uuid',
  name: 'organization-name',
}

export const projectData = {
  uuid: 'project-uuid',
  name: 'project-name',
  path: 'product-name',
  productName: 'product-name',
  productUuid: 'product-uuid',
}

export const projectVitalsData = {
  lastScan: 'projectVitals-lastScan',
  lastUserScanned: {
    uuid: 'projectVitals-lastUserScannedUserUuid',
    name: 'projectVitals-lastUserScannedUserName',
    email: 'projectVitals-lastUserScannedUserEmail',
    userType: 'projectVitals-lastUserScannedUserType',
  },
  requestToken: 'projectVitals-requestToken',
  lastSourceFileMatch: 'projectVitals-lastSourceFileMatch',
  lastScanComment: 'projectVitals-lastScanComment',
  projectCreationDate: 'projectVitals-projectCreationDate',
  pluginName: 'projectVitals-pluginName',
  pluginVersion: 'projectVitals-pluginVersion',
  libraryCount: 2,
}

export const policyAlertsData = [
  {
    uuid: 'policyAlert1-uuid',
    name: 'policyAlert1-name',
    type: 'policyAlert1',
    component: {
      uuid: 'policyAlert1-componentUuid',
      name: 'policyAlert1-componentName',
      description: 'policyAlert1-componentDescription',
      libraryType: 'policyAlert1-libraryType',
    },
    alertInfo: {
      status: 'policyAlert1-alertInfoStatus',
      comment: {},
      detectedAt: 'policyAlert1-alertInfoDetectedAt',
      modifiedAt: 'policyAlert1-alertInfoModifiedAt',
    },
    project: {
      uuid: 'policyAlert1-projectUuid',
      name: 'policyAlert1-projectName',
      path: 'policyAlert1-path',
      productUuid: 'policyAlert1-productUuid',
    },
    policyName: 'policyAlert1-policyName',
  },
  {
    uuid: 'policyAlert2-uuid',
    name: 'policyAlert2-name',
    type: 'policyAlert2',
    component: {
      uuid: 'policyAlert2-componentUuid',
      name: 'policyAlert2-componentName',
      description: 'policyAlert2-componentDescription',
      libraryType: 'policyAlert2-libraryType',
    },
    alertInfo: {
      status: 'policyAlert2-alertInfoStatus',
      comment: {},
      detectedAt: 'policyAlert2-alertInfoDetectedAt',
      modifiedAt: 'policyAlert2-alertInfoModifiedAt',
    },
    project: {
      uuid: 'policyAlert2-projectUuid',
      name: 'policyAlert2-projectName',
      path: 'policyAlert2-path',
      productUuid: 'policyAlert2-productUuid',
    },
    policyName: 'policyAlert2-policyName',
  },
]

export const multipleLicensesAlertsData = [
  {
    uuid: 'multipleLicensesAlert1-uuid',
    name: 'multipleLicensesAlert1-name',
    type: 'multipleLicensesAlert1',
    component: {
      uuid: 'multipleLicensesAlert1-componentUuid',
      name: 'multipleLicensesAlert1-componentName',
      description: 'multipleLicensesAlert1-componentDescription',
      libraryType: 'multipleLicensesAlert1-libraryType',
    },
    alertInfo: {
      status: 'multipleLicensesAlert1-alertInfoStatus',
      comment: {},
      detectedAt: 'multipleLicensesAlert1-alertInfoDetectedAt',
      modifiedAt: 'multipleLicensesAlert1-alertInfoModifiedAt',
    },
    project: {
      uuid: 'multipleLicensesAlert1-projectUuid',
      name: 'multipleLicensesAlert1-projectName',
      path: 'multipleLicensesAlert1-path',
      productUuid: 'multipleLicensesAlert1-productUuid',
    },
    numberOfLicenses: 1,
    licenses: ['multipleLicensesAlert1-licenses'],
  },
  {
    uuid: 'multipleLicensesAlert2-uuid',
    name: 'multipleLicensesAlert2-name',
    type: 'multipleLicensesAlert2',
    component: {
      uuid: 'multipleLicensesAlert2-componentUuid',
      name: 'multipleLicensesAlert2-componentName',
      description: 'multipleLicensesAlert2-componentDescription',
      libraryType: 'multipleLicensesAlert2-libraryType',
    },
    alertInfo: {
      status: 'multipleLicensesAlert2-alertInfoStatus',
      comment: {},
      detectedAt: 'multipleLicensesAlert2-alertInfoDetectedAt',
      modifiedAt: 'multipleLicensesAlert2-alertInfoModifiedAt',
    },
    project: {
      uuid: 'multipleLicensesAlert2-projectUuid',
      name: 'multipleLicensesAlert2-projectName',
      path: 'multipleLicensesAlert2-path',
      productUuid: 'multipleLicensesAlert2-productUuid',
    },
    numberOfLicenses: 2,
    licenses: ['multipleLicensesAlert2-licenses'],
  },
]

export const newVersionsAlertsData = [
  {
    uuid: 'newVersionsAlert1-uuid',
    name: 'newVersionsAlert1-name',
    type: 'newVersionsAlert1',
    component: {
      uuid: 'newVersionsAlert1-componentUuid',
      name: 'newVersionsAlert1-componentName',
      description: 'newVersionsAlert1-componentDescription',
      libraryType: 'newVersionsAlert1-libraryType',
    },
    alertInfo: {
      status: 'newVersionsAlert1-alertInfoStatus',
      comment: {},
      detectedAt: 'newVersionsAlert1-alertInfoDetectedAt',
      modifiedAt: 'newVersionsAlert1-alertInfoModifiedAt',
    },
    project: {
      uuid: 'newVersionsAlert1-projectUuid',
      name: 'newVersionsAlert1-projectName',
      path: 'newVersionsAlert1-path',
      productUuid: 'newVersionsAlert1-productUuid',
    },
    availableVersion: 'newVersionsAlert1-availableVersion',
    availableVersionType: 'newVersionsAlert1-availableVersionType',
  },
  {
    uuid: 'newVersionsAlert2-uuid',
    name: 'newVersionsAlert2-name',
    type: 'newVersionsAlert2',
    component: {
      uuid: 'newVersionsAlert2-componentUuid',
      name: 'newVersionsAlert2-componentName',
      description: 'newVersionsAlert2-componentDescription',
      libraryType: 'newVersionsAlert2-libraryType',
    },
    alertInfo: {
      status: 'newVersionsAlert2-alertInfoStatus',
      comment: {},
      detectedAt: 'newVersionsAlert2-alertInfoDetectedAt',
      modifiedAt: 'newVersionsAlert2-alertInfoModifiedAt',
    },
    project: {
      uuid: 'newVersionsAlert2-projectUuid',
      name: 'newVersionsAlert2-projectName',
      path: 'newVersionsAlert2-path',
      productUuid: 'newVersionsAlert2-productUuid',
    },
    availableVersion: 'newVersionsAlert2-availableVersion',
    availableVersionType: 'newVersionsAlert2-availableVersionType',
  },
]

export const rejectedInUseAlertsData = [
  {
    uuid: 'rejectedInUseAlert1-uuid',
    name: 'rejectedInUseAlert1-name',
    type: 'rejectedInUseAlert1',
    component: {
      uuid: 'rejectedInUseAlert1-componentUuid',
      name: 'rejectedInUseAlert1-componentName',
      description: 'rejectedInUseAlert1-componentDescription',
      libraryType: 'rejectedInUseAlert1-libraryType',
    },
    alertInfo: {
      status: 'rejectedInUseAlert1-alertInfoStatus',
      comment: {},
      detectedAt: 'rejectedInUseAlert1-alertInfoDetectedAt',
      modifiedAt: 'rejectedInUseAlert1-alertInfoModifiedAt',
    },
    project: {
      uuid: 'rejectedInUseAlert1-projectUuid',
      name: 'rejectedInUseAlert1-projectName',
      path: 'rejectedInUseAlert1-path',
      productUuid: 'rejectedInUseAlert1-productUuid',
    },
    description: 'rejectedInUseAlert1-description',
  },
  {
    uuid: 'rejectedInUseAlert2-uuid',
    name: 'rejectedInUseAlert2-name',
    type: 'rejectedInUseAlert2',
    component: {
      uuid: 'rejectedInUseAlert2-componentUuid',
      name: 'rejectedInUseAlert2-componentName',
      description: 'rejectedInUseAlert2-componentDescription',
      libraryType: 'rejectedInUseAlert2-libraryType',
    },
    alertInfo: {
      status: 'rejectedInUseAlert2-alertInfoStatus',
      comment: {},
      detectedAt: 'rejectedInUseAlert2-alertInfoDetectedAt',
      modifiedAt: 'rejectedInUseAlert2-alertInfoModifiedAt',
    },
    project: {
      uuid: 'rejectedInUseAlert2-projectUuid',
      name: 'rejectedInUseAlert2-projectName',
      path: 'rejectedInUseAlert2-path',
      productUuid: 'rejectedInUseAlert2-productUuid',
    },
    description: 'rejectedInUseAlert2-description',
  },
]

export const securityAlertsData = [
  {
    uuid: 'securityAlert1-uuid',
    name: 'securityAlert1-name',
    type: 'securityAlert1-type',
    component: {
      uuid: 'securityAlert1-componentUuid',
      name: 'securityAlert1-componentName',
      description: 'securityAlert1-componentDescription',
      componentType: 'securityAlert1-componentType',
      libraryType: 'securityAlert1-componentLibraryType',
      directDependency: false,
      references: {
        url: 'securityAlert1-componentReferencesUrl',
        homePage: 'securityAlert1-componentReferencesHomePage',
        genericPackageIndex:
          'securityAlert1-componentReferencesGenericPackageIndex',
      },
      groupId: 'securityAlert1-componentGroupId',
      artifactId: 'securityAlert1-componentArtifactId',
      version: 'securityAlert1-componentVersion',
      path: 'securityAlert1-componentPath',
    },
    alertInfo: {
      status: 'securityAlert1-alertInfoStatus',
      comment: {},
      detectedAt: 'securityAlert1-alertInfoDetectedAt',
      modifiedAt: 'securityAlert1-alertInfoModifiedAt',
    },
    project: {
      uuid: 'securityAlert1-projectUuid',
      name: 'securityAlert1-projectName',
      path: 'securityAlert1-productName',
      productUuid: 'securityAlert1-productUuid',
    },
    product: {
      uuid: 'securityAlert1-productUuid',
      name: 'securityAlert1-productName',
    },
    vulnerability: {
      name: 'securityAlert1-vulnerabilityName',
      type: 'securityAlert1-vulnerabilityType',
      description: 'securityAlert1-vulnerabilityDescription',
      score: 7.5,
      severity: 'securityAlert1-vulnerabilitySeverity',
      publishDate: 'securityAlert1-vulnerabilityPublishDate',
      modifiedDate: 'securityAlert1-vulnerabiltyModifiedDate',
      vulnerabilityScoring: [
        {
          score: 9.9,
          severity: 'securityAlert1-vulnerabilityScoringScore',
          type: 'securityAlert1-vulnerabilityScoringType',
        },
      ],
    },
    topFix: {
      id: 123456,
      vulnerability: 'securityAlert1-topFixVulnerability',
      type: 'securityAlert1-topFixType',
      origin: 'securityAlert1-topFixOrigin',
      url: 'securityAlert1-topFixUrl',
      fixResolution: 'securityAlert1-topFixFixResolution',
      date: 'securityAlert1-topFixDate',
      message: 'securityAlert1-topFixMessage',
      extraData: {},
    },
    effective: 'securityAlert1-effective',
  },
  {
    uuid: 'securityAlert2-uuid',
    name: 'securityAlert2-name',
    type: 'securityAlert2-type',
    component: {
      uuid: 'securityAlert2-componentUuid',
      name: 'securityAlert2-componentName',
      description: 'securityAlert2-componentDescription',
      componentType: 'securityAlert2-componentType',
      libraryType: 'securityAlert2-componentLibraryType',
      directDependency: false,
      references: {
        url: 'securityAlert2-componentReferencesUrl',
        homePage: 'securityAlert2-componentReferencesHomePage',
        genericPackageIndex:
          'securityAlert2-componentReferencesGenericPackageIndex',
      },
      groupId: 'securityAlert2-componentGroupId',
      artifactId: 'securityAlert2-componentArtifactId',
      version: 'securityAlert2-componentVersion',
      path: 'securityAlert2-componentPath',
    },
    alertInfo: {
      status: 'securityAlert2-alertInfoStatus',
      comment: {},
      detectedAt: 'securityAlert2-alertInfoDetectedAt',
      modifiedAt: 'securityAlert2-alertInfoModifiedAt',
    },
    project: {
      uuid: 'securityAlert2-projectUuid',
      name: 'securityAlert2-projectName',
      path: 'securityAlert2-productName',
      productUuid: 'securityAlert2-productUuid',
    },
    product: {
      uuid: 'securityAlert2-productUuid',
      name: 'securityAlert2-productName',
    },
    vulnerability: {
      name: 'securityAlert2-vulnerabilityName',
      type: 'securityAlert2-vulnerabilityType',
      description: 'securityAlert2-vulnerabilityDescription',
      score: 7.5,
      severity: 'securityAlert2-vulnerabilitySeverity',
      publishDate: 'securityAlert2-vulnerabilityPublishDate',
      modifiedDate: 'securityAlert2-vulnerabiltyModifiedDate',
      vulnerabilityScoring: [
        {
          score: 9.9,
          severity: 'securityAlert2-vulnerabilityScoringScore',
          type: 'securityAlert2-vulnerabilityScoringType',
        },
      ],
    },
    topFix: {
      id: 123456,
      vulnerability: 'securityAlert2-topFixVulnerability',
      type: 'securityAlert2-topFixType',
      origin: 'securityAlert2-topFixOrigin',
      url: 'securityAlert2-topFixUrl',
      fixResolution: 'securityAlert2-topFixFixResolution',
      date: 'securityAlert2-topFixDate',
      message: 'securityAlert2-topFixMessage',
      extraData: {},
    },
    effective: 'securityAlert2-effective',
  },
]

export const librariesData = [
  {
    uuid: 'library1-uuid',
    name: 'library1',
    artifactId: 'library1-artifactId',
    groupId: 'library1-groupdId',
    version: 'library1-version',
    architecture: 'library1-architecture',
    languageVersion: 'library1-languageVersion',
    classifier: 'library1-classifier',
    extension: 'library1-extension',
    sha1: 'library1-sha1',
    description: 'library1-description',
    type: 'library1-type',
    directDependency: false,
    licenses: [
      {
        uuid: 'license1-uuid',
        name: 'license1',
        assignedByUser: false,
        licenseReferences: [
          {
            uuid: 'licenseReference1-uuid',
            type: 'licenseReference1-type',
            liabilityReference: 'licenseReference1-liabilityRef',
            information: 'licenseReference1-info',
          },
        ],
      },
    ],
    copyrightReferences: [],
    locations: [],
  },
  {
    uuid: 'library2-uuid',
    name: 'library2',
    artifactId: 'library2-artifactId',
    groupId: 'library2-groupdId',
    version: 'library2-version',
    architecture: 'library2-architecture',
    languageVersion: 'library2-languageVersion',
    classifier: 'library2-classifier',
    extension: 'library2-extension',
    sha1: 'library2-sha1',
    description: 'library2-description',
    type: 'library2-type',
    directDependency: false,
    licenses: [
      {
        uuid: 'license2-uuid',
        name: 'license2',
        assignedByUser: false,
        licenseReferences: [
          {
            uuid: 'licenseReference2-uuid',
            type: 'licenseReference2-type',
            liabilityReference: 'licenseReference2-liabilityRef',
            information: 'licenseReference2-info',
          },
        ],
      },
    ],
    copyrightReferences: [
      {
        type: 'library1-copyrightReference1Type',
        copyright: 'library1-copyrightReference1Copyright',
        startYear: 'library1-copyrightReference1StartYear',
        endYear: 'library1-copyrightReference1EndYear',
        author: 'library1-copyrightReference1Author',
        referenceInfo: 'library1-copyrightReferenceReference1Info',
      },
      {
        type: 'library1-copyrightReference2Type',
        copyright: 'library1-copyrightReference2Copyright',
        startYear: 'library1-copyrightReference2StartYear',
        endYear: 'library1-copyrightReference2EndYear',
        author: 'library1-copyrightReference2Author',
        referenceInfo: 'library1-copyrightReference2ReferenceInfo',
      },
    ],
    locations: [
      {
        localPath: 'library2-location1LocalPath',
        dependencyFile: 'library2-location1DependencyFile',
      },
      {
        localPath: 'library2-location2LocalPath',
        dependencyFile: 'library2-location2DependencyFile',
      },
    ],
  },
]

export const vulnerabilitiesData = [
  {
    name: 'vulnerability1-name',
    type: 'vulnerability1-type',
    description: 'vulnerability1-description',
    score: 9.9,
    severity: 'vulnerability1-severity',
    publishDate: 'vulnerability1-publishDate',
    modifiedDate: 'vulnerability1-modifiedDate',
    vulnerabilityScoring: [
      {
        score: 9.9,
        severity: 'vulnerability1-vulnerabilityScoringSeverity',
        type: 'vulnerability1-vulnerabilityScoringType',
        extraData: {
          confidentialityImpact:
            'vulnerability1-vulnerabilityScoringExtraDataConfidentialityImpact',
          attackComplexity:
            'vulnerability1-vulnerabilityScoringExtraDataAttackComplexity',
          scope: 'vulnerability1-vulnerabilityScoringExtraDataScope',
          availabilityImpact:
            'vulnerability1-vulnerabilityScoringExtraDataAvailabilityImpact',
          attackVector:
            'vulnerability1-vulnerabilityScoringExtraDataAttackVector',
          integrityImpact:
            'vulnerability1-vulnerabilityScoringExtraDataIntegrityImpact',
          privilegesRequired:
            'vulnerability1-vulnerabilityScoringExtraDataPrivilegesRequired',
          vectorString:
            'vulnerability1-vulnerabilityScoringExtraDataVectorString',
          userInteraction:
            'vulnerability1-vulnerabilityScoringExtraDataUserInteraction',
        },
      },
    ],
    references: [],
  },
  {
    name: 'vulnerability2-name',
    type: 'vulnerability2-type',
    description: 'vulnerability2-description',
    score: 9.9,
    severity: 'vulnerability2-severity',
    publishDate: 'vulnerability2-publishDate',
    modifiedDate: 'vulnerability2-modifiedDate',
    vulnerabilityScoring: [
      {
        score: 9.9,
        severity: 'vulnerability2-vulnerabilityScoringSeverity',
        type: 'vulnerability2-vulnerabilityScoringType',
        extraData: {
          confidentialityImpact:
            'vulnerability2-vulnerabilityScoringExtraDataConfidentialityImpact',
          attackComplexity:
            'vulnerability2-vulnerabilityScoringExtraDataAttackComplexity',
          scope: 'vulnerability2-vulnerabilityScoringExtraDataScope',
          availabilityImpact:
            'vulnerability2-vulnerabilityScoringExtraDataAvailabilityImpact',
          attackVector:
            'vulnerability2-vulnerabilityScoringExtraDataAttackVector',
          integrityImpact:
            'vulnerability2-vulnerabilityScoringExtraDataIntegrityImpact',
          privilegesRequired:
            'vulnerability2-vulnerabilityScoringExtraDataPrivilegesRequired',
          vectorString:
            'vulnerability2-vulnerabilityScoringExtraDataVectorString',
          userInteraction:
            'vulnerability2-vulnerabilityScoringExtraDataUserInteraction',
        },
      },
    ],
    references: [
      {
        value: 'vulnerability2-reference1Value',
        source: 'vulnerability2-reference1Source',
        url: 'vulnerability2-reference1Url',
        signature: false,
        advisory: false,
        patch: false,
      },
      {
        value: 'vulnerability2-reference2Value',
        source: 'vulnerability2-reference2Source',
        url: 'vulnerability2-reference2Url',
        signature: false,
        advisory: false,
        patch: false,
      },
    ],
  },
]

export const vulnerabilitiesFixSummaryData = {
  vulnerability: 'vulnerability1',
  topRankedFix: {
    id: 123456,
    vulnerability: 'securityAlert1-topFixVulnerability',
    type: 'securityAlert1-topFixType',
    origin: 'securityAlert1-topFixOrigin',
    url: 'securityAlert1-topFixUrl',
    fixResolution: 'securityAlert1-topFixFixResolution',
    date: 'securityAlert1-topFixDate',
    message: 'securityAlert1-topFixMessage',
    extraData: {},
  },
  allFixes: [
    {
      id: 123456,
      vulnerability: 'securityAlert1-topFixVulnerability',
      type: 'securityAlert1-topFixType',
      origin: 'securityAlert1-topFixOrigin',
      url: 'securityAlert1-topFixUrl',
      fixResolution: 'securityAlert1-topFixFixResolution',
      date: 'securityAlert1-topFixDate',
      message: 'securityAlert1-topFixMessage',
      extraData: {},
    },
    {
      id: 123457,
      vulnerability: 'securityAlert2-topFixVulnerability',
      type: 'securityAlert2-topFixType',
      origin: 'securityAlert2-topFixOrigin',
      url: 'securityAlert2-topFixUrl',
      fixResolution: 'securityAlert2-topFixFixResolution',
      date: 'securityAlert2-topFixDate',
      message: 'securityAlert2-topFixMessage',
      extraData: {},
    },
  ],
  totalUpVotes: 12345,
  totalDownVotes: 1234,
}
