# Getting Started with Defender for Cloud Autopilot - Alerts

## Introduction

Defender for Cloud Autopilot is a tool that allows you to retrieve data (alerts or recommendations) from Microsoft Defender for Cloud, along with their metadata.

```{note}
This tutorial provides an introduction to the Defender for Cloud Autopilot and demonstrates how to configure it to fetch `alerts`. If you are interested in the fetch of `recommendations`, please check this [tutorial](defender-for-cloud-tutorial-recommendations.md).
```

It has the ability to filter alerts based on certain aspects, such as the alert type, the compromised entity's name, or even just by searching certain keywords in the alert's name and description.

To understand this guide, it is essential to have completed the following steps:

* Obtain "Cloud application administrator" permissions to an Azure subscription
* Complete {doc}`../../../onboarding`

### Use-cases

For this example, we are using the following use cases:

* Retrieve the security alerts for an Azure subscription, along with their metadata, based on the filters given as input

## Preparation

### Obtain the Tenant ID

* Sign in to the Azure portal
* Search for "Microsoft Entra ID" and click on the corresponding icon
* In the middle of the screen there is a section called "Basic information". Below it, there is a field called "Tenant ID". You can copy its value by using the copy button near it.

### Obtain the Subscription ID

* Sign in to the Azure portal
* Search for "Subscriptions" and click on the corresponding icon
* In the middle of the screen there is a list with all the active subscriptions. Next to each subscription's name there is the subscription id. You can use your mouse to select it and then press CTRL + C to copy it. Alternatively, you can click on the subscription's name and the use the copy button that appears next to the subscription id when you hover over it.

### Obtain the Client ID and the Client Secret

In order to connect to Microsoft Defender for Cloud through our autopilot, we need to register an Azure app and authorize it, or to authorize an Azure app that already exists.

To register a new Azure app:

* Sign in to the Microsoft Entra admin center as at least a Cloud Application Administrator
* In the left panel, click on Identity -> Applications -> App registrations
* Click on "+ New registration" button in the middle of the screen
* Add an app name
* You can leave the default values for the rest
* Click "Register"

The steps above will create a new app and open the corresponding panel. If you want to use an existing app, navigate to that app's panel in the Azure portal.

To obtain the Client ID:

* In the Azure app's panel mentioned above, click on "Overview" if you are not already there. (The "Overview" button is in the left sidebar)
* In the middle of the screen you shall see a field called "Application (client) ID". Copy its value using the copy button next to it

To obtain the Client Secret:

* Click on "Certificates & secrets" (The "Certificates & secrets" button is in the left sidebar)
* Click on the "New client secret" button
* Add a secret name, select an expiration time, then click "Add"
* Copy the value of the Client Secret using the copy button next to it

To authorize the Azure app:

* Click on "API permissions" (The "API permissions" button is in the left sidebar)
* Click on "+ Add a permission"
* Select the permissions required by your organization.

**IMPORTANT:** If you are a Bosch employee, most likely the permission required is: "Microsoft Graph -> Application.ReadWrite.OwnedBy". Contact your Azure administrator if you get "Error: Status 403" while running the autopilot and if you are not sure what permissions to add.

### Download resources

Please download the following file first:

* {download}`qg-config.yaml <resources/qg-config-alerts.yaml>`

Upload the files to the {{ PNAME }} service. If you are unsure how to perform those steps, take a look at the {doc}`../../../quickstart`.

The following steps for editing the configuration files are done directly in the web interface and the integrated editor.

## Adjust the config files

You should have uploaded the files already to the {{ PNAME }} web interface.

Now open the editor of the config, which you have created for this tutorial.

### Use Defender for Cloud Autopilot in qg-config.yaml

1. Open the {file}`qg-config.yaml` file and take a look at the sections.
    The interesting lines are the definition of the `defender-for-cloud` autopilot:

    ```{literalinclude} resources/qg-config-alerts.yaml
    ---
    language: yaml
    lines: 7-18
    lineno-match:
    ---
    ```

2. Now you need to adapt the environment variables defined for this autopilot script:

    * Line 11: The variable {envvar}`TENANT_ID` must contain the id of the tenant from where the alerts will be extracted.
    * Line 12: The variable {envvar}`SUBSCRIPTION_ID` must contain the id of the subscription from where the alerts will be extracted.
    * Line 13: The variable {envvar}`CLIENT_ID` must contain the id of the app used to authenticate to Microsoft Defender for Cloud.
    * Line 14: The variable {envvar}`CLIENT_SECRET` must contain the secret of the app used to authenticate to Microsoft Defender for Cloud.
    * Line 15: The variable {envvar}`DATA_TYPE` must be set to "alerts" because we want to fetch alert from Microsoft Defender for Cloud.
    * Line 16: The variable {envvar}`ALERT_TYPE_FILTER` is an optional filter. When provided, the autopilot will return only the alerts whose type match at least one of the values provided as input
    * Line 17: The variable {envvar}`KEY_WORDS_FILTER` is an optional filter. When provided, the autopilot will return only the alerts whose name or description match at least one of the values provided as input.
    * Line 18: The variable {envvar}`RESOURCE_NAME_FILTER` is an optional filter. When provided, the autopilot will return only the alerts which correspond to at least one of the resource names given as input.

**IMPORTANT:** To learn how to use and take full advantage of the versatile filters mentioned above, please see the [Filter Documentation](../reference/defender-for-cloud-reference.md#filter-documentation) section of the Autopilot Background Information.

## Run the example

You can now save the file and start a new run of this configuration.
Please see the [Example Output](../reference/defender-for-cloud-reference.md#example-output) section of the Autopilot Background Information for the possible results of the runner.
