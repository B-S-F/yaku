<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

# Autopilot Background Information

An autopilot which returns the security data from Microsoft Defender for Cloud, along with their metadata. Currently supported are alerts and security (unhealthy) recommendations.

```{note}
You cannot fetch both alerts and recommendations at the same time therefore you need to decide using an environment variable what you want to fetch.
```

It has the ability to filter these alerts/recommendations based on certain aspects. For the alerts, we can filter based on the alert type, the compromised entity's name, or even just by searching certain keywords in the alert's name and description. For the recommendations, we have filters for the severity, the categories, the threats, the user impact, the implementation effort or by searching certain keywords in the recommendation's name and description.

## Prerequisites

To use the Defender for Cloud autopilot, you need to provide the value for the following parameters: ```TENANT_ID```, ```SUBSCRIPTION_ID```, ```CLIENT_ID``` and ```CLIENT_SECRET```. Please check the [tutorial](../tutorials/defender-for-cloud-tutorial-alerts.md#preparation) for a step by step guide regarding how to obtain these values.

## Environment variables

```{envvar} TENANT_ID
The id of the tenant from where the data will be extracted.
```

```{envvar} SUBSCRIPTION_ID
The id of the subscription from where the data will be extracted.
```

```{envvar} CLIENT_ID
The id of the app used to authenticate to Microsoft Defender for Cloud.
```

```{envvar} CLIENT_SECRET
The secret of the app used to authenticate to Microsoft Defender for Cloud.
```

```{envvar} DATA_TYPE
The type of data to be fetched. Supported values are `alerts` and `recommendations`. If not set, the autopilot will fetch the `alerts`
by default.
```

```{envvar} KEY_WORDS_FILTER
Optional filter. This filter can be used for both alerts or recommendations. When provided, the autopilot will return only the data whose name or description match at least one of the values provided as input.
```

### Filtering environment variables for alerts

```{envvar} ALERT_TYPE_FILTER
Optional filter. When provided, the autopilot will return only the alerts whose type match at least one of the values provided as input
```

```{envvar} RESOURCE_NAME_FILTER
Optional filter. When provided, the autopilot will return only the alerts which correspond to at least one of the resource names given as input.
```

### Filtering environment variables for recommendations

```{envvar} SEVERITY_FILTER
Optional filter. When provided, the autopilot will return only the recommendations whose severity matches at least one of the values provided as input.
```

```{envvar} CATEGORIES_FILTER
Optional filter. The autopilot will exclusively fetch recommendations that align with at least one of the specified categories.
```

```{envvar} THREATS_FILTER
Optional filter. When provided, the autopilot will return only the recommendations whose threats matches at least one of the values provided as input.
```

```{envvar} USER_IMPACT_FILTER
Optional filter. When input is provided, the autopilot filters recommendations to match the user impact indicated.
```

```{envvar} IMPLEMENTATION_EFFORT_FILTER
Optional filter. When provided, the autopilot will return only the recommendations whose implementation effort matches at least one of the values provided as input.
```

## Filter Documentation

The Defender for Cloud autopilot has a highly versatile filter. It can select alerts/recommendations based on a variety of filter options. Each option is described in the lines below:

### Common Filters

#### Keywords Filter

```{note}
This filter option works for both alerts and recommendations in the same way. For the sake of streamlining out documentation and avoiding duplication of explanations, we will provide the overview of this option for the alert type only.
```

The purpose of this filter is to return only the alerts that contain certain key words in the alert display name or in the alert description. For example, *K8S_ExposedPostgresTrustAuth* has:
*Alert Display Name: "Exposed Postgres service with trust authentication configuration in Kubernetes detected (Preview)"*
*Alert Description: "Kubernetes cluster configuration analysis detected exposure of a Postgres service by a load balancer. The service is configured with trust authentication method, which doesn't require credentials."*

To match this type of alert, you can use ```KEY_WORDS_FILTER: "load balancer"```, since *"load balancer"* are the last two words of the first sentence of *Alert Description*. You can also match this type of alerts by using ```KEY_WORDS_FILTER: "Preview"```, because the word *"Preview"* is found in the *Alert Display Name*.

Similar to the *ALERT_TYPE_FILTER*, you can use multiple values separated by a comma. For example, you can set ```KEY_WORDS_FILTER: "configuration, Kubernetes"``` to search for the words *"configuration"* and *"Kubernetes"*. You can also search for phrases, for example ```KEY_WORDS_FILTER: "cluster configuration analysis, authentication configuration in Kubernetes"``` will search for *"cluster configuration analysis"* and *"authentication configuration in Kubernetes"*.

Unlike the *ALERT_TYPE_FILTER*, the matching of Alert Display Name and Alert Description is done anywhere in the text (it does not need to match starting from the beginning, it can also match in the middle of the text or at the end).

### Alert Filters

#### Alert Type Filter

Each alert type follows a naming convention. If you want to search for alerts that correspond to:

- ```Virtual Machines```: set ```ALERT_TYPE_FILTER``` to ```"VM_"```
- ```DNS```: set ```ALERT_TYPE_FILTER``` to ```"AzureDNS_"```
- ```App Service```: set ```ALERT_TYPE_FILTER``` to ```"AppServices_"```
- ```Kubernetes Clusters```: set ```ALERT_TYPE_FILTER``` to ```"K8S_, K8S.NODE_"```
- ```SQL and Synapse```: set ```ALERT_TYPE_FILTER``` to ```"SQL., Synapse.SQLPool_"```
- ```Resource Mananger```: set ```ALERT_TYPE_FILTER``` to ```"ARM_"```
- ```Storage```: set ```ALERT_TYPE_FILTER``` to ```"Storage."```
- ```Cosmos DB```: set ```ALERT_TYPE_FILTER``` to ```"CosmosDB_"```
- ```Network Layer```: set ```ALERT_TYPE_FILTER``` to ```"Network_, Generic_, SQL_, DDOS, RDP_, SSH_, PortScanning"```
- ```Key Vault```: set ```ALERT_TYPE_FILTER``` to ```"KV_"```
- ```DDoS```: set ```ALERT_TYPE_FILTER``` to ```"NETWORK_DDOS_"```
- ```Defender for APIs```: set ```ALERT_TYPE_FILTER``` to ```"API_"```

You can also combine the values mentioned above into one extended filter. To do this, simply copy the values for each alert type you are interested in and separate them by a comma. For example, if you would like to get all alerts corresponding to *"Virtual_Machines"*, *"Kubernetes Clusters"* and *"App Service"*, set *ALERT_TYPE_FILTER* to ```"VM_, K8S_, K8S.NODE_, AppServices_"```.

But the alert type filter can be even more specific! For example, instead of retrieving all alerts that correspond to *Kubernetes Clusters*, you may wish to retrieve only a specific type of *Kubernetes Clusters* alert. To do so, simply set the filter to the target value. For example, you can set:
```ALERT_TYPE_FILTER: "K8S_ExposedPostgresTrustAuth"``` or ```ALERT_TYPE_FILTER: "K8S.NODE_NamespaceCreation"``` or ```ALERT_TYPE_FILTER: "K8S_ExposedPostgresTrustAuth, K8S.NODE_NamespaceCreation"```.

For a list of all alert types, please see [this documentation](https://learn.microsoft.com/en-us/azure/defender-for-cloud/alerts-reference).

You don't even have to match the entire name! The filter only have to match the beginning of the alert type name in order to return the alerts. For example ```ALERT_TYPE_FILTER: "K8S_ExposedPostgres"``` will return all the alerts that ```ALERT_TYPE_FILTER: "K8S_ExposedPostgresTrustAuth"``` would have returned (and potentially more alerts if there are other active alerts whose types start with *"K8S_ExposedPostgres"*).
The more text you provide, the more specific the filter becomes.

#### Resource Name Filter

For example, by setting ```RESOURCE_NAME_FILTER: "my-custom-resource-name"```, you will retrieve all alerts that are associated with the resource called *"my-custom-resource-name"*.

You can include multiple resources by separating them by a comma. ```RESOURCE_NAME_FILTER: "my-custom-resource-name-1, my-custom-resource-name-2"``` will return all the alerts corresponding to the resources called *"my-custom-resource-name-1"* and *"my-custom-resource-name-2"*.

Similar to the *KEY_WORDS_FILTER* and unlike the *ALERT_TYPE_FILTER*, the matching of the resource name is done anywhere in the text (it does not need to match starting from the beginning, it can also match in the middle of the text or at the end)

**Note: If you want to retrieve all alerts, run the autopilot without providing any filter.**

### Recommendation Filters

#### Severity Filter

For example, by setting ```SEVERITY_FILTER: "High"```, you will retrieve all recommendations that are associated with a *"High"* severity.

You can include multiple values by separating them by a comma. By setting ```SEVERITY_FILTER: "High, Critical"```, the autopilot will return all the recommendations corresponding to the severities *"High"* and *"Critical"*.

The supported values for this filter are `Low`, `Medium`, `High` and `Critical`.

#### Categories Filter

For example, if you specify ```CATEGORIES_FILTER: "Compute"```, you will retrieve only the recommendations that are associated with *"Compute"* category.

You can include multiple categories by separating them by a comma similar to ```SEVERITY_FILTER```.

Supported values for this filter include `Compute`, `Data`, `IdentityAndAccess`, `IoT` and `Networking`.

#### Threats Filter

For example, by setting ```THREATS_FILTER: "denialOfService"```, you will retrieve all recommendations that are associated with *"denialOfService"* threat.

You have the option to include multiple values by using commas for separation, just like with the ```SEVERITY_FILTER```.

The filter supports values such as `accountBreach`, `dataExfiltration`, `dataSpillage`, `denialOfService`, `elevationOfPrivilege`,
`maliciousInsider`, `missingCoverage` and `threatResistance`.

#### User Impact Filter

For instance, when you designate the ```USER_IMPACT_FILTER: "Moderate"```, you will retrieve all recommendations that are associated with *"Moderate"* user impact.

You can include multiple user impact levels by separating them by a comma similar to ```SEVERITY_FILTER```.

The supported values for this filter are `Low`, `Moderate` and `High`.

#### Implementation Effort Filter

By setting ```IMPLEMENTATION_EFFORT_FILTER: "Low"```, you will retrieve all recommendations that are associated with a *"low"* implementation effort.

You can include multiple values by separating them by a comma similar to ```SEVERITY_FILTER```.

Supported values for this filter include `Low`, `Moderate` and `High`.

```{note}
You can include multiple options separated by a comma to any recommendation filter similar to how it is presented in the `SEVERITY_FILTER` section.
```

**Note: If you want to retrieve all recommendations, run the autopilot without providing any filter.**

## Example Output

The output of the autopilot consists of three parts:

1) The status: ```GREEN```, ```RED``` or ```FAILED```

2) The reason:

