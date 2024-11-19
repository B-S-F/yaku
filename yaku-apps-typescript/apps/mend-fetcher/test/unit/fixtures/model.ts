import { CopyrightReference } from '../../../src/model/copyrightReference'
import { Library } from '../../../src/model/library'
import { License } from '../../../src/model/license'
import { LicenseReference } from '../../../src/model/licenseReference'
import { Organization } from '../../../src/model/organization'
import { PolicyAlert } from '../../../src/model/policyAlert'
import { MultipleLicensesAlert } from '../../../src/model/multipleLicensesAlert'
import { NewVersionsAlert } from '../../../src/model/newVersionsAlert'
import { RejectedInUseAlert } from '../../../src/model/rejectedInUseAlert'
import { Project } from '../../../src/model/project'
import { ProjectVitals } from '../../../src/model/projectVitals'
import { SecurityAlert } from '../../../src/model/securityAlert'
import { Vulnerability } from '../../../src/model/vulnerability'
import { VulnerabilityFix } from '../../../src/model/vulnerabilityFix'
import { VulnerabilityReference } from '../../../src/model/vulnerabilityReference'
import { VulnerabilityFixSummary } from '../../../src/model/vulnerabilityFixSummary'

import {
  librariesData,
  organizationData,
  policyAlertsData,
  multipleLicensesAlertsData,
  newVersionsAlertsData,
  rejectedInUseAlertsData,
  projectData,
  projectVitalsData,
  securityAlertsData,
  vulnerabilitiesData,
  vulnerabilitiesFixSummaryData,
} from './data'

export const organizationModel = new Organization(
  organizationData.uuid,
  organizationData.name,
)

export const projectModel = new Project(
  projectData.uuid,
  projectData.name,
  projectData.path,
  projectData.productName,
  projectData.productUuid,
)

export const projectVitalsModel = new ProjectVitals(
  projectVitalsData.lastScan,
  projectVitalsData.lastUserScanned,
  projectVitalsData.requestToken,
  projectVitalsData.lastSourceFileMatch,
  projectVitalsData.lastScanComment,
  projectVitalsData.projectCreationDate,
  projectVitalsData.pluginName,
  projectVitalsData.pluginVersion,
  projectVitalsData.libraryCount,
)

export const policyAlertsModel = [
  new PolicyAlert(
    policyAlertsData[0].uuid,
    policyAlertsData[0].name,
    policyAlertsData[0].type,
    policyAlertsData[0].component,
    policyAlertsData[0].alertInfo,
    new Project(
      policyAlertsData[0].project.uuid,
      policyAlertsData[0].project.name,
      policyAlertsData[0].project.path,
      policyAlertsData[0].project.path,
      policyAlertsData[0].project.productUuid,
    ),
    {
      uuid: policyAlertsData[0].project.productUuid,
      name: policyAlertsData[0].project.path,
    },
    policyAlertsData[0].policyName,
  ),
  new PolicyAlert(
    policyAlertsData[1].uuid,
    policyAlertsData[1].name,
    policyAlertsData[1].type,
    policyAlertsData[1].component,
    policyAlertsData[1].alertInfo,
    new Project(
      policyAlertsData[1].project.uuid,
      policyAlertsData[1].project.name,
      policyAlertsData[1].project.path,
      policyAlertsData[1].project.path,
      policyAlertsData[1].project.productUuid,
    ),
    {
      uuid: policyAlertsData[1].project.productUuid,
      name: policyAlertsData[1].project.path,
    },
    policyAlertsData[1].policyName,
  ),
]

