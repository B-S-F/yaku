import { MultipleLicensesAlertDTO } from '../dto/multipleLicensesAlert.dto.js'
import { MultipleLicensesAlert } from '../model/multipleLicensesAlert.js'
import { Project } from '../model/project.js'

export class MultipleLicensesAlertMap {
  public static toModel(multipleLicensesAlertDTO: MultipleLicensesAlertDTO) {
    return new MultipleLicensesAlert(
      multipleLicensesAlertDTO.uuid,
      multipleLicensesAlertDTO.name,
      multipleLicensesAlertDTO.type,
      multipleLicensesAlertDTO.component,
      multipleLicensesAlertDTO.alertInfo,
      new Project(
        multipleLicensesAlertDTO.project.uuid,
        multipleLicensesAlertDTO.project.name,
        multipleLicensesAlertDTO.project.path,
        multipleLicensesAlertDTO.project.path,
        multipleLicensesAlertDTO.project.productUuid,
      ),
      {
        uuid: multipleLicensesAlertDTO.project.productUuid,
        name: multipleLicensesAlertDTO.project.path,
      },
      multipleLicensesAlertDTO.numberOfLicenses,
      multipleLicensesAlertDTO.licenses,
    )
  }
  public static toDTO(multipleLicensesAlert: MultipleLicensesAlert) {
    return new MultipleLicensesAlertDTO(
      multipleLicensesAlert.uuid,
      multipleLicensesAlert.name,
      multipleLicensesAlert.type,
      multipleLicensesAlert.component,
      multipleLicensesAlert.alertInfo,
      {
        uuid: multipleLicensesAlert.project.uuid,
        name: multipleLicensesAlert.project.name,
        path: multipleLicensesAlert.project.path,
        productUuid: multipleLicensesAlert.project.productUuid,
      },
      multipleLicensesAlert.numberOfLicenses,
      multipleLicensesAlert.licenses,
    )
  }
}
