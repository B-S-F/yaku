<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Yaku Operator Guide

The [Yaku Helm chart](../chart) can be installed on any Kubernetes cluster.
The chart contains deployments for components (API and UI) and all required dependencies (Argo workflows, MinIO,
PostgreSQL, etc.).
We defined the dependencies as subcharts so you can run Yaku out-of-the-box quickly. The dependencies are there to get
you started with using Yaku, but once you want to use it in production, we recommend deploying the dependencies
separately to be production-ready or use hosted solutions that your enterprise provides.

## Before you start checklist

Before you start, you need:

- A Kubernetes cluster with admin access and with the following minimum free resources available:
    - 64 GB of memory
    - 8 CPU cores
    - Free storage if you'll be using persistent storage
- A namespace where you'll deploy Yaku.
- A container registry the cluster has access to.
- A Kubernetes secret for yaku service secret objects encryption is created. This value is needed to encrypt sensitive
  data stored in the db. Learn [here](./core-api.md#encryption-keys) why you need that. If you want to try
  Yaku in a playground setup, you can skip this requirement. This will generate a predefined encryption key which you
  can use. We recommend that you create your own value and deploy it as kuberenets secret, then add the kubernetes
  secret info in values file under `encryption_secret_name` and `encryption_secret_key`

## Build the docker images

You will need to ensure that the Docker images for Yaku components are accessible by your Kubernetes cluster. If you
have built the images locally, you might need to push them to a container registry that your cluster can access.

To push Docker images to a registry after building them locally, you need to follow a few additional steps. This
involves tagging the images appropriately and using the `docker push` command to upload them to your desired registry.
Here's how you can do it:

#### Backend Docker Image

Build the Backend Docker Image

   ```bash
   docker build -t y-registry.com/my-namespace/api:canary\
     --platform linux/amd64 \
     -f qg-api-service/qg-api-service/Dockerfile \
     ./qg-api-service/qg-api-service
   ```

Log in to Your Docker Registry
Ensure you are logged into your Docker registry. This step is necessary if your registry requires authentication.

   ```bash
   docker login my-registry.com
   ```

Push the Backend Docker Image

   ```bash
   docker push my-registry.com/my-namespace/api:canary
   ```

#### Core Docker Image

Build the Core Docker Image

   ```bash
   docker build -t my-registry.com/my-namespace/core:canary\
     --platform linux/amd64 \
     -f core-image/Dockerfile \
     ./core-image
   ```

Push the Core Docker Image

   ```bash
   docker push my-registry.com/my-namespace/core:canary
   ```

#### UI Docker Image

Build the UI Docker Image

   ```bash
   docker build -t my-registry.com/my-namespace/ui:canary\
     --platform linux/amd64 \
     -f yaku-ui/Dockerfile \
     ./yaku-ui
   ```

Push the UI Docker Image

   ```bash
   docker push my-registry.com/my-namespace/ui:canary

### Summary

- **Build and Tag**: First, build your Docker images using the `docker build` command. Tag them appropriately for your
  registry.
- **Login**: Use `docker login` to authenticate with your registry if required.
- **Push**: Use `docker push` to upload your images to the registry.

These steps ensure that your Docker images are built and pushed to your specified registry, making them available for
deployment or sharing. Always ensure your registry credentials are secure and not hard-coded in scripts.

## Installing the Helm Chart

After ensuring all prerequisites are met and the Docker images are built and accessible, you can proceed to install the
Helm chart directly from the source code.

### Steps to Install

1. **Navigate to the Chart Directory**:

   ```bash
   cd charts/
   ```

2. **Run Helm Install**:

   Use the `helm install` command to deploy the chart. You will need to override the image repositories and tags to
   point to your built images.

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

   Replace `<your-image-registry>`, `<your-core-image>`, `<your-core-image-tag>`, `<your-core-api-image>`, `<your-core-api-image-tag>`, `<your-ui-image>`,
   and `<your-ui-image-tag>` with the appropriate values for your environment.

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

## Yaku-CLI

The `yaku-cli` is a command-line tool that can be used to interact with the Yaku Core API. More information about
the `yaku-cli` can be found in our user docs [here](https://b-s-f.github.io/yaku/cli/index.html#).
