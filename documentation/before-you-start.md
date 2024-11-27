<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Before You Start

As you are reading this document, this means you are ready to deploy the Yaku Helm chart on your Kubernetes cluster.

Before starting the deployment, we would like to give you an overview of the contents of the Helm chart directory.

## Prerequisites

Before proceeding with the installation, ensure that you have met the following prerequisites:

- **Docker Images**: The Docker images for Yaku Core, Yaku Core API, and Yaku UI must be built in advance.

  > **TODO**: Build the Docker images for Yaku components. Detailed instructions on building these images will be provided in a separate guide.

- **Kubernetes Cluster**: You have access to a Kubernetes cluster where you have the necessary permissions to deploy resources.

- **Helm**: Helm is installed on your local machine and configured to interact with your Kubernetes cluster.

## Helm Chart Directory Contents

The Helm chart files are located in the `charts/` directory and include:

- `Chart.yaml`
- `values.yaml`
- `templates/`
- `charts/`

These files comprise the Helm chart to be deployed. You can install the Helm chart directly from the source code without needing to package it.

You will need to ensure that the Docker images for Yaku components are accessible by your Kubernetes cluster. If you have built the images locally, you might need to push them to a container registry that your cluster can access.

A list of all Docker images can be found in the **values.yaml** file under the global section.

### Operator Documentation

The operator documentation is located in the `documentation/` folder. It contains deployment guides and an overview of the components deployed as part of the Yaku Helm chart. It also contains [known issues](./known_issues.md) that you might face with Yaku deployment.

User documentation is available online [here](https://docs.bswf.tech/).

### ChangeLog

With each new release of the Yaku Helm chart, a `ChangeLog` file is included that contains the list of all changes introduced in the release. The file name is `{yaku-version}-release-notes.md`.

### Yaku-CLI

The `yaku-cli` is a command-line tool that can be used to interact with the Yaku Core API. More information about the `yaku-cli` can be found in our user docs [here](https://docs.bswf.tech/cli/index.html#).

## Config Schema

`qg-config-schema.json` is the JSON schema that defines the structure of the `qg-config.yaml` file.

## Installing the Helm Chart

After ensuring all prerequisites are met and the Docker images are built and accessible, you can proceed to install the Helm chart directly from the source code.

### Steps to Install

1. **Navigate to the Chart Directory**:

   ```bash
   cd charts/
   ```

2. **Run Helm Install**:

   Use the `helm install` command to deploy the chart. You will need to override the image repositories and tags to point to your built images.

   ```bash
   helm install yaku . \
     --set global.imageRegistry=<your-image-registry> \
     --set global.core.image.repository=<your-core-image> \
     --set global.core.image.tag=<your-core-image-tag> \
     --set global.coreApi.image.repository=<your-core-api-image> \
     --set global.coreApi.image.tag=<your-core-api-image-tag> \
     --set global.ui.image.repository=<your-ui-image> \
     --set global.ui.image.tag=<your-ui-image-tag>
   ```

   Replace `<your-image-registry>`, `<your-core-image>`, `<your-core-image-tag>`, `<your-core-api-image>`, `<your-core-api-image-tag>`, `<your-ui-image>`, and `<your-ui-image-tag>` with the appropriate values for your environment.

   **Example**:

   ```bash
   helm install yaku . \
     --set global.imageRegistry=myregistry.example.com \
     --set global.core.image.repository=yaku-core \
     --set global.core.image.tag=1.0.0 \
     --set global.coreApi.image.repository=yaku-core-api \
     --set global.coreApi.image.tag=1.0.0 \
     --set global.ui.image.repository=yaku-ui \
     --set global.ui.image.tag=1.0.0
   ```

3. **Verify the Installation**:

   Check the status of the deployed resources:

   ```bash
   kubectl get pods
   kubectl get services
   ```

   Ensure that all pods are running and services are available.

## What Should I Do Next?

Now that you have an overview of the contents of the Helm chart directory and have installed the Helm chart on your Kubernetes cluster, consider looking at [the get-started doc](./get-started.md) for next steps in configuring and using Yaku.

Citations:
[1] https://helm.sh/docs/topics/charts/
[2] https://docs.bitnami.com/kubernetes/faq/administration/understand-helm-chart/
[3] https://helm.sh/docs/intro/using_helm/
[4] https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
[5] https://medium.com/google-cloud/kubernetes-and-helm-create-your-own-helm-chart-5f54aed894c2
[6] https://codefresh.io/blog/simplify-kubernetes-helm-deployments/
[7] https://www.youtube.com/watch?v=DnzZK70zbo0
[8] https://helm.sh/docs/chart_best_practices/
[9] https://kubernetes.io/docs/concepts/workloads/management/
[10] https://octopus.com/docs/kubernetes/steps/helm
