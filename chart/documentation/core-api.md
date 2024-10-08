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

### DB Schema Management

The API service is implemented using TypeORM as connection technology to manage the database. Currently, the automatic schema management from TypeORM is used to create and migrate the database schema over time. As a consequence, in a situation that a new database needs to be used, the service has to be run once to create the tables and constraints needed in the database. There is no alternative way to create the database, because TypeORM is very picky about the database and does not compare on a structural basis but insists on creating and maintaining the database on its own. Even a backup and restore into another database is not accepted by TypeORM. Therefore, creating an empty database must be done using the service.

## Create an Admin User

**Note**: This will be soon deprecated. We recommend that you use Keycloak for user management.

The current implementation of the service requires an admin user and a token of this user to bootstrap the service. This is due to the fact that users, tokens, and namespaces can only be created by an admin user and they have to exist prior to any meaningful usage of the service.

In order to bootstrap this, we created a tool called `qg-dbinit`, that creates the required database commands to prepare the database with an admin user and token.

`qg-dbinit` is a small golang tool, that can be run on any machine with a golang development system in place.

### How to use `qg-dbinit`

Export the environment variable `JWTKEY`. The value of this variable must match the value of `JWT_SECRET_KEY` variable used in the service. Run the tool locally or run the docker image:

```bash
docker run -e JWTKEY=<JWT_SECRET_KEY> growpatcr.azurecr.io/qg-dbinit:1.0.0
```

The output should contain the following:

1. An insert statement that creates the admin user in the corresponding database table. It looks like:
   ```bash
   insert into "user" (username, roles) values ('admin', 'admin')
   ```

1. An insert statement that creates an access token entry for the created admin user in the corresponding database table. It looks like:

   ```bash
   insert into api_token_metadata ("tokenId", "userId") values ('$2a$05$QE.n8aZbcmDxdqdeDiUZ6uvVCzOHogCW2m42.3/v86IdNQP/7eB.q', <1>)
   ```

   Be aware that the second parameter '<1>' is a placeholder for the unique id of the user which is returned by the first insert statement. Replace it prior to executing the statement.

1. The token for the admin user. It must not be stored in the database but managed independent of the service in the key vault of your choice. It looks like:

   ```bash
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTE0NjU2MTcsImlhdCI6MTY3OTkyOTYxNywidG9rZW5JZCI6IjAxOTZkY2Q4LTYxZjQtNDE5Ny05NjI2LWI5ZDliNTBmYzgxYSIsInVzZXJuYW1lIjoiYWRtaW4ifQ.WEZieyX15j8_FlsY3JvxzZRO-p-92CBSIS8pZiCK7uY
   ```

You have to execute the two insert statements using a DB client, e.g., psql. After the two rows are entered into the database, it is possible to start using the service via the REST API.

## Admin Endpoints

| Name             | Request | Endpoint                           | Body                                                                 |
|------------------|---------|------------------------------------|----------------------------------------------------------------------|
| Get Namespaces   | GET     | `/api/v1/namespaces`               |                                                                      |
| Create Namespace | POST    | `/api/v1/namespaces`               | `{"name": "my-namespace", "users": [{"username": "xxx"},{"username": "yyy"}]}` |
| Get Users        | GET     | `/api/v1/users`                    |                                                                      |
| Create User      | POST    | `/api/v1/users`                    | `{"username": "xxx"}`                                                |
| Get Users Tokens | GET     | `/api/v1/users/users/api-tokens`   |                                                                      |
| Create User Token| POST    | `/api/v1/users/users/api-tokens`   | `{"username": "xxx"}`                                                |

## Database Migrations

As described before in Schema Management by the Service, the database is managed by TypeORM, i.e., changes in the schema are automatically executed in the database when the service starts with a new version. This imposes some risks:

- When a property is removed, the corresponding column is removed with all data in it. If the change is done by accident, data will be lost.
- When a new property is added which might not be NULL, the database gets into an inconsistent state because all old rows will not have a value which violates the NON-NULL constraint.
- When a property is changed, data might get lost if the renaming is not done properly.

In order to ensure safe data management, please follow these patterns:

- Do not remove properties in the service entities without a 4-eyes principle (a review is not enough, discuss the changes with someone else).
- When adding a new property, do it in three steps (which require each step to be deployed as its own version):
    1. Introduce the property as a nullable property.
    2. Run a migration script that fills the column for all rows with a default value.
    3. Change the property to prevent nullable values.
- Change property names only by adding the new name and follow similar three steps, by adding the property, migrating by copying the data, and removing the old property in a third step.

The pattern for data migrations involves using an `onApplicationBootstrap` event action, as detailed in the NestJS documentation on lifecycle events: [Lifecycle Events in NestJS](https://docs.nestjs.com/fundamentals/lifecycle-events). This action is initiated once the service launches but subsequent to the database connection. It facilitates the execution of necessary data migrations for altered table schemas. Execution of this action is synchronous, meaning the service will pause until the action completes, ensuring no access to the service API is permitted in the interim. This action must be incorporated before the service deployment to implement step 2 of the outlined migration pattern and should be removed for the subsequent step 3 deployment. Practical experience indicates that both steps 1 and 2 of the migration pattern can be consolidated into a single deployment phase. Consequently, TypeORM will enact schema modifications immediately upon service initialization, followed by the migration action, which applies to the newly adjusted schema.
