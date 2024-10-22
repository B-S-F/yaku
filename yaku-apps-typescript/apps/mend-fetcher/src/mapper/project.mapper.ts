import { Project } from '../model/project.js'
import { ProjectDTO } from '../dto/project.dto.js'

export class ProjectMap {
  public static toModel(projectDTO: ProjectDTO): Project {
    return new Project(
      projectDTO.uuid,
      projectDTO.name,
      projectDTO.path,
      projectDTO.productName,
      projectDTO.productUuid
    )
  }
  public static toDTO(project: Project) {
    return new ProjectDTO(
      project.uuid,
      project.name,
      project.path,
      project.productName,
      project.productUuid
    )
  }
}
