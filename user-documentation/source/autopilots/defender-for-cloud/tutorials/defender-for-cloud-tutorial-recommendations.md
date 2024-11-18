# Getting Started with Defender for Cloud Autopilot - Recommendations

## Introduction

Defender for Cloud Autopilot is a tool that allows you to retrieve data (alerts or recommendations) from Microsoft Defender for Cloud, along with their metadata.

```{note}
This tutorial provides an introduction to the Defender for Cloud Autopilot and demonstrates how to configure it to fetch `recommendations`. If you are interested in the fetch of `alerts`, please check this [tutorial](defender-for-cloud-tutorial-alerts.md).
```

It has the ability to filter recommendations based on certain aspects, such as the severity, the category, the threats, the user impact, the implementation effort or by searching certain keywords in the recommendation's name and description.

To understand this guide, it is essential to have completed the following steps:

* Obtain "Cloud application administrator" permissions to an Azure subscription
* Complete {doc}`../../../onboarding`

### Use-cases

For this example, we are using the following use cases:

* Retrieve the security recommendations for an Azure subscription, along with their metadata, based on the security level filter given as input

## Preparation

### Obtain the Tenant ID, Subscription ID, Client ID and the Client Secret

To acquire these environment variables, kindly refer to the preparation sections outlined in the [alerts tutorial](defender-for-cloud-tutorial-alerts.md#preparation), as the procedure remains identical.

### Download resources

Please download the following file first:

* {download}`qg-config.yaml <resources/qg-config-recommendations.yaml>`

Upload the files to the {{ PNAME }} service. If you are unsure how to perform those steps, take a look at the {doc}`../../../quickstart`.

The following steps for editing the configuration files are done directly in the web interface and the integrated editor.

## Adjust the config files

You should have uploaded the files already to the {{ PNAME }} web interface.

Now open the editor of the config, which you have created for this tutorial.

### Use Defender for Cloud Autopilot in qg-config.yaml

1. Open the {file}`qg-config.yaml` file and take a look at the sections.
    The interesting lines are the definition of the `defender-for-cloud` autopilot:

    ```{literalinclude} resources/qg-config-recommendations.yaml
    ---
    language: yaml
    lines: 7-21
    lineno-match:
    ---
    ```

2. Now you need to adapt the environment variables defined for this autopilot script:

    * Line 11: The variable {envvar}`TENANT_ID` must contain the id of the tenant from where the recommendations will be extracted.
    * Line 12: The variable {envvar}`SUBSCRIPTION_ID` must contain the id of the subscription from where the recommendations will be extracted.
    * Line 13: The variable {envvar}`CLIENT_ID` must contain the id of the app used to authenticate to Microsoft Defender for Cloud.
    * Line 14: The variable {envvar}`CLIENT_SECRET` must contain the secret of the app used to authenticate to Microsoft Defender for Cloud.
    * Line 15: The variable {envvar}`DATA_TYPE` must be set to "recommendations" because we want to fetch recommendations from Microsoft Defender for Cloud.
    * Line 16: The variable {envvar}`SEVERITY_FILTER` is an optional filter. When provided, the autopilot will return only the recommendations whose type match at least one of the values provided as input, in our case only the `High` level.

**IMPORTANT:** To learn how to use and take full advantage of all the versatile filters, please see the [Filter Documentation](../reference/defender-for-cloud-reference.md#filter-documentation) section of the Autopilot Background Information.

## Run the example

You can now save the file and start a new run of this configuration.
Please see the [Example Output](../reference/defender-for-cloud-reference.md#example-output) section of the Autopilot Background Information for the possible results of the runner.