export const multipleLicensesAlertsModel = [
  new MultipleLicensesAlert(
    multipleLicensesAlertsData[0].uuid,
    multipleLicensesAlertsData[0].name,
    multipleLicensesAlertsData[0].type,
    multipleLicensesAlertsData[0].component,
    multipleLicensesAlertsData[0].alertInfo,
    new Project(
      multipleLicensesAlertsData[0].project.uuid,
      multipleLicensesAlertsData[0].project.name,
      multipleLicensesAlertsData[0].project.path,
      multipleLicensesAlertsData[0].project.path,
      multipleLicensesAlertsData[0].project.productUuid,
    ),
    {
      uuid: multipleLicensesAlertsData[0].project.productUuid,
      name: multipleLicensesAlertsData[0].project.path,
    },
    multipleLicensesAlertsData[0].numberOfLicenses,
    multipleLicensesAlertsData[0].licenses,
  ),
  new MultipleLicensesAlert(
    multipleLicensesAlertsData[1].uuid,
    multipleLicensesAlertsData[1].name,
    multipleLicensesAlertsData[1].type,
    multipleLicensesAlertsData[1].component,
    multipleLicensesAlertsData[1].alertInfo,
    new Project(
      multipleLicensesAlertsData[1].project.uuid,
      multipleLicensesAlertsData[1].project.name,
      multipleLicensesAlertsData[1].project.path,
      multipleLicensesAlertsData[1].project.path,
      multipleLicensesAlertsData[1].project.productUuid,
    ),
    {
      uuid: multipleLicensesAlertsData[1].project.productUuid,
      name: multipleLicensesAlertsData[1].project.path,
    },
    multipleLicensesAlertsData[1].numberOfLicenses,
    multipleLicensesAlertsData[1].licenses,
  ),
]

export const newVersionsAlertsModel = [
  new NewVersionsAlert(
    newVersionsAlertsData[0].uuid,
    newVersionsAlertsData[0].name,
    newVersionsAlertsData[0].type,
    newVersionsAlertsData[0].component,
    newVersionsAlertsData[0].alertInfo,
    new Project(
      newVersionsAlertsData[0].project.uuid,
      newVersionsAlertsData[0].project.name,
      newVersionsAlertsData[0].project.path,
      newVersionsAlertsData[0].project.path,
      newVersionsAlertsData[0].project.productUuid,
    ),
    {
      uuid: newVersionsAlertsData[0].project.productUuid,
      name: newVersionsAlertsData[0].project.path,
    },
    newVersionsAlertsData[0].availableVersion,
    newVersionsAlertsData[0].availableVersionType,
  ),
  new NewVersionsAlert(
    newVersionsAlertsData[1].uuid,
    newVersionsAlertsData[1].name,
    newVersionsAlertsData[1].type,
    newVersionsAlertsData[1].component,
    newVersionsAlertsData[1].alertInfo,
    new Project(
      newVersionsAlertsData[1].project.uuid,
      newVersionsAlertsData[1].project.name,
      newVersionsAlertsData[1].project.path,
      newVersionsAlertsData[1].project.path,
      newVersionsAlertsData[1].project.productUuid,
    ),
    {
      uuid: newVersionsAlertsData[1].project.productUuid,
      name: newVersionsAlertsData[1].project.path,
    },
    newVersionsAlertsData[1].availableVersion,
    newVersionsAlertsData[1].availableVersionType,
  ),
]

export const rejectedInUseAlertsModel = [
  new RejectedInUseAlert(
    rejectedInUseAlertsData[0].uuid,
    rejectedInUseAlertsData[0].name,
    rejectedInUseAlertsData[0].type,
    rejectedInUseAlertsData[0].component,
    rejectedInUseAlertsData[0].alertInfo,
    new Project(
      rejectedInUseAlertsData[0].project.uuid,
      rejectedInUseAlertsData[0].project.name,
      rejectedInUseAlertsData[0].project.path,
      rejectedInUseAlertsData[0].project.path,
      rejectedInUseAlertsData[0].project.productUuid,
    ),
    {
      uuid: rejectedInUseAlertsData[0].project.productUuid,
      name: rejectedInUseAlertsData[0].project.path,
    },
    rejectedInUseAlertsData[0].description,
  ),
  new RejectedInUseAlert(
    rejectedInUseAlertsData[1].uuid,
    rejectedInUseAlertsData[1].name,
    rejectedInUseAlertsData[1].type,
    rejectedInUseAlertsData[1].component,
    rejectedInUseAlertsData[1].alertInfo,
    new Project(
      rejectedInUseAlertsData[1].project.uuid,
      rejectedInUseAlertsData[1].project.name,
      rejectedInUseAlertsData[1].project.path,
      rejectedInUseAlertsData[1].project.path,
      rejectedInUseAlertsData[1].project.productUuid,
    ),
    {
      uuid: rejectedInUseAlertsData[1].project.productUuid,
      name: rejectedInUseAlertsData[1].project.path,
    },
    rejectedInUseAlertsData[1].description,
  ),
]

