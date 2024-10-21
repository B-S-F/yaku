import { CopyrightReference } from '../model/copyrightReference.js'
import { Library } from '../model/library.js'
import { LibraryDTO } from '../dto/library.dto.js'
import { License } from '../model/license.js'
import { LicenseReference } from '../model/licenseReference.js'

export class LibraryMap {
  public static toModel(libraryDTO: LibraryDTO) {
    const licenses: License[] = libraryDTO.licenses.map(
      (license) =>
        new License(
          license.uuid,
          license.name,
          license.assignedByUser,
          license.licenseReferences.map(
            (ref) =>
              new LicenseReference(
                ref.uuid,
                ref.type,
                ref.liabilityReference,
                ref.information
              )
          )
        )
    )
    const copyrightReferences: CopyrightReference[] =
      libraryDTO.copyrightReferences.map(
        (ref) =>
          new CopyrightReference(
            ref.type,
            ref.copyright,
            ref.author,
            ref.referenceInfo,
            ref.startYear,
            ref.endYear
          )
      )
    const locations: { localPath: string; dependencyFile: string }[] =
      libraryDTO.locations !== undefined && libraryDTO.locations.length > 0
        ? libraryDTO.locations.map((location) => {
            return {
              localPath: location.localPath,
              dependencyFile: location.dependencyFile,
            }
          })
        : []
    return new Library(
      libraryDTO.uuid,
      libraryDTO.name,
      libraryDTO.artifactId,
      libraryDTO.version,
      libraryDTO.architecture,
      libraryDTO.languageVersion,
      libraryDTO.classifier,
      libraryDTO.extension,
      libraryDTO.sha1,
      libraryDTO.description,
      libraryDTO.type,
      libraryDTO.directDependency,
      licenses,
      copyrightReferences,
      locations
    )
  }
  public static toDTO(library: Library) {
    return new LibraryDTO(
      library.uuid,
      library.name,
      library.artifactId,
      library.version,
      library.architecture,
      library.languageVersion,
      library.classifier,
      library.extension,
      library.sha1,
      library.description,
      library.type,
      library.directDependency,
      library.licenses.map((license) => {
        return {
          uuid: license.uuid,
          name: license.name,
          assignedByUser: license.assignedByUser,
          licenseReferences: license.licenseReferences.map(
            (ref: {
              uuid: string
              type: string
              liabilityReference: string
              information: string
            }) => {
              return {
                uuid: ref.uuid,
                type: ref.type,
                liabilityReference: ref.liabilityReference,
                information: ref.information,
              }
            }
          ),
        }
      }),
      library.copyrightReferences.map((copyrightRef: CopyrightReference) => {
        return {
          type: copyrightRef.type,
          copyright: copyrightRef.copyright,
          author: copyrightRef.author,
          referenceInfo: copyrightRef.referenceInfo,
          startYear: copyrightRef.startYear,
          endYear: copyrightRef.endYear,
        }
      }),
      library.locations
    )
  }
}
