# Config Management Ideas

The data structures are defined in the [plant uml description](config-mgmt-ds.puml).
The api is defined as [open api spec](config-mgmt.yaml).

It basically defines a config object that has a state and references a set of files of certain type with defined multiplicities and relationships, the data structure definition and the open api spec basically define the necessary infrastructure to be implemented, there are some consequences on the rest of the system, especially the execution of runs:

1. Runs only reference one config object. The run service then has to extract the files of the relevant types from the config object.
2. Since the api allows generation and validation of files, it makes no sense to do excessive validation on runs. Especially, the run should only use the config and additional configs but should omit the reference to an answers schema file.

Migration path:
There are some issues for a migration:

1. Currently, config and answer schema object are independent of each other, we have no clue how they are related. I.e., during a migration, we have to identify which files belong to each other. The way to go is, to go through the run objects and to create a config for each combination of config and answers schema.
2. Runs currently reference both an answers schema and a config, in the new database schema, a run only references one config object. We have to translate during the migration the two references to the created config object.
3. Additional files are of no concern because they do not exist in the database today.

If the above mentioned challenges are mastered, the migration should be straight forward.

## Open Questions

- Is there a 1:1 mapping between answers schema and config, or a 1:n => The latter would result in to config resource types that are closer related then before

  Answer: Although there is a 1:n mapping, we keep files together and allow redundancy in stored files. Files form a composition relationship to the config resource.
- Is an excel sheet an equivalent representation of an answers schema => This way, we could always generate the answers schema json on the fly, store only one file and use standard post and patch with alternative type fields or mime types

  Answer: Yes, they are only a temporary object which we use to directly create an answers.schema file. Therefore, we do not store the excel sources. Since we need a special config that identifies the relevant fields in the excel sheet, the decision is to provide a special endpoint for the creation of a answers schema out of an excel sheet.
- Should a config generation step result in a created or replaced config file or should the result be downloaded and handled by the client. A first generation is uncritical, but how about regeneration, if the answers schema is updated and the idea is to merge the generated stuff with the existing

  Answer: If the qg config file is generated for the first time, the file is stored as qg config file in the config object. If it is recreated while there is already a qg config file stored, the endpoint only returns the created qg-config and requires an explicit upload to replace the existing file.