export const securityAlertsModel = [
  new SecurityAlert(
    securityAlertsData[0].uuid,
    securityAlertsData[0].name,
    securityAlertsData[0].type,
    securityAlertsData[0].component,
    securityAlertsData[0].alertInfo,
    new Project(
      securityAlertsData[0].project.uuid,
      securityAlertsData[0].project.name,
      securityAlertsData[0].project.path,
      securityAlertsData[0].project.path,
      securityAlertsData[0].project.productUuid,
    ),
    securityAlertsData[0].product,
    new Vulnerability(
      securityAlertsData[0].vulnerability.name,
      securityAlertsData[0].vulnerability.type,
      securityAlertsData[0].vulnerability.description,
      securityAlertsData[0].vulnerability.score,
      securityAlertsData[0].vulnerability.severity,
      securityAlertsData[0].vulnerability.publishDate,
      securityAlertsData[0].vulnerability.modifiedDate,
      securityAlertsData[0].vulnerability.vulnerabilityScoring,
      [],
    ),
    new VulnerabilityFix(
      securityAlertsData[0].topFix.id,
      securityAlertsData[0].topFix.vulnerability,
      securityAlertsData[0].topFix.type,
      securityAlertsData[0].topFix.origin,
      securityAlertsData[0].topFix.url,
      securityAlertsData[0].topFix.fixResolution,
      securityAlertsData[0].topFix.date,
      securityAlertsData[0].topFix.message,
      securityAlertsData[0].topFix.extraData,
    ),
    securityAlertsData[0].effective,
  ),
  new SecurityAlert(
    securityAlertsData[1].uuid,
    securityAlertsData[1].name,
    securityAlertsData[1].type,
    securityAlertsData[1].component,
    securityAlertsData[1].alertInfo,
    new Project(
      securityAlertsData[1].project.uuid,
      securityAlertsData[1].project.name,
      securityAlertsData[1].project.path,
      securityAlertsData[1].project.path,
      securityAlertsData[1].project.productUuid,
    ),
    securityAlertsData[1].product,
    new Vulnerability(
      securityAlertsData[1].vulnerability.name,
      securityAlertsData[1].vulnerability.type,
      securityAlertsData[1].vulnerability.description,
      securityAlertsData[1].vulnerability.score,
      securityAlertsData[1].vulnerability.severity,
      securityAlertsData[1].vulnerability.publishDate,
      securityAlertsData[1].vulnerability.modifiedDate,
      securityAlertsData[1].vulnerability.vulnerabilityScoring,
      [],
    ),
    new VulnerabilityFix(
      securityAlertsData[1].topFix.id,
      securityAlertsData[1].topFix.vulnerability,
      securityAlertsData[1].topFix.type,
      securityAlertsData[1].topFix.origin,
      securityAlertsData[1].topFix.url,
      securityAlertsData[1].topFix.fixResolution,
      securityAlertsData[1].topFix.date,
      securityAlertsData[1].topFix.message,
      securityAlertsData[1].topFix.extraData,
    ),
    securityAlertsData[1].effective,
  ),
]

