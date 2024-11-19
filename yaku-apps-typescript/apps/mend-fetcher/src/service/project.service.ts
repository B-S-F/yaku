import { Authenticator } from '../auth/auth.js'
import {
  getProjectDTO,
  getProjectVitalsDTO,
} from '../fetcher/project.fetcher.js'
import { Project } from '../model/project.js'
import { ProjectMap } from '../mapper/project.mapper.js'
import { ProjectVitals } from '../model/projectVitals.js'
import { ProjectVitalsMap } from '../mapper/projectVitals.mapper.js'
import { MendEnvironment } from '../model/mendEnvironment.js'

export class ProjectService {
  private auth: Authenticator
  private env: MendEnvironment

  constructor(env: MendEnvironment) {
    this.env = env
    this.auth = Authenticator.getInstance(env)
  }

  async getProjectByToken(projectToken: string): Promise<Project> {
    const projectDto = await getProjectDTO(
      this.env.apiUrl,
      { projectToken },
      this.auth,
    )
    const project = ProjectMap.toModel(projectDto)

    return project
  }

  async getProjectVitals(projectToken: string): Promise<ProjectVitals> {
    const projectVitalsDto = await getProjectVitalsDTO(
      this.env.apiUrl,
      { projectToken },
      this.auth,
    )
    const projectVitals = ProjectVitalsMap.toModel(projectVitalsDto)

    return projectVitals
  }
}
