<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Yaku

[![Build](https://github.com/B-S-F/yaku/actions/workflows/build.yml/badge.svg)](https://github.com/B-S-F/yaku/actions/workflows/build.yml)
[![User Documentation](https://github.com/B-S-F/yaku/actions/workflows/publish-user-docs-to-gh-pages.yml/badge.svg)](https://b-s-f.github.io/yaku/)

**!! THIS PROJECT IS UNDER CONSTRUCTION !!**

<img src="./documentation/under-construction.jpg" alt="Under Construction" width="300"/>
<figcaption>
Photo by Mabel Amber from <a href="https://www.pexels.com/de-de/foto/nahaufnahme-fotografie-der-roten-und-weissen-strassenbeschilderung-117602/" target="_blank" style="color: #555;">Pexels</a>
</figcaption>

## User Documentation

If you have already deployed Yaku, start by reviewing the [user documentation](https://b-s-f.github.io/yaku/).

## Components

The image below illustrates the components of Yaku and their interactions.

![Yaku Components](./documentation/yaku-components.svg)

1. **User Interaction**: Users can interact with Yaku via the UI or API, allowing CI pipeline integration.
2. **Workflow Engine**: Utilizes Argo Workflows for orchestrating QG assessment jobs on Kubernetes. Argo Workflows is included as a sub-chart in the Yaku Helm chart. Learn more about [Yaku core API Argo workflows](./documentation/core-api.md#argo-workflows).
3. **Database**: Yaku core API uses PostgreSQL, with a default database named `yaku`. A PostgreSQL container is included in the Helm chart.

   **Note:**
    - The default database `yaku` cannot be changed unless using a custom PostgreSQL server.
    - The default username is **postgres**, stored in the Kubernetes secret **yaku-default-postgres-creds**.
    - For production, a suitable PostgreSQL database is recommended. More details in the [Yaku core API database](./documentation/core-api.md#database).

4. **Access Management**: Yaku uses Keycloak for access management, supporting OpenID Connect and SAML2. Refer to the [Keycloak configuration guide](./documentation/configure-keycloak.md) for setup instructions. A basic deployment guide is also available [here](./documentation/deploy-keycloak.md).

## Operator Guide

The operator documentation is located in the `documentation/` folder.
Refer to the [Yaku Operator Guide](./documentation/operator-guide.md) for installation and operation instructions.
It also contains [known issues](./documentation/known_issues.md) that you might face with Yaku deployment.

## Development

For developer documentation, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Licenses

See the [LICENSES](./LICENSES) folder for project licenses.