export const librariesModel = [
  new Library(
    librariesData[0].uuid,
    librariesData[0].name,
    librariesData[0].artifactId,
    librariesData[0].version,
    librariesData[0].architecture,
    librariesData[0].languageVersion,
    librariesData[0].classifier,
    librariesData[0].extension,
    librariesData[0].sha1,
    librariesData[0].description,
    librariesData[0].type,
    librariesData[0].directDependency,
    librariesData[0].licenses.map((license) => {
      return new License(
        license.uuid,
        license.name,
        license.assignedByUser,
        license.licenseReferences.map((ref) => {
          return new LicenseReference(
            ref.uuid,
            ref.type,
            ref.liabilityReference,
            ref.information,
          )
        }),
      )
    }),
    librariesData[0].copyrightReferences.map(
      (copyrightRef: CopyrightReference) => {
        return new CopyrightReference(
          copyrightRef.type,
          copyrightRef.copyright,
          copyrightRef.author,
          copyrightRef.referenceInfo,
          copyrightRef.startYear,
          copyrightRef.endYear,
        )
      },
    ),
    librariesData[0].locations,
  ),
  new Library(
    librariesData[1].uuid,
    librariesData[1].name,
    librariesData[1].artifactId,
    librariesData[1].version,
    librariesData[1].architecture,
    librariesData[1].languageVersion,
    librariesData[1].classifier,
    librariesData[1].extension,
    librariesData[1].sha1,
    librariesData[1].description,
    librariesData[1].type,
    librariesData[1].directDependency,
    librariesData[1].licenses.map((license) => {
      return new License(
        license.uuid,
        license.name,
        license.assignedByUser,
        license.licenseReferences.map((ref) => {
          return new LicenseReference(
            ref.uuid,
            ref.type,
            ref.liabilityReference,
            ref.information,
          )
        }),
      )
    }),
    librariesData[1].copyrightReferences.map(
      (copyrightRef: CopyrightReference) => {
        return new CopyrightReference(
          copyrightRef.type,
          copyrightRef.copyright,
          copyrightRef.author,
          copyrightRef.referenceInfo,
          copyrightRef.startYear,
          copyrightRef.endYear,
        )
      },
    ),
    librariesData[1].locations,
  ),
]

export const vulnerabilitiesModel = [
  new Vulnerability(
    vulnerabilitiesData[0].name,
    vulnerabilitiesData[0].type,
    vulnerabilitiesData[0].description,
    vulnerabilitiesData[0].score,
    vulnerabilitiesData[0].severity,
    vulnerabilitiesData[0].publishDate,
    vulnerabilitiesData[0].modifiedDate,
    vulnerabilitiesData[0].vulnerabilityScoring,
    vulnerabilitiesData[0].references.map(
      (ref: VulnerabilityReference) =>
        new VulnerabilityReference(
          ref.value,
          ref.source,
          ref.url,
          ref.signature,
          ref.advisory,
          ref.patch,
        ),
    ),
  ),
  new Vulnerability(
    vulnerabilitiesData[1].name,
    vulnerabilitiesData[1].type,
    vulnerabilitiesData[1].description,
    vulnerabilitiesData[1].score,
    vulnerabilitiesData[1].severity,
    vulnerabilitiesData[1].publishDate,
    vulnerabilitiesData[1].modifiedDate,
    vulnerabilitiesData[1].vulnerabilityScoring,
    vulnerabilitiesData[1].references.map(
      (ref: VulnerabilityReference) =>
        new VulnerabilityReference(
          ref.value,
          ref.source,
          ref.url,
          ref.signature,
          ref.advisory,
          ref.patch,
        ),
    ),
  ),
]

export const vulnerabilityFixSummaryModel = new VulnerabilityFixSummary(
  vulnerabilitiesFixSummaryData.vulnerability,
  new VulnerabilityFix(
    vulnerabilitiesFixSummaryData.topRankedFix.id,
    vulnerabilitiesFixSummaryData.topRankedFix.vulnerability,
    vulnerabilitiesFixSummaryData.topRankedFix.type,
    vulnerabilitiesFixSummaryData.topRankedFix.origin,
    vulnerabilitiesFixSummaryData.topRankedFix.url,
    vulnerabilitiesFixSummaryData.topRankedFix.fixResolution,
    vulnerabilitiesFixSummaryData.topRankedFix.date,
    vulnerabilitiesFixSummaryData.topRankedFix.message,
    vulnerabilitiesFixSummaryData.topRankedFix.extraData,
  ),
  vulnerabilitiesFixSummaryData.allFixes.map(
    (fix: VulnerabilityFix) =>
      new VulnerabilityFix(
        fix.id,
        fix.vulnerability,
        fix.type,
        fix.origin,
        fix.url,
        fix.fixResolution,
        fix.date,
        fix.message,
        fix.extraData,
      ),
  ),
  vulnerabilitiesFixSummaryData.totalUpVotes,
  vulnerabilitiesFixSummaryData.totalDownVotes,
)
