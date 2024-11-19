// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { NewVersionsAlertDTO } from '../dto/newVersionsAlert.dto.js'
import { NewVersionsAlert } from '../model/newVersionsAlert.js'
import { Project } from '../model/project.js'

export class NewVersionsAlertMap {
  public static toModel(newVersionsAlertDTO: NewVersionsAlertDTO) {
    return new NewVersionsAlert(
      newVersionsAlertDTO.uuid,
      newVersionsAlertDTO.name,
      newVersionsAlertDTO.type,
      newVersionsAlertDTO.component,
      newVersionsAlertDTO.alertInfo,
      new Project(
        newVersionsAlertDTO.project.uuid,
        newVersionsAlertDTO.project.name,
        newVersionsAlertDTO.project.path,
        newVersionsAlertDTO.project.path,
        newVersionsAlertDTO.project.productUuid
      ),
      {
        uuid: newVersionsAlertDTO.project.productUuid,
        name: newVersionsAlertDTO.project.path,
      },
      newVersionsAlertDTO.availableVersion,
      newVersionsAlertDTO.availableVersionType
    )
  }
  public static toDTO(newVersionsAlert: NewVersionsAlert) {
    return new NewVersionsAlertDTO(
      newVersionsAlert.uuid,
      newVersionsAlert.name,
      newVersionsAlert.type,
      newVersionsAlert.component,
      newVersionsAlert.alertInfo,
      {
        uuid: newVersionsAlert.project.uuid,
        name: newVersionsAlert.project.name,
        path: newVersionsAlert.project.path,
        productUuid: newVersionsAlert.project.productUuid,
      },
      newVersionsAlert.availableVersion,
      newVersionsAlert.availableVersionType
    )
  }
}
