import { LibraryDTO } from '../../../src/dto/library.dto'
import { NewVersionsAlertDTO } from '../../../src/dto/newVersionsAlert.dto'
import { MultipleLicensesAlertDTO } from '../../../src/dto/multipleLicensesAlert.dto'
import { RejectedInUseAlertDTO } from '../../../src/dto/rejectedInUseAlert.dto'
import { OrganizationDTO } from '../../../src/dto/organization.dto'
import { PolicyAlertDTO } from '../../../src/dto/policyAlert.dto'
import { ProjectDTO } from '../../../src/dto/project.dto'
import { ProjectVitalsDTO } from '../../../src/dto/projectVitals.dto'
import { SecurityAlertDTO } from '../../../src/dto/securityAlert.dto'
import { VulnerabilityDTO } from '../../../src/dto/vulnerability.dto'
import { VulnerabilityFixSummaryDTO } from '../../../src/dto/vulnerabilityFixSummary.dto'

import {
  librariesData,
  organizationData,
  policyAlertsData,
  newVersionsAlertsData,
  multipleLicensesAlertsData,
  rejectedInUseAlertsData,
  projectData,
  projectVitalsData,
  securityAlertsData,
  vulnerabilitiesData,
  vulnerabilitiesFixSummaryData,
} from './data'
import { VulnerabilityFix } from '../../../src/model/vulnerabilityFix'

export const organizationDTO = new OrganizationDTO(
  organizationData.uuid,
  organizationData.name,
)

export const projectDTO = new ProjectDTO(
  projectData.uuid,
  projectData.name,
  projectData.path,
  projectData.productName,
  projectData.productUuid,
)

export const projectVitalsDTO = new ProjectVitalsDTO(
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

export const policyAlertsDTO = [
  new PolicyAlertDTO(
    policyAlertsData[0].uuid,
    policyAlertsData[0].name,
    policyAlertsData[0].type,
    policyAlertsData[0].component,
    policyAlertsData[0].alertInfo,
    policyAlertsData[0].project,
    policyAlertsData[0].policyName,
  ),
  new PolicyAlertDTO(
    policyAlertsData[1].uuid,
    policyAlertsData[1].name,
    policyAlertsData[1].type,
    policyAlertsData[1].component,
    policyAlertsData[1].alertInfo,
    policyAlertsData[1].project,
    policyAlertsData[1].policyName,
  ),
]

export const newVersionsAlertsDTO = [
  new NewVersionsAlertDTO(
    newVersionsAlertsData[0].uuid,
    newVersionsAlertsData[0].name,
    newVersionsAlertsData[0].type,
    newVersionsAlertsData[0].component,
    newVersionsAlertsData[0].alertInfo,
    newVersionsAlertsData[0].project,
    newVersionsAlertsData[0].availableVersion,
    newVersionsAlertsData[0].availableVersionType,
  ),
  new NewVersionsAlertDTO(
    newVersionsAlertsData[1].uuid,
    newVersionsAlertsData[1].name,
    newVersionsAlertsData[1].type,
    newVersionsAlertsData[1].component,
    newVersionsAlertsData[1].alertInfo,
    newVersionsAlertsData[1].project,
    newVersionsAlertsData[1].availableVersion,
    newVersionsAlertsData[1].availableVersionType,
  ),
]

export const multipleLicensesAlertsDTO = [
  new MultipleLicensesAlertDTO(
    multipleLicensesAlertsData[0].uuid,
    multipleLicensesAlertsData[0].name,
    multipleLicensesAlertsData[0].type,
    multipleLicensesAlertsData[0].component,
    multipleLicensesAlertsData[0].alertInfo,
    multipleLicensesAlertsData[0].project,
    multipleLicensesAlertsData[0].numberOfLicenses,
    multipleLicensesAlertsData[0].licenses,
  ),
  new MultipleLicensesAlertDTO(
    multipleLicensesAlertsData[1].uuid,
    multipleLicensesAlertsData[1].name,
    multipleLicensesAlertsData[1].type,
    multipleLicensesAlertsData[1].component,
    multipleLicensesAlertsData[1].alertInfo,
    multipleLicensesAlertsData[1].project,
    multipleLicensesAlertsData[1].numberOfLicenses,
    multipleLicensesAlertsData[1].licenses,
  ),
]

export const rejectedInUseAlertsDTO = [
  new RejectedInUseAlertDTO(
    rejectedInUseAlertsData[0].uuid,
    rejectedInUseAlertsData[0].name,
    rejectedInUseAlertsData[0].type,
    rejectedInUseAlertsData[0].component,
    rejectedInUseAlertsData[0].alertInfo,
    rejectedInUseAlertsData[0].project,
    rejectedInUseAlertsData[0].description,
  ),
  new RejectedInUseAlertDTO(
    rejectedInUseAlertsData[1].uuid,
    rejectedInUseAlertsData[1].name,
    rejectedInUseAlertsData[1].type,
    rejectedInUseAlertsData[1].component,
    rejectedInUseAlertsData[1].alertInfo,
    rejectedInUseAlertsData[1].project,
    rejectedInUseAlertsData[1].description,
  ),
]

export const securityAlertsDTO = [
  new SecurityAlertDTO(
    securityAlertsData[0].uuid,
    securityAlertsData[0].name,
    securityAlertsData[0].type,
    securityAlertsData[0].component,
    securityAlertsData[0].alertInfo,
    securityAlertsData[0].project,
    securityAlertsData[0].product,
    securityAlertsData[0].vulnerability,
    securityAlertsData[0].topFix,
    securityAlertsData[0].effective,
  ),
  new SecurityAlertDTO(
    securityAlertsData[1].uuid,
    securityAlertsData[1].name,
    securityAlertsData[1].type,
    securityAlertsData[1].component,
    securityAlertsData[1].alertInfo,
    securityAlertsData[1].project,
    securityAlertsData[1].product,
    securityAlertsData[1].vulnerability,
    securityAlertsData[1].topFix,
    securityAlertsData[1].effective,
  ),
]

export const librariesDTO = [
  new LibraryDTO(
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
    librariesData[0].licenses,
    librariesData[0].copyrightReferences,
    librariesData[0].locations,
  ),
  new LibraryDTO(
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
    librariesData[1].licenses,
    librariesData[1].copyrightReferences,
    librariesData[1].locations,
  ),
]

export const vulnerabilitiesDTO = [
  new VulnerabilityDTO(
    vulnerabilitiesData[0].name,
    vulnerabilitiesData[0].type,
    vulnerabilitiesData[0].description,
    vulnerabilitiesData[0].score,
    vulnerabilitiesData[0].severity,
    vulnerabilitiesData[0].publishDate,
    vulnerabilitiesData[0].modifiedDate,
    vulnerabilitiesData[0].vulnerabilityScoring,
    vulnerabilitiesData[0].references,
  ),
  new VulnerabilityDTO(
    vulnerabilitiesData[1].name,
    vulnerabilitiesData[1].type,
    vulnerabilitiesData[1].description,
    vulnerabilitiesData[1].score,
    vulnerabilitiesData[1].severity,
    vulnerabilitiesData[1].publishDate,
    vulnerabilitiesData[1].modifiedDate,
    vulnerabilitiesData[1].vulnerabilityScoring,
    vulnerabilitiesData[1].references,
  ),
]

export const vulnerabilitiesFixSummaryDTO = new VulnerabilityFixSummaryDTO(
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
  vulnerabilitiesFixSummaryData.allFixes,
  vulnerabilitiesFixSummaryData.totalUpVotes,
  vulnerabilitiesFixSummaryData.totalDownVotes,
)
