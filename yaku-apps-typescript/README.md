<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

![Code Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/git3wid/6bf2099ffe34b1daa3e2c00571cc28f7/raw/qg-apps-typescript-coverage-badge.json)

# QG Apps in TypeScript

## Overview

This repository is a monorepo based on [turbo repo](https://turborepo.org/docs) that contains all standard apps of Yaku written in Typescript. The apps are used within autopilots defined in the configuration for a certain workflow run. Technically, each app is a command line executable that is configured using environment variables and that produces the output as expected from a workflow app.

The repository has the following structure:

| Folder       | Description                                                                             |
| :----------- | :-------------------------------------------------------------------------------------- |
| **apps**     | Source code of standard QG apps developed. Each app is stored in its own folder.        |
| **packages** | All additional packages used in the apps and other typescript based code of the tooling |

## Installation

Prerequisite: Since all apps in this repository are typescript based, you need node.js and npm installed on your machine. The apps are tested against the latest minor version of node 18 with the corresponding npm in version 9.

After cloning the repository, you have to set up the repository. Since this is a monorepo, it is enough to run the following command in the repository root folder:

```bash
npm install -ws --install-workspace-root
```

**Note**: Some of the apps in this repository are using internal dependencies that are stored in Github packages. To be able to install these dependencies, you need to log to the github packages repository with your npm client.

This is done with the following command:

```bash
npm login --registry https://npm.pkg.github.com  --scope @B-S-F --auth-type legacy
```

Then, you need to enter your github username and a personal access token with the scope `read:packages` as password.

To build and test the apps, run

```bash
npm run build
npm run test
npm run test:integration:ci
```

The latter two commands work on root level of the repository as well as in any of the app or package folders.

### Running an app

Each app can be started by running:

```bash
npm run start # in the corresponding app folder
npm run start -w <app-name> # in the repository root folder
```

Please check necessary environment variables needed by the app to execute properly. A set of examples for many apps can be found in the [documentation repository](https://github.com/B-S-F/qg-api-service/tree/main/tests/e2e-tests/src/e2e-tests)

## Developing the apps in this repository

The workflow for enhancing the functionality of the apps in this repository is based on the standard pull request workflow of Github. If you want to do a change, work on your own development branch and push the branch to github. Afterwards start a pull request. By starting the pull request, a check action workflow is triggered that validates your changes against the expectations. Expectations are, that no regression test is failing and that additional constraints like an open source scan and code coverage requirements are met.

In addition to succeed the pull request workflow, a review is needed for the pull request in order to enable it for merging. If both requirements are met, the pull request can be merged to the main branch of the repository.

## Releasing an app

Each app has its own life cycle. Therefore, each app can be released on its own. Each app follows the idea of semantic versioning, i.e., an app has a major, a minor and a patch version that is updated during the release. A release is executed with a release action workflow that can be triggered through the GitHub user interface. The workflow allows you to specify the commit-ish that contains the content to be released and the version type of the release (major, minor or patch). After the successful execution of the release workflow, a tag with the new version is created in a branch. A pull request is automatically opened, which must be manually merged in the main branch after checking the changes executed. The changes are mainly the adaptations of the relevant files to the new version. In addition, the app has been pushed to the [Github npm package registry](https://github.com/orgs/B-S-F/packages?repo_name=qg-apps-typescript).

### Handling of packages

All packages stored under the `packages` folder are handled like the apps. Each is a npm package on its own and can be developed and released like an app. The release workflow allows to select each package in the same manner as any of the apps. The only difference is, that packages are meant to be used in apps itself, so after a release, the dependency to the package needs to be updated manually, so that the new version is used from that point on.

## Create a new app

The creation of a new app is supported by a template repository, which contains the relevant structure for an app. Find here the [template repository](https://github.com/B-S-F/typescript-app-template). Copy the folder structure, e.g., here to the app folder and implement the required functionality

## More Information

For more information about the different apps, please check the [documentation](https://cuddly-adventure-1991k8p.pages.github.io/autopilots/index.html).
