# Fetcher Background Information

The fetcher makes a request against jFrog Artifactory REST API, downloads the specified artifact and stores it in the evidence path.
It performs an SHA256 Checksum check on the downloaded artifact and stops if there is an error. The evidence path is set during the execution of a run and read as an environment variable by any evaluator used to evaluate the data fetched by artifactory-fetcher.

## Prerequisites

The user id that is set for the fetcher in {envvar}`ARTIFACTORY_USERNAME` must have access to the Artifactory repository in order for the fetcher to work.

## Environment variables

```{envvar} ARTIFACTORY_URL
The URL of the Artifactory server where the evidence artifact is located.
```

```{envvar} REPOSITORY_NAME
The name of the repository where the artifact is stored.
```

```{envvar} ARTIFACT_PATH
The path to the artifact in the repository, without the repository name.
```

```{envvar} ARTIFACTORY_USERNAME
A valid user NT-ID.
```

````{envvar} ARTIFACTORY_API_KEY
A valid Artifactory API key of the defined {envvar}`ARTIFACTORY_USERNAME`.

To get your API key from Artifactory: go to Artifactory UI, click on your username on the top-right corner and choose **Edit Profile**. From there you can copy the API Key.

If you want to check if the API key has access to the artifact you want to fetch, you can use a curl command:

```bash
curl -u $ARTIFACTORY_USERNAME:$ARTIFACTORY_API_KEY $ARTIFACTORY_URL/$REPOSITORY_NAME/$ARTIFACT_PATH
```

If you get a 401 or 403 error, this means the provided token is either wrong or doesn't have access to the required artifact
````

## Example config

Below is an example configuration file that runs Artifactory fetcher. The autopilot is configured in lines: 7-16. Required environment variables are read from provided run environment variables or secrets. Then the autopilot is used by the check 1 in line 31 which is part of requirement 1.15.

In this example, a simple check is done in line 10, to check if the artifact was fetched successfully. Artifactory fetcher can be used with other evaluators that can perform checks on the required artifacts.

```{literalinclude} resources/qg-config.yaml
---
language: yaml
linenos:
emphasize-lines: 7-16, 10, 31
---
```
