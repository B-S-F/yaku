// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { PolicyAlertDTO } from '../dto/policyAlert.dto.js'
import { PolicyAlert } from '../model/policyAlert.js'
import { Project } from '../model/project.js'

export class PolicyAlertMap {
  public static toModel(policyAlertDTO: PolicyAlertDTO) {
    return new PolicyAlert(
      policyAlertDTO.uuid,
      policyAlertDTO.name,
      policyAlertDTO.type,
      policyAlertDTO.component,
      policyAlertDTO.alertInfo,
      new Project(
        policyAlertDTO.project.uuid,
        policyAlertDTO.project.name,
        policyAlertDTO.project.path,
        policyAlertDTO.project.path,
        policyAlertDTO.project.productUuid
      ),
      {
        uuid: policyAlertDTO.project.productUuid,
        name: policyAlertDTO.project.path,
      },
      policyAlertDTO.policyName
    )
  }
  public static toDTO(policyAlert: PolicyAlert) {
    return new PolicyAlertDTO(
      policyAlert.uuid,
      policyAlert.name,
      policyAlert.type,
      policyAlert.component,
      policyAlert.alertInfo,
      {
        uuid: policyAlert.project.uuid,
        name: policyAlert.project.name,
        path: policyAlert.project.path,
        productUuid: policyAlert.project.productUuid,
      },
      policyAlert.policyName
    )
  }
}
