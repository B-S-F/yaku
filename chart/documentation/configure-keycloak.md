## Configuring Keycloak

### Overview

Below is an overview of the Keycloak core concepts that Yaku uses.

#### Realms

A Keycloak realm manages a set of users, credentials, roles, and groups. A user belongs to and logs into a realm. Realms are isolated from one another and can only manage and authenticate the users that they control. You will need to configure a realm for each Yaku instance you host.

---
**IMPORTANt**

Based on your used Keycloak instance, please follow one of the option below.

---

- **If you deployed Keycloak Pod by following the documentation we provided:**

  In Keycloak deployment before, you have deployed a config map that contains a realm called *yaku* that we have pre-configured. This realm is auto created when Keycloak server is started.


- **If you are using some managed instance of Keycloak hosted by your company**

  You will need to do the following steps:

  1. Login with a user that have admin access to your realm `kcadm.sh config credentials --server <keycloak server> --realm <realm name> --user admin `

  2. Run `./tools/setup-realm.sh` 

  3. Go to `Client scopes`, change `global` Assigned type to `optional` and `namespace_1`  Assigned type to `Default`

  4. Go tou your realm --> realm settings. Click on action on top right corner and choose partial import.

     Browse for `yaku-realm.json` file that exists in [tools folder](./tools)

     Under (Choose the resources you want to import:), check: Clients, Realm roles and client roles.

     Under (If a resource already exists, specify what should be done:) check: skip 

You will then need to perform some manual steps to customize it and get the configuration working with your Yaku instance.

#### Clients

