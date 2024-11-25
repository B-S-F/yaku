import { Project } from '../model/project.js'
import { SecurityAlert } from '../model/securityAlert.js'
import { SecurityAlertDTO } from '../dto/securityAlert.dto.js'
import { Vulnerability } from '../model/vulnerability.js'
import { VulnerabilityFix } from '../model/vulnerabilityFix.js'
import { VulnerabilityReference } from '../model/vulnerabilityReference.js'

export class SecurityAlertMap {
  public static toModel(securityAlertDTO: SecurityAlertDTO) {
    const project: Project = new Project(
      securityAlertDTO.project.uuid,
      securityAlertDTO.project.name,
      securityAlertDTO.project.path,
      securityAlertDTO.project.path,
      securityAlertDTO.project.productUuid,
    )
    const vulnerabilityReferences: VulnerabilityReference[] = []
    const vulnerability: Vulnerability = new Vulnerability(
      securityAlertDTO.vulnerability.name,
      securityAlertDTO.vulnerability.type,
      securityAlertDTO.vulnerability.description,
      securityAlertDTO.vulnerability.score,
      securityAlertDTO.vulnerability.severity,
      securityAlertDTO.vulnerability.publishDate,
      securityAlertDTO.vulnerability.modifiedDate,
      securityAlertDTO.vulnerability.vulnerabilityScoring.map((scoring) => {
        return {
          score: scoring.score,
          severity: scoring.severity,
          type: scoring.type,
        }
      }),
      vulnerabilityReferences,
    )
    const vulnerabilityFix: VulnerabilityFix = new VulnerabilityFix(
      securityAlertDTO.topFix.id,
      securityAlertDTO.topFix.vulnerability,
      securityAlertDTO.topFix.type,
      securityAlertDTO.topFix.origin,
      securityAlertDTO.topFix.url,
      securityAlertDTO.topFix.fixResolution,
      securityAlertDTO.topFix.date,
      securityAlertDTO.topFix.message,
      securityAlertDTO.topFix.extraData,
    )
    return new SecurityAlert(
      securityAlertDTO.uuid,
      securityAlertDTO.name,
      securityAlertDTO.type,
      securityAlertDTO.component,
      securityAlertDTO.alertInfo,
      project,
      {
        uuid: securityAlertDTO.product.uuid,
        name: securityAlertDTO.product.name,
      },
      vulnerability,
      vulnerabilityFix,
      securityAlertDTO.effective,
    )
  }
  public static toDTO(securityAlert: SecurityAlert) {
    return new SecurityAlertDTO(
      securityAlert.uuid,
      securityAlert.name,
      securityAlert.type,
      securityAlert.component,
      securityAlert.alertInfo,
      {
        uuid: securityAlert.project.uuid,
        name: securityAlert.project.name,
        path: securityAlert.project.path,
        productUuid: securityAlert.project.productUuid,
      },
      { uuid: securityAlert.product.uuid, name: securityAlert.product.name },
      {
        name: securityAlert.vulnerability.name,
        type: securityAlert.vulnerability.type,
        description: securityAlert.vulnerability.description,
        score: securityAlert.vulnerability.score,
        severity: securityAlert.vulnerability.severity,
        publishDate: securityAlert.vulnerability.publishDate,
        modifiedDate: securityAlert.vulnerability.modifiedDate,
        vulnerabilityScoring: securityAlert.vulnerability.vulnerabilityScoring,
      },
      {
        id: securityAlert.topFix.id,
        vulnerability: securityAlert.topFix.vulnerability,
        type: securityAlert.topFix.type,
        origin: securityAlert.topFix.origin,
        url: securityAlert.topFix.url,
        fixResolution: securityAlert.topFix.fixResolution,
        date: securityAlert.topFix.date,
        message: securityAlert.topFix.message,
        extraData: securityAlert.topFix.extraData,
      },
      securityAlert.effective,
    )
  }
}
