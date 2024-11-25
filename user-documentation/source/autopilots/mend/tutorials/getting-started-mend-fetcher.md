<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Getting Started with Mend Autopilot

## Introduction

The Mend autopilot will fetch reports from the Mend's Software Composition Analysis(SCA) scans to answer your requirements checks.

Currently supported are alerts and vulnerabilities reports. The results will be saved to the evidence folder.

## Preparation

First of all you need access to the Mend's [Portal][MEND_PORTAL_EU]. Some values are considered sensitive and should be stored as [Secrets](../../../core/secrets/index.md).

### Option 1: Standard Privileged User

[Skip this if you're admin](#option-2-you-are-admin-on-mend)

1. On the Mend's Portal hover over your name in the top-right corner and select {guilabel}`Profile`. In the {guilabel}`Identity` section you will find the email associated with your Mend access right next to {guilabel}`Email`. Save this value for later use.

2. On the same Profile page go to the {guilabel}`User Keys` section. If no user keys are available click on {guilabel}`Generate User Key` button. Save this value as a secret(e.g.`MEND_USER_KEY`).

3. On the Mend's Portal go to {guilabel}`Integrate` tab, in the {guilabel}`Organization` section, and save the {guilabel}`API Key` value as a secret(e.g.`MEND_ORG_TOKEN`).

4. On the Mend's Portal go to Integrate tab, click {guilabel}`expand` in the {guilabel}`Project Tokens` sections and search your project token. Save this value as a secret(e.g. `MEND_PROJECT_TOKEN`).

5. On the Mend's Portal go to Integrate tab, in the Organization section, and save the {guilabel}`Server URL` value.

6. On the Mend's Portal go to Integrate tab, in the Organization section, and save the {guilabel}`API Base URL(v2.0)` value.

```{note}
In case you don't see the {guilabel}`Integrate` tab, you can still fetch all the reports you have access to on the Mend's Portal, but you have to obtain those values in another way.
```

### Option 2: You are admin on Mend

[Skip this if you're not admin](#check-report-for-vulnerabilities)

1. On the Mend's Portal go to {guilabel}`Admin` on the top-right corner, in the {guilabel}`System` section select {guilabel}`Users`. If there is already a service user created, save the value from the {guilabel}`Email` column.
2. Copy the User's token in your clipboard by clicking {guilabel}`copy token` and save it as a secret(e.g. `MEND_USER_KEY`).

```{hint}
In case there is no service user created, select the {guilabel}`Create Service User` button, add a name and the email will be auto-generated. Make sure the newly created user is in the Product's integrators list by going to the {guilabel}`Products` tab, select the product name of which the project is part of, on the top-right corner select the {guilabel}`Settings` icon, click on {guilabel}`expand` next to the {guilabel}`Product Integrators` section and add it to {guilabel}`Individuals` by clicking on the {guilabel}`Change` button right next to it.
Use previously mentioned steps for obtaining required values.
```

3. On the Mend's Portal go to {guilabel}`Integrate` tab, in the {guilabel}`Organization` section, and save the {guilabel}`API Key` value as a secret(e.g.`MEND_ORG_TOKEN`).

4. On the Mend's Portal go to Integrate tab, click {guilabel}`expand` in the {guilabel}`Project Tokens` sections and search your project token. Save this value as a secret(e.g. `MEND_PROJECT_TOKEN`).

5. On the Mend's Portal go to Integrate tab, in the Organization section, and save the {guilabel}`Server URL` value.

6. On the Mend's Portal go to Integrate tab, in the Organization section, and save the {guilabel}`API Base URL(v2.0)` value.

```{note}
Assigning roles to individuals is not recommended, consider using only groups for simpler and easier user and role management. Please see Mend's [Administrator Guide](https://docs.mend.io/bundle/sca_user_guide/page/administrator_guide.html)
```

## Check Report for Vulnerabilities

To fetch the project's vulnerabilities report create a [configuration file](../../../core/configuration/index.md) and set following environment variables:

### Adjust the environment variables

1. Set {envvar}`MEND_USER_EMAIL` to the email obtained in the [Preparation](#preparation) section
2. Set {envvar}`MEND_USER_KEY` to the saved secret, e.g. `${{ secrets.MEND_USER_KEY }}`
3. Set {envvar}`MEND_API_URL` to the {guilabel}`API Base URL(v2.0)` value obtained in the [Preparation](#preparation) section
4. Set {envvar}`MEND_SERVER_URL` to the {guilabel}`Server URL` value obtained in the [Preparation](#preparation) section
5. Set {envvar}`MEND_ORG_TOKEN` to the saved secret, e.g. `${{ secrets.MEND_ORG_TOKEN}}`
6. Set {envvar}`MEND_PROJECT_TOKEN` to the saved secret, e.g. `${{ secrets.MEND_PROJECT_TOKEN }}`

And optionally,

7. Set {envvar}`MEND_PROJECT_ID` to the project ID from the Mend's Portal. To obtain it, go to {guilabel}`Projects` tab, select your project and in the address bar of your browser e.g.`https://app-eu.whitesourcesoftware.com/Wss/WSS.html#!project;id=<project-ID>;orgToken=<org-uuid>` get the value of `<project-ID>`.

```{note}
To configure a multiple project setup, please refer to the section on [Fetching Multiple Projects](../reference/mend-fetcher-reference.md#fetching-multiple-projects).
```

### Adjust the qg-config.yaml

Below is an example configuration file that runs the Mend autopilot. Values which are usually not expected to change across the configuration file are configured as global environment variables in lines 7-10. In lines 13-15 the autopilot is defined and in lines 31-34 the autopilot is run for a specific project.

```{literalinclude} resources/qg-config-vulns.yaml
---
language: yaml
linenos:
emphasize-lines: 7-10, 13-15, 30-34
```

## Check Report for Active Alerts

To fetch the project's alerts report create a [configuration file](../../../core/configuration/index.md) and set following environment variables:

### Adjust the environment variables - Alerts

1. Set {envvar}`MEND_USER_EMAIL` to the email obtained in the [Preparation](#preparation) section
2. Set {envvar}`MEND_USER_KEY` to the saved secret, e.g. `${{ secrets.MEND_USER_KEY }}`
3. Set {envvar}`MEND_API_URL` to the {guilabel}`API Base URL(v2.0)` value obtained in the [Preparation](#preparation) section
4. Set {envvar}`MEND_SERVER_URL` to the {guilabel}`Server URL` value obtained in the [Preparation](#preparation) section
5. Set {envvar}`MEND_ORG_TOKEN` to the saved secret, e.g. `${{ secrets.MEND_ORG_TOKEN}}`
6. Set {envvar}`MEND_PROJECT_TOKEN` to the saved secret, e.g. `${{ secrets.MEND_PROJECT_TOKEN }}`
7. Set {envvar}`MEND_REPORT_TYPE` to `alerts`

And optionally,

8. Set {envvar}`MEND_PRODUCT_ID` to the product ID from the Mend's Portal. To obtain it, go to {guilabel}`Projects` tab, select your project and in the address bar of your browser e.g.`https://app-eu.whitesourcesoftware.com/Wss/WSS.html#!project;id=<project-ID>;orgToken=<org-uuid>` and get the value of `<project-ID>`.

```{note}
To configure a multiple project setup, please refer to the section on [Fetching Multiple Projects](../reference/mend-fetcher-reference.md#fetching-multiple-projects).
```

### Adjust the qg-config.yaml - Alerts

Below is an example configuration file that runs the Mend autopilot. Values which are usually not expected to change across the configuration file are configured as global environment variables in lines 7-10. In lines 13-17 the autopilot is defined and configured to fetch the alerts report. In lines 33-37 the autopilot is run for a specific project.

```{literalinclude} resources/qg-config-alerts.yaml
---
language: yaml
linenos:
emphasize-lines: 7-10, 13-17, 32-36
```

[MEND_PORTAL_EU]: https://app-eu.whitesourcesoftware.com/Wss/WSS.html