For alerts:

- "No alerts found based on given filters" (for status GREEN)
- "Retrieved X alerts based on given filters" (for RED)
- An error message (for FAILED)

For recommendations:

- "No recommendations found based on given filters" (for status GREEN)
- "Retrieved X recommendations based on given filters" (for RED)
- An error message (for FAILED)

3) In case status is ```RED```, the autopilot will output the list of alerts/recommendations that match the given filters along with the following metadata:

- for alerts:  `alertDisplayName`, `alertType`, `alertUri`, `compromisedEntity`, `description`, `productComponentName`, `remediationSteps`, `severity`, `timeGeneratedUtc`

- for recommendations:  `status`, `additionalData`, `resourceDetails`, `policyDefinitionId`, `assessmentType`, `description`, `remediationDescription`, `categories`, `severity`, `userImpact`, `implementationEffort`, `threats`

An example output for alerts would be:

```json
{
   "status":"RED",
   "reason":"Retrieved 1 alert based on given filters"
}
```

```json
{
   "result":{
      "criterion":"Open Security Alert Defender for Cloud",
      "justification":"Detected suspicious file download",
      "fulfilled":false,
      "metadata":{
         "compromisedEntity":"demo-resource-for-docs",
         "alertType":"K8S.NODE_SuspectDownloadArtifacts",
         "alertDisplayName":"Detected suspicious file download",
         "description":"Analysis of processes running within a container or directly on a Kubernetes node, has detected a suspicious download of a remote file.",
         "severity":"Low",
         "timeGeneratedUtc":"2023-10-02T11:10:23.2999447Z",
         "productComponentName":"Containers",
         "remediationSteps":[
            "Review and confirm that the command identified in the alert was legitimate activity that you expect to see on this host or device. If not, escalate the alert to the information security team."
         ],
         "alertUri":"https://portal.azure.com/#blade/Microsoft_Azure_Security_AzureDefenderForData/AlertBlade/alertId/..."
      }
   }
}
```

