# Create Local Setup Yaku

## Cluster Setup

1. Install kind (version 0.20.0) by following the instructions [here](https://kind.sigs.k8s.io/docs/user/quick-start/#installation).
2. Navigate to the `localdev` folder.
3. Create a kind cluster using the provided configuration file:
   ```bash
   kind create cluster --config=kind-cluster-config.yaml
   ```
4. Activate your AnyConnect VPN.
5. Download the `yaku-core-dev` docker image from the Azure Container Registry (ACR). In case of Podman, check the [troubleshooting section](#troubleshooting) below:
   ```bash
   az login
   az account set --name OT-GROW-PAT-SW-Dev
   az acr login -n growpatcrdev.azurecr.io
   docker pull growpatcrdev.azurecr.io/yaku-core-dev:latest
   # or podman
   podman pull growpatcrdev.azurecr.io/yaku-core-dev:latest
   ```
6. Add the `yaku-core-dev` image to the cluster. Choose either of the following methods:

   - Podman:
     ```bash
     podman save growpatcrdev.azurecr.io/yaku-core-dev -o image.tgz
     kind load image-archive image.tgz --name yaku
     ```
   - Docker:

     ```bash
     kind load docker-image growpatcrdev.azurecr.io/yaku-core-dev:latest --name yaku
     ```

     Verify the image is present:

     ```bash
     kubectl get nodes yaku-control-plane -o yaml

     ```

7. Run the following commands to apply the Kubernetes configuration:
   ```bash
    kubectl kustomize . > applyme.yaml
    kubectl apply -f applyme.yaml
   ```

## Postgres DB Setup

1. Install PostgreSQL from [here](https://www.postgresql.org/download/).
2. Source the needed environment variables (you can use [.env.localdev.sample](../qg-api-service/.env.localdev.sample) as a template)
   ```bash
   source .envrc
   ```
3. Install and build the Core API service.
4. Run any migrations with `npm run migration:run` to create the initial database tables which are needed for the next step.
5. Start the Core API service.
6. Install the yaku-cli, e.g. with:

   ```bash
   npm install -g @B-S-F/yaku-cli
   ```

7. Ensure that you have a user in the `bswf` Keycloak realm with `ADMIN` access.
8. Generate a login session for that user using the command `yaku login --admin`
9. Run the [init yaku script](./init-yaku.sh).

   Be aware that this script is not very robust in case of re-runs or errors. It is recommended to run it only once and in case of errors carefully check what commands from the script were already executed and which need to be executed again.

   This script will do the following:

   - Create namespace (`mynamespace`)
   - Create local myuser env for the yaku-cli

### DB Migrations

1. Before merging into the 'main' branch, make sure that you have all the migrations from there.
2. Delete your migration files
3. Reset your database setup:
   - delete databases' persistent volume claim: `kubectl delete pvc -n aqua <yaku-postgres-pvc>`
   - while the previous operation is waiting, delete all resources using the DB, i.e. `kubectl delete pod -n aqua <yaku-postgres-pod> <yaku-keycloak-pod> <other resources using DB>`
   - reapply your cluster configuration from step 7 of [Create Local Setup Yaku](#create-local-setup-yaku) with `kubectl apply -f applyme.yaml`
4. Run existing migrations with `npm run migration:run`
   > [!TIP]
   > This sets the database to the 'main' branch state
5. Generate your migrations with `npm run migration:generate`
   > [!TIP]
   > This generates your changes
6. Run the latest generated migration with `npm run migration:run`
7. Generate migrations again with `npm run migration:generate` to make sure that you cover all the possible constrains that might have appeared in the previous run (this should end up as an error)
8. If a new migration was generated, merge it into the previous migrations (all queries from the second migration's up function after the queries in the first one's up function. repeat for the down function)

## Keycloak Setup

You can access keycloak UI at http://localhost:30115/auth and login as Admin with admin credentials defined in [deployment file](./keycloak/deployment-keycloak.yaml).

### Set the value of the KEYCLOAK_WELL_KNOWN_CONFIG environment variable

In KeyCloak, go to the BSWF realm -> Realm setting -> Endpoints -> OpenID Endpoint Configuration and copy the URL.
This configuration is the the well-known configuration endpoint that Keyclaok exposes and it contains a list of endpoints and configurations relevant to OpenID Connect.
Set the `KEYCLOAK_WELL_KNOWN_CONFIG` environment variable to the URL of the well-known cofiguration (e.g. `http://localhost:30115/auth/realms/bswf/.well-known/openid-configuration` as in the example in [.env.localdev.sample](../qg-api-service/.env.localdev.sample)).

### Startup Configuration

At Keycloak container startup, a realm with the name `bswf` is created automatically with the following components:

- Clients:
  - NAMESPACE_1
  - yaku-core
  - yaku-core-swagger
- Roles: (format is: Client/Role)
  - NAMESPACE_1/ACCESS
  - NAMESPACE_1/CONFIG_READ
  - NAMESPACE_1/CONFIG_WRITE
  - NAMESPACE_1/RUN_READ
  - NAMESPACE_1/RUN_WRITE
  - NAMESPACE_1/SECRET_READ
  - NAMESPACE_1/SECRET_WRITE
  - yaku-core/USER
  - yaku-core/ADMIN

### Manual Secrets Configuration

The following steps you need to configure manually to be able to use your Keycloak instance:

#### Identity provider client ID secret

[qg-service-ui](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/58f74d87-c26e-45a8-8ec3-2af69c4dde29/isMSAApp~/false) app registration is used as identity provider client.
Go to Certificates & Secrets in app registration page in azure portal, create a secret for you and update `Client Secret` value in bosch-azure-ad identity provider. To do so, go to `Identity providers` -> `bosch-azure-ad` and update `Client Secret` field value under `OpenID Connect settings`.

#### yaku-core client secret

Clients in Keycloak are applications/services that can request Keycloak to authenticate a user. `yaku-core` is our api service that equest Keycloak for authentication. This client has a secret, which needs to be known to both the application (Yaku core api in this case) and the Keycloak server. This is why you need to provide this client secret as a configuration variable for yaku api.

Go to yaku-core client --> Credentials and regenerate the client secret. You can then use the new generated value in `KEYCLOAK_CLIENT_SECRET` configuration env variable of Yaku core api.

### Assign roles to your user

You need to login once to the yaku swagger ui via the bosch-azure-ad identity provider, in order to be able to find your username under users in Keycloak. To login, when you click on `Authorize` button, you'll see two options `bearer  (http, Bearer)` and `oauth2 (OAuth2, authorizationCode with PKCE)`. Click on `Authorize` under the `oauth2 (OAuth2, authorizationCode with PKCE)` option. You do not need to enter any client_secret for the already specified yaku-core-swagger client_id.

After logged in successfully in swagger ui, you can go to your username in keycloak and assign `NAMESPACE_1 ACCESS` role. This means you have access to namespace with id 1 in your yaku api instance.

## Use Yaku

1. Add a config to your namespace
2. Add a `qg-config.yaml` to your config
3. Start a run.

## Troubleshooting

- To test the Argo Workflow setup, follow the instructions [here](https://argo-workflows.readthedocs.io/en/latest/kubectl/). Make sure to adapt the namespace accordingly.
- If encountering issues with image loading or pulling, ensure that the necessary credentials are correctly configured and accessible.
- As an alternative to pushing the images into the cluster, you can also pull the image from inside the cluster:
  - Activate your AnyConnect VPN and obtain an access token for the Azure Container Registry (ACR):
    ```bash
    az acr login -n growpatcrdev.azurecr.io --expose-token --output tsv --query accessToken
    # or with podman
    podman login growpatcrdev.azurecr.io -u 00000000-0000-0000-0000-000000000000 -p "$(az acr login --name growpatcrdev --expose-token -o tsv --query accessToken)"
    ```
  - Open a Bash shell on the cluster node:
    ```bash
    docker container exec -it yaku-control-plane bash
    # or
    podman container exec -it yaku-control-plane bash
    ```
  - Pull the image inside the node:
    ```bash
    crictl pull --username 00000000-0000-0000-0000-000000000000 growpatcrdev.azurecr.io/yaku-core-dev
    ```
    When prompted for the password, use the token obtained in the first step.
  - If the database does not start properly and in the log you see an error message like `FATAL:  database "postgres" does not exist`, you can try to delete the database files in the persistent volume and restart the database:
    - Open a Bash shell on the cluster node:
      ```bash
      docker container exec -it yaku-control-plane bash
      # or
      podman container exec -it yaku-control-plane bash
      ```
    - Delete the database files:
      ```bash
      rm -rf /data/pv0001/db-files # or pv0002, pv0003, ...
      ```
    - Restart the database pod.
- If encountering issues with image pulling on kind behind a proxy, there is the possibillity to pull all the images into docker and sync them into the kind control plane.
  ```bash
  docker pull quay.io/argoproj/argocli:v3.4.13
  ...
  kind load docker-image quay.io/argoproj/argocli:v3.4.13 --name yaku
  kind load docker-image minio/minio:latest --name yaku
  kind load docker-image quay.io/argoproj/workflow-controller:v3.4.13 --name yaku
  kind load docker-image quay.io/keycloak/keycloak:20.0.5 --name yaku
  kind load docker-image postgres:13-alpine --name yaku
  ```
  - ensure that you add the imagePullPolicy for the [minio deployment](argo-workflows/argo-workflows-upstream.yaml#L1804) and set it to `Never` or `IfNotPresent`
