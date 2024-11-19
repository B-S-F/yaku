// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import { Authenticator } from '../auth/auth.js'
import { getLibraryDTOs } from '../fetcher/library.fetcher.js'
import { Library } from '../model/library.js'
import { LibraryDTO } from '../dto/library.dto.js'
import { LibraryMap } from '../mapper/library.mapper.js'
import { MendEnvironment } from '../model/mendEnvironment.js'

export class LibraryService {
  private auth: Authenticator
  private env: MendEnvironment

  constructor(env: MendEnvironment) {
    this.env = env
    this.auth = Authenticator.getInstance(env)
  }

  async getAllLibrariesById(projectId: string): Promise<Library[]> {
    const libraryDTOs: LibraryDTO[] = await getLibraryDTOs(
      this.env.apiUrl,
      { projectToken: projectId, pageSize: 100 },
      this.auth
    )
    const projectLibraries = libraryDTOs.map((libDto) =>
      LibraryMap.toModel(libDto)
    )

    return projectLibraries
  }
}
