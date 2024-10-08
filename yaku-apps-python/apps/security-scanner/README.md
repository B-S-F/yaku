# Security Scanner

This app scans a remote git repository for security vulnerabilities.
For scanning, it runs [Trivy](https://aquasecurity.github.io/trivy/v0.41/) open source scanner for security issues.

## How to use

The app can be configured using the following environment variables:

### `GIT_TOKEN`
A valid personal access token that has access to the git repo or that has proper SSO configuration to access the required organization.

### `GIT_REPO_URL`
Remote git repository URL.

### `VUL_SEVERITY`
Severities of security issues to be displayed (comma separated). 
Default value: "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL"

### `LOCAL_REPO_SCANNER`
If set to TRUE, the app will clone the repository, run `npm install` and run a local fs scan on the repo directory.
Default value: "FALSE"
      
### `PRIVATE_REGISTRY`
If the repository installs packages from a private registry, set this to TRUE.
Default value: "FALSE"

### `PRIVATE_REGISTRY_URL`
If the repository installs packages from a private registry, set this to the registry URL.

### `PRIVATE_REGISTRY_TOKEN`
If the repository installs packages from a private registry, set this to a valid token that have access to the registry.

### `PRIVATE_REGISTRY_SCOPE`
If the repository installs scoped packages from a private registry, set this to the registry scope.

### `OUTPUT_FINDINGS_TO_COMMENTS`
If set, the app will output the findings also as comments.