An example output for recommendations would be:

```json
{
   "status":"RED",
   "reason":"Retrieved 1 recommendation based on given filters"
}
```

```json
{
   "result":{
      "criterion":"Open Security Recommendation Defender for Cloud",
      "justification":"Found security recommendation with id: 1 and display name: recommendation-test",
      "fulfilled":false,
      "metadata":{
         "status":"Unhealthy",
         "additionalData":{
            "subAssessmentsLink":"/subscriptions/123/resourceGroups/test/providers/Microsoft.ContainerRegistry/Microsoft.Security/assessments/123/subAssessments",
            "maxCvss30Score":"3.7",
         },
         "resourceDetails":{
            "Source":"Azure",
            "Id":"/subscriptions/123/resourceGroups/test/providers/Microsoft.ContainerRegistry/registries/test"
         },
         "policyDefinitionId":"/providers/Microsoft.Authorization/policyDefinitions/123",
         "assessmentType":"BuiltIn",
         "description":"Container image vulnerability assessment scans your registry for commonly known vulnerabilities",
         "remediationDescription":"To resolve container image vulnerabilities: Navigate to the relevant resource under the 'Unhealthy' section and select the container image you are looking to remediate. Review the set of known vulnerabilities found by the scan by their severity.",
         "categories":["Compute"],
         "severity":"High",
         "userImpact":"High",
         "implementationEffort":"Low",
         "threats":["MaliciousInsider","DataSpillage"],
      }
   }
}
```

