import { Organization } from '../model/organization.js'
import { OrganizationDTO } from '../dto/organization.dto.js'

export class OrganizationMap {
  public static toModel(organizationDTO: OrganizationDTO) {
    return new Organization(organizationDTO.uuid, organizationDTO.name)
  }

  public static toDTO(organization: Organization) {
    return new OrganizationDTO(organization.uuid, organization.name)
  }
}
