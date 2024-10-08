# Helm Chart Changelog

In this file we keep track of the changes we make to the helm chart to be deployed in our SAAS.
When such changes are needed, the patch version of the helm chart is incremented.
When a new official version is created to be delivered to external customers, the minor or major version is incremented.

## 1.0.1 [28.03.2024]

### Removed

- Argo workflows cluster roles

### Changed

- Argo workflows Priority Class name matches release name
- Service and Ingress resources matches release name

## 1.1.1 [09.04.2024]


### Added

- Configurable Argo Workflows pod labels

## 1.1.2 [16.04.2024]


### Changed

- Get started Yaku postgres service name fixed
- UI config file mount path is fixed

## 1.3.1 [10.05.2024]


### Added

- Use Argo Workflow helm chart as sub chart
- Use minio helm chart as sub chart
- Disable Argo workflows archiving
- Add possibility to specify custom service labels and annotations
- Add possibility to specify custom selector labels of yaku api and ui deployments
- Provide default admin user and api key for a playground environment

## 1.3.2 [14.05.2024]


### Added

- Add a pre-install/upgrade hook job for sandbox environments to copy dev db

## 1.3.3 [21.05.2024]


### Changed

- Install Argo CRDs as part of Argo Workflows chart
- Add Keycloak yaku realm configmap to be imported on startup

## 1.3.4 [07.06.2024]

### Changed

- Fix sandbox DB initialization job
- Sandbox DB initialization sql script: drop and recreate DBs before restore
- Sandbox DB initialization sql script: Remove redundant clean flag from pg_restore

## 1.3.5 [07.06.2024]

### Added

- Add possibility to define readiness and liveness probes of yaku api pod

## 1.3.6 [18.06.2024]

### Added

- Add possibility to specify custom core-api labels

## 1.3.7 [09.07.2024]

### Added

- Add default selector labels for api and ui deployments
- Increase DEFAULT_RATE_LIMIT to 100

## 1.3.8 [19.07.2024]

### Changed

- UI container port
- UI config mount path

### Removed
- NewRelic configuration

## 1.3.9 [26.07.2024]


### Removed
- AzureAD authentication configuration variables (app_id, tenant_id)
- Yaku API generated tokens jwt Encryption key configuration variables.

### Added
- A k8s secret with random value if encryption secret is not configured.

## 1.3.10 [08.08.2024]


### Changed
- db_cacert_secret_name to cacert_secret_name

### Added
- global.notifications section for email notifications feature
- global.explanations section for explainable autopilots feature
- minio_use_ssl core-api env option
- cacert_key_name core-api env option
- instance_name core-api env option
- enable_override_controller core-api env option
- disable_old_tokens core-api env option
- run_db_migrations core-api env option
- yaku-labs deployment

## 1.4.1 [23.08.2024]


### Changed
- Updated db_cacert_secret_name to cacert_secret_name in sandbox-migration-job