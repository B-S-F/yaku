<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Using custom apps

To add {term}`custom apps <custom app>` to your {{ PNAME }} configuration, you need to perform
two steps:

1. First, you need to define an app {term}`repository` in which the app is stored.
2. Then, you must add the app to your autopilot definition.

If you want to see a working custom app example using Github, please jump to [the example config below](#custom-app-example-using-github).

## Defining a repository

1. Open the {file}`qg-config.yaml` file of your {{ PNAME }} configuration in the [Web UI](https://portal.bswf.tech/) or in your favorite text editor.
2. Add a new section called `repositories`.

    ```{code-block} yaml
    :emphasize-lines: 6

    metadata:
      version: v1
    header:
      name: My first QG config
      version: 1.0
    repositories:
      - name: <repository-name>
        type: <repository-type>
        configuration:
          <repository-configuration>
    ```

3. Configure the {term}`repository` with one of the [available repository types](./repository-types).
In the example below, a repository URL is given. This URL contains placeholders for `name` and `version`.
How those placeholders are filled is described in the next paragraph.

    ```{code-block} yaml
    :emphasize-lines: 7-10

    metadata:
      version: v1
    header:
      name: My first QG config
      version: 1.0
    repositories:
      - name: my-repository
        type: curl
        configuration:
          url:  https://example.com/folder-with-apps/{name}/{version}
    ```

## Adding the app to the autopilot definition

After you have defined the {term}`repository` for the {term}`custom app`, you can now reference your custom app in your autopilot.
Find your autopilot definition in your config file (introduced by the `autopilots:` section) and follow the next steps.

1. Add a new section called `apps` to the autopilot configuration and list the custom app you want to use.

    ```{code-block} yaml
    :emphasize-lines: 4

    autopilots:
      app-version-usage:
        apps:
          - <app-name>@<version>
    ```

    ```{Note}
    If you have multiple repositories configured, you can explicitly mention
    the repository from which you want to download the app. Simply replace
    `<app-name>[@<version>]` by `<repository-name>::<app-name>[@<version>]`.

    If the repository name is not provided, all repositories will be searched for the app.
    If the app is available in multiple repositories you must provide the repository name.
    ```

1. Use the {term}`custom app` in the `run` section of the autopilot configuration.

    ```{code-block} yaml

    autopilots:
      app-name-usage:
        apps:
          - <app-name>@<version>
        run: |
          <app-name> --help
    ```

    ```{hint}
    If you have specified two different versions of the same app inside the
    `apps:` section, you can call the different versions of the app by
    appending `...@<version>` to the `<app-name>` call in the `run:` section.
    ```

1. Save the changes to the `qg-config.yaml` file and run the {{ PNAME }} configuration

## Custom app example using GitHub

You can find a sample workflow config file below. It downloads a specific
version of [jq](https://github.com/jqlang/jq/). Simply copy and paste this file
into a new configuration and press the Play button to execute the configuration.

```{note}
The workflow will fail with an error status because the autopilot does not
return a complete check result.  That's ok, you can ignore this. Simply take a
look at the log output of the autopilot to see the command line output of the
`jq --version` command.
```

There are two versions listed in the `apps:` section: version 1.6 and version
1.7.1.  One of them is commented out; if you want, you can simply uncomment it
and comment out the other version to see how the command line output changes.

```{code-block} yaml
---
caption: Example config for downloading and using a custom app
---

metadata:
  version: v1
header:
  name: My first QG config
  version: 1.0.0
repositories:
  - name: github-jq-downloads
    type: curl
    configuration:
      url: https://github.com/jqlang/{name}/releases/download/{name}-{version}/{name}-linux64
autopilots:
  my-custom-jq:
    apps:
      #- github-jq-downloads::jq@1.7.1
      - github-jq-downloads::jq@1.6
    run: |
      jq --version
chapters:
  '1':
    title: Test custom apps
    requirements:
      '1':
        title: Verify that specific version of jq can be downloaded and used
        text: Long description
        checks:
          '1':
            title: 'Description of the check'
            automation:
              autopilot: my-custom-jq
```

## Dealing with errors in the configuration

The configuration of repositories and custom apps is read after you start a new
{{ PNAME }} run. If there is an error in your configuration, e.g., if an app is
not available or if a repo URL is incorrect, you will only get feedback after
the run was completed. Check the log output of your run for error messages.
