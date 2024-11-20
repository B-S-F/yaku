// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { ProjectVitals } from '../model/projectVitals.js'
import { ProjectVitalsDTO } from '../dto/projectVitals.dto.js'

export class ProjectVitalsMap {
  public static toModel(projectVitalsDTO: ProjectVitalsDTO): ProjectVitals {
    return new ProjectVitals(
      projectVitalsDTO.lastScan,
      projectVitalsDTO.lastUserScanned,
      projectVitalsDTO.requestToken,
      projectVitalsDTO.lastSourceFileMatch,
      projectVitalsDTO.lastScanComment,
      projectVitalsDTO.projectCreationDate,
      projectVitalsDTO.pluginName,
      projectVitalsDTO.pluginVersion,
      projectVitalsDTO.libraryCount,
    )
  }

  public static toDTO(projectVitals: ProjectVitals): ProjectVitalsDTO {
    return new ProjectVitalsDTO(
      projectVitals.lastScan,
      projectVitals.lastUserScanned,
      projectVitals.requestToken,
      projectVitals.lastSourceFileMatch,
      projectVitals.lastScanComment,
      projectVitals.projectCreationDate,
      projectVitals.pluginName,
      projectVitals.pluginVersion,
      projectVitals.libraryCount,
    )
  }
}