## Example config - Alerts

Below is an example configuration file that runs the Defender for Cloud autopilot and fetches alerts. The autopilot is configured in lines: 7-18. Required variables and secrets are read from provided run variables or secrets. Be advised that the `DATA_TYPE` variable from line 15 is set to "alerts". Then the autopilot is used by the check 1 in line 30 which is part of requirement 1.15.

Please note that `<<your_tenant_id>>`, `<<your_subscription_id>>`, `<<your_client_id>>`, `<<<<optional_alert_type_filter>>>>`, `<<optional_key_words_filter>>`, `<<optional_resource_name_filter>>` have to be replaced with their corresponding values.

```{literalinclude} resources/qg-config-alerts.yaml
---
language: yaml
linenos:
emphasize-lines: 7-18, 30
---
```

## Example config - Recommendations

Below you can see an example configuration file that runs the Defender for Cloud autopilot and fetches security (unhealthy) recommendations. The autopilot is configured in lines: 7-21. Required variables and secrets are read from provided run variables or secrets. Note that the `DATA_TYPE` variable from line 15 is set to "recommendations". Then the autopilot is used by the check 1 in line 34 which is part of requirement 1.15

Please note that `<<your_tenant_id>>`, `<<your_subscription_id>>`, `<<your_client_id>>`, `<<<<optional_severity_filter>>>>`, `<<optional_key_words_filter>>`, `<<optional_category_filter>>`, `<<optional_threats_filter>>`, `<<optional_user_impact_filter>>`, `<<optional_implementation_effort_filter_filter>>` have to be replaced with their corresponding values.

```{literalinclude} resources/qg-config-recommendations.yaml
---
language: yaml
linenos:
emphasize-lines: 7-21, 34
---
```
