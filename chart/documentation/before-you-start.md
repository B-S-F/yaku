# Before You Start

As you are reading this document, this means you have already downloaded the Helm chart zip file from the Yaku registry and are ready to deploy it on your Kubernetes cluster.

Before starting the deployment, we would like to give you an overview of the contents of this zip archive.

To deliver the best experience to our customers, we have decided to include all release-related artifacts within the Helm chart archive, allowing you to download it once and host it internally within your organization.

## Helm Chart Archive Contents

The Helm chart archive contains the following files:

### Yaku Helm Chart Files

Included files are: `Chart.yaml`, `values.yaml`, `templates/`, `charts/`.

These files comprise the Helm chart to be deployed. Since some customers require all Docker images and the Helm chart to be hosted locally within their organization, you might need to push this chart to your internal repository for deployment on your Kubernetes cluster.
You will also need to push all Docker images to your internal repository. A list of all Docker images can be found in the **values.yaml** file under the global section.

You can push the entire Helm chart archive to your internal repository, or you can push only the Helm chart files by running:

```bash
    mkdir yakuchart
    cp -r charts templates Chart.yaml values.yaml yakuchart
    helm package yakuchart -u
```

And then push the `yaku-{chart-version}.tgz` file to your internal repository.

### Operator Documentation

The operator documentation is located in the **documentation/** folder. It contains deployment guides and an overview of the components deployed as part of the Yaku Helm chart. It also contains [known issues](./known_issues.md) that you might face with Yaku deployment.

User documentation is available online [here](https://docs.bswf.tech/).

### ChangeLog

With each new release of the Yaku Helm chart, a ChangeLog file is included that contains the list of all changes introduced in the release. The file name is **{yaku-version}-release-notes.md**.

### Yaku-CLI

The yaku-cli is a command-line tool that can be used to interact with the Yaku core API. More information about the yaku-cli can be found in our user docs [here](https://docs.bswf.tech/cli/index.html#).

## Config Schema

**qg-config-schema.json** is the JSON schema that defines the structure of the **qg-config.yaml** file.



## What Should I Do Next?

Now that you have an overview of the contents of the Helm chart archive, consider looking at [the get-started doc](./get-started.md) and proceed with deploying the Helm chart on your Kubernetes cluster.
