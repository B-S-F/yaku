// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { RejectedInUseAlertDTO } from '../dto/rejectedInUseAlert.dto.js'
import { RejectedInUseAlert } from '../model/rejectedInUseAlert.js'
import { Project } from '../model/project.js'

export class RejectedInUseAlertMap {
  public static toModel(rejectedInUseAlertDTO: RejectedInUseAlertDTO) {
    return new RejectedInUseAlert(
      rejectedInUseAlertDTO.uuid,
      rejectedInUseAlertDTO.name,
      rejectedInUseAlertDTO.type,
      rejectedInUseAlertDTO.component,
      rejectedInUseAlertDTO.alertInfo,
      new Project(
        rejectedInUseAlertDTO.project.uuid,
        rejectedInUseAlertDTO.project.name,
        rejectedInUseAlertDTO.project.path,
        rejectedInUseAlertDTO.project.path,
        rejectedInUseAlertDTO.project.productUuid,
      ),
      {
        uuid: rejectedInUseAlertDTO.project.productUuid,
        name: rejectedInUseAlertDTO.project.path,
      },
      rejectedInUseAlertDTO.description,
    )
  }
  public static toDTO(rejectedInUseAlert: RejectedInUseAlert) {
    return new RejectedInUseAlertDTO(
      rejectedInUseAlert.uuid,
      rejectedInUseAlert.name,
      rejectedInUseAlert.type,
      rejectedInUseAlert.component,
      rejectedInUseAlert.alertInfo,
      {
        uuid: rejectedInUseAlert.project.uuid,
        name: rejectedInUseAlert.project.name,
        path: rejectedInUseAlert.project.path,
        productUuid: rejectedInUseAlert.project.productUuid,
      },
      rejectedInUseAlert.description,
    )
  }
}