Clients in Keycloak are applications/services that can request Keycloak to authenticate a user.
The pre-configured realm imported from [yaku-realm-configmap.yaml file](./tools/yaku-realm-configmap.yaml) contains all required Yaku clients and roles. Each namespace you create in your Yaku instance, needs to have a client created in Keycloak in order to manage users and roles for that namespace. The pre-configured yaku realm contains `NAMESPACAE_1` client which is the client for namespace with id 1. Afterwards, you will need to create a new client for each namespace you create in Yaku with the name `NAMESPCAE_<namespace id>`. In [Create New clients](#create-new-namespace-clients) section, we will provide you with the steps to create a new client in Keycloak.

#### Users & Roles

A users in Keycloak is any entity that can login into your system. Yaku access is based on two users groups:
- **Admin users**

  Admins have permissions to create and modify namespaces in a Yaku instance. 
- **Namespace users**

  Normal users that have access to one or multiple namespaces and can run Yaku assessments


After configuring your identity provider in Keycloak, users will be able to login and use Yaku service with their enterprise accounts. They can then be assigned to the specific roles of they need (Admin/Namespace).

### Configure Identity Provider

Keycloak acts as an Identity Broker to connect Yaku services with identity providers. It uses the provider’s identities to access Yaku services.
Keycloak bases identity providers on SAML v2.0, OpenID Connect v1.0 and OAuth v2.0 protocols. You can configure Keycloak to use any of these protocols to connect with your identity provider. 

To add an identity provider, click on the `Identity Providers` tab in the left side menu and select the identity provider type you want to add. Keycloak displays the configuration page for the identity provider you selected.

We provide below two configuration examples for OpenID Connect and SAML.

#### OpenID Connect


This identity provider uses an Azure Entra ID OpenID Connect app registration created and configured in an Azure subscription. 

1. Fill up the configuration page of the OpenID connect identity provider with the following values. You can find the `clientId` and `clientSecret` in your App registration details.

`tokenUrl`, `jwksUrl`, `issuer`, `authorizationUrl` and `logoutUrl` should be set based on your OpenID Connect provider.

```json
    {
      "alias": "azure-ad-oidc",
      "displayName": "azure-ad-oidc",
      "providerId": "oidc",
      "enabled": true,
      "updateProfileFirstLoginMode": "on",
      "trustEmail": false,
      "storeToken": false,
      "addReadTokenRoleOnCreate": false,
      "authenticateByDefault": false,
      "linkOnly": false,
      "firstBrokerLoginFlowAlias": "first broker login",
      "config": {
        "hideOnLoginPage": "false",
        "userInfoUrl": "https://graph.microsoft.com/oidc/userinfo",
        "validateSignature": "true",
        "acceptsPromptNoneForwardFromClient": "false",
        "clientId": "xxxx",
        "tokenUrl": "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/oauth2/v2.0/token",
        "uiLocales": "false",
        "jwksUrl": "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/discovery/v2.0/keys",
        "backchannelSupported": "false",
        "issuer": "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/v2.0",
        "useJwksUrl": "true",
        "loginHint": "false",
        "pkceEnabled": "false",
        "authorizationUrl": "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/oauth2/v2.0/authorize",
        "clientAuthMethod": "client_secret_post",
        "disableUserInfo": "false",
        "logoutUrl": "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/oauth2/v2.0/logout",
        "syncMode": "IMPORT",
        "clientSecret": "**********",
        "passMaxAge": "false",
        "allowedClockSkew": "0",
        "defaultScope": "openid email profile User.Read GroupMember.Read.All"
      }
    }
```

2. Add the following URL to the `Redirect URIs` in the App registration details in your Azure subscription.

    `https://<Keycloak server>/auth/realms/<realm name>/broker/<identity provider name you added above>/endpoint`

You can find more information about configuring OpenID Connect identity provider in Keycloak [here](https://www.keycloak.org/docs/latest/server_admin/#_identity_broker_oidc).

#### SAML

This identity provider uses an Azure Entra ID SAML app registration created and configured in an Azure subscription. 

1. Fill up the configuration page of the OpenID connect identity provider with the following values. You can find the `clientId` and `clientSecret` in your App registration details.

`idpEntityId`and `singleSignOnServiceUrl` should be updated base on your SAML provider details.

```json
    {
      "alias": "saml-idp",
      "displayName": "saml-idp",
      "providerId": "saml",
      "enabled": true,
      "updateProfileFirstLoginMode": "on",
      "trustEmail": false,
      "storeToken": false,
      "addReadTokenRoleOnCreate": false,
      "authenticateByDefault": false,
      "linkOnly": false,
      "firstBrokerLoginFlowAlias": "first broker login",
      "config": {
        "hideOnLoginPage": "false",
        "validateSignature": "false",
        "postBindingLogout": "false",
        "nameIDPolicyFormat": "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
        "postBindingResponse": "true",
        "backchannelSupported": "false",
        "signSpMetadata": "false",
        "wantAssertionsEncrypted": "false",
        "idpEntityId": "https://sts.windows.net/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/",
        "loginHint": "false",
        "allowCreate": "true",
        "wantAssertionsSigned": "false",
        "authnContextComparisonType": "exact",
        "postBindingAuthnRequest": "true",
        "syncMode": "IMPORT",
        "forceAuthn": "false",
        "singleSignOnServiceUrl": "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/saml2",
        "wantAuthnRequestsSigned": "false",
        "principalType": "Subject NameID"
      }
    }
```

2. Add the following URL to the `Redirect URIs` in the App registration details in your Azure subscription.

    `https://<Keycloak server>/auth/realms/<realm name>/broker/<identity provider name you added above>/endpoint`

You can find more information about configuring SAML identity provider in Keycloak [here](https://www.keycloak.org/docs/latest/server_admin/#saml-v2-0-identity-providers).

### Configure Clients

#### yaku-core

- Configure client secret

  `yaku-core` is our api service that makes requests to Keycloak to validate the tokens presented to it. This client has a secret, which needs to be known to both the application (Yaku core api in this case) and the Keycloak server. This is why you need to provide this client secret as a configuration variable for yaku api.

  Go to yaku-core client --> Credentials and regenerate the client secret. You can then use the new generated value to create a Kubernetes secret and reference it in `keycloak_client_secret_name` and `keycloak_client_secret_key` configuration values in Yaku helm chart values.


#### yaku-core-swagger

- Configure client redirect Uris

  In yaku-core-swagger settings you will need to add your yaku core-api service swagger UI as `Valid redirect URIs`. Example: `https://yaku.bosch.com/oauth2-redirect.html`.

#### yaku-portal

- Configure client redirect Uris

  In yaku-portal settings you will need to add yaku ui url as a `Valid redirect URIs` Example: `https://yaku-portal.bosch.com//oauth2-redirect.html`


### Assign Admin Role

Only users with Admin role can create and modify namespaces in Yaku api. To assign Yaku admin role to a user, go to the username in Keycloak and assign `ADMIN` role from client `GLOBAL`. This means the user will have admin access to your Yaku instance.

### Create New Namespace Clients

When creating a new namespace in Yaku api, you need to create a Keycloak client for that namespace in order to manage access to the namespace. We have created a script to create and configure the namespace client.

#### Install Keycloak Admin CLI kcadm.sh

To be able to run client creation script, you need to have Keycloak Admin CLI command line tool `kcadm.sh` installed in your PATH. You can download the cli from https://www.keycloak.org/downloads, Server section. You can find [here](https://www.keycloak.org/docs/latest/server_admin/#admin-cli) more info regarding `kcadm.sh` usage.

#### Login to Keycloak

To be able to create new clients, you need to login to Keycloak as a user who has realm management permissions. You can use the following command to login to Keycloak as `admin` user.

```bash
kcadm.sh config credentials --server https://<Keycloak server address> --realm master --user admin
```
You'll be prompted to enter the password for the `admin` user.


**NOTE:** You can either use the Keycloak admin user and password you configured in your Keycloak deployment to login into `master` realm or create a user in the realm you created (`<realm name>`) that has realm management permissions and then login to this realm as admin user with the following command:

```bash
kcadm.sh config credentials --server https://<Keycloak server address> --realm `<realm name>` --user `<user you created in new realm>`
```

#### Run Client Creation Script

To create the Keycloak client, you can run [create_namespace_client.sh script](tools/create_namespace_client.sh). You will need to provide the Keycloak realm name (the realm that you have imported) and Yaku namespace id as args.


- Usage: create_namespace_client.sh `<realm name>` `<namepsace id>`
- Example: create_namespace_client.sh yaku 2


#### Assign Roles to Users

To be able to access a namespace, the user should have the `NAMESPACE_<namespace_id> ACCESS` role. You can assign this role to a user in Keycloak.

The user needs to login once to the yaku swagger ui via the identity provider you have set up, in order for the username to be created under users in Keycloak. To login, when you click on `Authorize` button, you'll see two options `bearer  (http, Bearer)` and `oauth2 (OAuth2, authorizationCode with PKCE)`. Click on `Authorize` under the `oauth2 (OAuth2, authorizationCode with PKCE)` option. You do not need to enter any client_secret for the already specified yaku-core-swagger client_id.

After logged in successfully in swagger ui, you can go to the username in Keycloak and assign `NAMESPACE_<namespace_id>  ACCESS` role. This means the user have access to namespace with id `namespace_id` in your yaku api instance.
