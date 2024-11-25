<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# How to configure an Azure App Registration required for authentication

## Introduction

This guide shows you how you can use an app registration to access OAuth-protected sites for cloud SharePoint instances. You need this as a prerequisite in order to authenticate to your cloud SharePoint sites and later be able to fetch data from them.

## Prerequisites

You need to have an Azure account and subscription. If you don't have them, feel free to create them following the official [Azure documentation](https://learn.microsoft.com/en-us/dynamics-nav/how-to--sign-up-for-a-microsoft-azure-subscription).

## Register an app application in Azure Active Directory

In order to register a client application in Azure Active Directory, please follow the [documentation](https://learn.microsoft.com/en-us/azure/healthcare-apis/register-application). In the article, you will find out how you can configure the application and how to set API permissions.

```{attention}
When creating the app, make sure you only choose the single-tenant option and add 2 or more owners. These criteria are mandatory for the application.
```

Make sure you create a client-secret as well and save the secret value because it is only available at the creation and you will need it later.

## Getting important fields

After you have your app registration, you need the values from the following fields: `Application (client) ID` and `Directory (tenant) ID`. You can get those from the overview page of your application.

```{figure} resources/registration-app/client-tenant-id.png
:alt: Screenshot of Client and Tenant IDs, opened in the browser.
:class: image-stroke

Screenshot of Client and Tenant IDs, opened in the browser.
```

You also need the value for the `client-secret` created in the previous part.

## Adjusting the qg-config.yaml

You need to map the values for the fields extracted earlier to the fields we have in the config for the SharePoint fetcher.

```yaml
SHAREPOINT_FETCHER_TENANT_ID: "your value for the tenant ID"
SHAREPOINT_FETCHER_CLIENT_ID: "your value for the client ID"
SHAREPOINT_FETCHER_CLIENT_SECRET: "your value for the client secret"
```

## Setting API permissions

You need to set permissions for the application to be able to access your SharePoint sites. To do that, following this [tutorial](https://learn.microsoft.com/en-us/azure/healthcare-apis/register-application#api-permissions), select `Site.Selected` permission as shown in the screenshot down below.

```{figure} resources/registration-app/request-api-permissions.png
:alt: Screenshot setting API permissions for the application
:class: image-stroke

Screenshot setting API permissions for the application
```

```{note}
Unfortunately, the permissions won't activate immediately therefore you need to create an ACM request to activate them. For the Bosch specific instances at `bosch.sharepoint.com`, the needed request can be found [here](https://rb-tracker.bosch.com/tracker17/servicedesk/customer/portal/853). The request may take some time until it is approved and closed so make sure you are patient with it.
```

Complete all the fields needed in the request with the information for your own application. Mention in the request you need permissions for `Site.Selected` and also specify the SharePoint sites you want to be able to fetch data from. The cloud SharePoint sites have the following syntax for Bosch instances: `https://bosch.sharepoint.com/sites/your-site-name`.

```{figure} resources/registration-app/request-permissions-ticket.png
:alt: Screenshot of AMC ticket needed for setting API permissions
:class: image-stroke

Screenshot of AMC ticket needed for setting API permissions
```

```{note}
If you are not the owner of the SharePoint sites, the owner will need to send a signed e-mail to the person that will appear in the ticket as an approver to validate the request.

```

You also need to specify a redirect URI for your application. Therefore, under the *Authentication* tab, for the *Web Redirect URIs* you need to add `https://bosch.sharepoint.com/auth/callback` as a URI.

For more information, make sure you check the [official Bosch process](https://inside-docupedia.bosch.com/confluence/pages/viewpage.action?pageId=2387425668#id-4APIConsentDecline-configurationmissing) for API permissions.
