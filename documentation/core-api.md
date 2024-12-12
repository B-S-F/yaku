<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Yaku Core API

## Argo Workflows

Yaku uses Argo Workflows workflow engine for orchestrating qg assessment jobs on Kubernetes. To read more about Argo workflows, check: [what-is-argo-workflows](https://argoproj.github.io/argo-workflows/#what-is-argo-workflows).

With Yaku helm chart, we ship Argo Workflows public helm chart as a sub chart. To get you started, we have configured Argo Workflows default values. In your production environment, you can tweak the Argo values based on your requirements.

A MinIO helm chart is also included as a sub chart to start Minio as an S3 artifact storage for Argo workflows.

Out of the box, the Minio deployment uses default credentials that are stored in a Kubernetes secret called **minio-creds**. To use different credentials, you need to create a new secret with your own credentials and add the secret name in the helm chart value _credentialsSecretName_. Read the variables documentation in the **values.yaml** file.

## Encryption Keys

**Important Notes**

The API has an internal mechanism to encrypt user sensitive data (yaku secrets) before storing them in tha database. You need to set up your own encryption key and create a Kubernetes secret that contains this key. The secret name and key should then be added in the following helm chart values:

- `encryption_secret_name`
- `encryption_secret_key`

So if you have a Kubernetes secret like in the example below:

```yaml
apiVersion: v1
kind: Secret
type: Opaque
metadata:
    name: my_yaku_encryption_secret
    namespace: my_yaku_ns
data:
    my_yaku_encryption_key: xxxxx==
```

The values in the helm chart should be:

- `encryption_secret_name: "my_yaku_encryption_secret"`
- `encryption_secret_key: "my_yaku_encryption_key"`

Out of the box, for trying Yaku in a playground setup, a predefined encryption key is generated that you can use. We recommend that you create your own value and deploy it as kuberenets secret, then add the kubernetes secret info in values file under `encryption_secret_name` and `encryption_secret_key`

## Database

Yaku Core API stores the runs data in a PostgreSQL database.

Credentials to access the database should be stored in a Kubernetes secret, and the secrets and the keys it includes should be configured in Yaku Helm chart values. For more details about the configuration values, check the **values.yaml** file.

As a quick start, a PostgreSQL container can be started as part of Yaku deployment. When starting to use Yaku in production, you need to connect it to a production-ready PostgreSQL database.

### Database Migrations

Database migrations are used to manage changes/versions of the database schema over time. Each migration is a new version of the database schema, and is a set of instructions that describe how to update the schema from the previous version to the new version. Having a set of migrations allows to easily update the database schema as your application evolves, thus providing an incremental and versioned path towards building the current state of a database.

### What are migrations?

Effectively, migrations are simply files which contain queries that send a database from a state to another. They follow a MigrationInterface which has an up and down function. The up function contains queries that move the database from an old state to a new one, while the down function does the opposite.

**Migrations help with transitions and tracking:**

- Transitions help move the database from a state to a different new desired state.
- Tracking is achieved by storing each transition in migration files which can be committed to a repository, keeping a linear history of the changes.

**Migration types:**

- Schema migrations - create, modify, delete columns, indexes, constraints, etc.
- Data migrations - populate or modify data in the database

### How to perform a Yaku database migration

As a Yaku developer, you have access to multiple migrations related actions which help you migrate the DB:

- create

    Creates an empty migration template. Here, any query can be manually added to be used by the query runner.
    Generally used for data migrations. For example, in this case, the developer can choose the actions that should be taken when migrating from a float value to an integer value. (approximation, truncation, etc.)
    Run this with: `npm run migrations:create`

- generate

    Generates a new migration file by comparing the contents of the database with the entities tracked by Typeorm. If any discrepancy between the entities and the database is found, a migration with the proper queries which can be run to get rid of it will be generated.
    Updates the history table of the database
    Run this with: `npm run migrations:generate``

- run

    Looks inside the migrations directory and runs all migrations previously generated (only those that are not found in the history table in the DB). (Specifically, it runs the up functions of each migration)
    Updates the database and the history table of the database. (The history table is a table which keeps track of all the migrations previously run. Helps typeorm find the differences between the actual database and the entities)
    Can be simulated with the --fake flag
    Run this with: `npm run migrations:run``

- revert

    Reverts the last run. (Specifically runs the down function of the last migration)
    Can be simulated with the --fake flag
    Run this with: `npm run migrations:revert``

So, to sum it up, the developer who adds changes has to:

    - Pull the latest stable branch and run the migrations from there. This makes the migrations be up to date with the stable state of the database.
    - Add their changes to the code
    - Generate and run a new migration (Alternatively, create a manual data migration) and push the changes, including the newly generated migration file.

### How do migrations work

Typeorm has the possibility to automatically run migrations that have been previously generated and pushed, given the migrationsRun configuration variable is set. This is enabled through the `POSTGRES_MIGRATIONSRUN` environment variable set to True in Yaku api deployment.

### Rules to follow for smooth operations

- Baseline migrations:

    Generally, projects are started with migrations in mind.
    There might be a chance that an already established database wants to use migrations. For such cases, developers could fall in a situation in which they want to try things locally, but the only migrations available are the ones added after the migration usage began. As a result, the generated database will be missing the big chunk of information that was there previously.
    A baseline migration should be generated to keep track of the previous database schema. This can be done by running generate on the project before any migrations are added. However, in order to ensure that this works in both cases (when the database exists and when it doesn't), additional checks should be added to see if the baseline databases should be added or not.

- Don't rewrite history:

    Migrations should be considered as immutable once they are pushed to the repository. The only way of changing an already pushed migration should be by pushing a new migration or by reverting a new migration. This condition works similarly to how you wouldn't cut a commit laying at the middle of the commit history.

- Follow the main branch: 

    Migrations should be generated based on the newest main branch. Starting migrations from any other branch would create discrepancies between migrations, leading to history rewriting, inter-dimensional time-loops and black holes.

## Admin Endpoints

| Name             | Request | Endpoint                           | Body                                                                 |
|------------------|---------|------------------------------------|----------------------------------------------------------------------|
| Get Namespaces   | GET     | `/api/v1/namespaces`               |                                                                      |
| Create Namespace | POST    | `/api/v1/namespaces`               | `{"name": "my-namespace", "users": [{"username": "xxx"},{"username": "yyy"}]}` |
| Get Users        | GET     | `/api/v1/users`                    |                                                                      |
| Create User      | POST    | `/api/v1/users`                    | `{"username": "xxx"}`                                                |
