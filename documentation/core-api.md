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
## Admin Endpoints

| Name             | Request | Endpoint                           | Body                                                                 |
|------------------|---------|------------------------------------|----------------------------------------------------------------------|
| Get Namespaces   | GET     | `/api/v1/namespaces`               |                                                                      |
| Create Namespace | POST    | `/api/v1/namespaces`               | `{"name": "my-namespace", "users": [{"username": "xxx"},{"username": "yyy"}]}` |
| Get Users        | GET     | `/api/v1/users`                    |                                                                      |
| Create User      | POST    | `/api/v1/users`                    | `{"username": "xxx"}`                                                |
