import { Authenticator } from '../auth/auth.js'
import {
  getMultipleLicensesAlertDTOs,
  getNewVersionsAlertDTOs,
  getPolicyAlertDTOs,
  getRejectedInUseAlertDTOs,
  getSecurityAlertDTOs,
} from '../fetcher/alert.fetcher.js'
import { MendEnvironment } from '../model/mendEnvironment.js'
import { PolicyAlertDTO } from '../dto/policyAlert.dto.js'
import { PolicyAlertMap } from '../mapper/policyAlert.mapper.js'
import { SecurityAlertDTO } from '../dto/securityAlert.dto.js'
import { SecurityAlertMap } from '../mapper/securityAlert.mapper.js'
import { NewVersionsAlertDTO } from '../dto/newVersionsAlert.dto.js'
import { NewVersionsAlertMap } from '../mapper/newVersionsAlert.mapper.js'
import { MultipleLicensesAlertDTO } from '../dto/multipleLicensesAlert.dto.js'
import { MultipleLicensesAlertMap } from '../mapper/multipleLicensesAlert.mapper.js'
import { RejectedInUseAlertDTO } from '../dto/rejectedInUseAlert.dto.js'
import { RejectedInUseAlertMap } from '../mapper/rejectedInUseAlert.mapper.js'

export class AlertService {
  private auth: Authenticator
  private env: MendEnvironment

  constructor(env: MendEnvironment) {
    this.env = env
    this.auth = Authenticator.getInstance(env)
  }

  async getPolicyAlertsById(projectId: string, alertStatus: string) {
    const policyAlertDTOs: PolicyAlertDTO[] = await getPolicyAlertDTOs(
      this.env.apiUrl,
      { projectToken: projectId, status: alertStatus, pageSize: 100 },
      this.auth,
    )
    const policyAlerts = policyAlertDTOs.map((alertDTO) =>
      PolicyAlertMap.toModel(alertDTO),
    )

    return policyAlerts
  }

  async getSecurityAlertsById(projectId: string, alertStatus: string) {
    const securityAlertDTOs: SecurityAlertDTO[] = await getSecurityAlertDTOs(
      this.env.apiUrl,
      { projectToken: projectId, status: alertStatus, pageSize: 100 },
      this.auth,
    )
    const securityAlerts = securityAlertDTOs.map((alertDTO) =>
      SecurityAlertMap.toModel(alertDTO),
    )

    return securityAlerts
  }

  async getNewVersionsAlertsById(projectId: string, alertStatus: string) {
    const newVersionsAlertDTOs: NewVersionsAlertDTO[] =
      await getNewVersionsAlertDTOs(
        this.env.apiUrl,
        { projectToken: projectId, status: alertStatus, pageSize: 100 },
        this.auth,
      )
    const newVersionsAlerts = newVersionsAlertDTOs.map((alertDTO) =>
      NewVersionsAlertMap.toModel(alertDTO),
    )

    return newVersionsAlerts
  }

  async getMultipleLicensesAlertsById(projectId: string, alertStatus: string) {
    const multipleLicensesAlertDTOs: MultipleLicensesAlertDTO[] =
      await getMultipleLicensesAlertDTOs(
        this.env.apiUrl,
        { projectToken: projectId, status: alertStatus, pageSize: 100 },
        this.auth,
      )
    const multipleLicensesAlerts = multipleLicensesAlertDTOs.map((alertDTO) =>
      MultipleLicensesAlertMap.toModel(alertDTO),
    )

    return multipleLicensesAlerts
  }

  async getRejectedInUseAlertsById(projectId: string, alertStatus: string) {
    const rejectedInUseAlertDTOs: RejectedInUseAlertDTO[] =
      await getRejectedInUseAlertDTOs(
        this.env.apiUrl,
        { projectToken: projectId, status: alertStatus, pageSize: 100 },
        this.auth,
      )
    const rejectedInUseAlerts = rejectedInUseAlertDTOs.map((alertDTO) =>
      RejectedInUseAlertMap.toModel(alertDTO),
    )

    return rejectedInUseAlerts
  }
}
