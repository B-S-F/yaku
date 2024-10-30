import { AppOutput } from '@B-S-F/autopilot-utils'

import { getDefenderForCloudAlerts } from './alertsRetriever.js'
import {
  getDefenderForCloudRecommendations,
  getDefenderForCloudRecommendationsMetadata,
} from './recommendationsRetriever.js'
import { generateAzureAccessToken } from './auth.js'

import { exportJson } from './utils.js'

export enum Filter {
  AlertType,
  KeyWords,
  ResourceName,
  Severity,
  Categories,
  Threats,
  UserImpact,
  ImplementationEffort,
}

export async function getSecurityAlertsOnASubscription() {
  const token = await generateAzureAccessToken(
    process.env.TENANT_ID!,
    process.env.CLIENT_ID!,
    'client_credentials',
    process.env.CLIENT_SECRET!
  )
  const alerts = await getDefenderForCloudAlerts(
    token,
    process.env.SUBSCRIPTION_ID!
  )
  return alerts
}

export async function getRecommendationsOnASubscription() {
  const token = await generateAzureAccessToken(
    process.env.TENANT_ID!,
    process.env.CLIENT_ID!,
    'client_credentials',
    process.env.CLIENT_SECRET!
  )
  const recommendations = await getDefenderForCloudRecommendations(
    token,
    process.env.SUBSCRIPTION_ID!
  )
  return recommendations
}

export async function getRecommendationsMetadataOnASubscription() {
  const token = await generateAzureAccessToken(
    process.env.TENANT_ID!,
    process.env.CLIENT_ID!,
    'client_credentials',
    process.env.CLIENT_SECRET!
  )
  const recommendationsMetadata =
    await getDefenderForCloudRecommendationsMetadata(token)
  return recommendationsMetadata
}

export const prefixMatchAlerts = (
  alert: any,
  filterValues: string[],
  filterType: Filter
) => {
  if (filterType === Filter.AlertType) {
    for (const filterValue of filterValues) {
      if (alert.properties.alertType.startsWith(filterValue)) {
        return true
      }
    }
  }

  if (filterType === Filter.KeyWords) {
    for (const filterValue of filterValues) {
      if (
        alert.properties.alertDisplayName.search(filterValue) !== -1 ||
        alert.properties.description.search(filterValue) !== -1
      ) {
        return true
      }
    }
  }

  if (filterType === Filter.ResourceName) {
    for (const filterValue of filterValues) {
      if (alert.properties.compromisedEntity.search(filterValue) !== -1) {
        return true
      }
    }
  }

  return false
}

export const parseFilterValues = (inputFilter: string | null | undefined) => {
  if (inputFilter == null || inputFilter.length <= 0) {
    return null
  }
  return inputFilter.split(', ').map((entry) => {
    return entry.trim()
  })
}

export const prefixMatchRecommendations = (
  recommendation: any,
  filterValues: string[],
  filterType: Filter
) => {
  if (filterType === Filter.Severity) {
    for (const filterValue of filterValues) {
      if (recommendation.properties.severity == filterValue) {
        return true
      }
    }
  }

  if (filterType === Filter.Categories) {
    for (const filterValue of filterValues) {
      if (recommendation.properties.categories.includes(filterValue)) {
        return true
      }
    }
  }

  if (filterType === Filter.Threats) {
    for (const filterValue of filterValues) {
      if (recommendation.properties.threats.includes(filterValue)) {
        return true
      }
    }
  }

  if (filterType === Filter.KeyWords) {
    for (const filterValue of filterValues) {
      if (
        recommendation.properties.displayName.search(filterValue) !== -1 ||
        recommendation.properties.description.search(filterValue) !== -1
      ) {
        return true
      }
    }
  }

  if (filterType === Filter.UserImpact) {
    for (const filterValue of filterValues) {
      if (recommendation.properties.userImpact == filterValue) {
        return true
      }
    }
  }

  if (filterType === Filter.ImplementationEffort) {
    for (const filterValue of filterValues) {
      if (recommendation.properties.implementationEffort == filterValue) {
        return true
      }
    }
  }

  return false
}

export const validateRequiredEnvVariables = () => {
  const defenderForCloudReportType = process.env.DATA_TYPE || 'alerts'
  if (
    defenderForCloudReportType !== 'alerts' &&
    defenderForCloudReportType !== 'recommendations'
  ) {
    throw new Error(
      `Invalid value for DATA_TYPE environment variable! DATA_TYPE should be either 'alerts' or 'recommendations' and in this case is '${defenderForCloudReportType}'`
    )
  }
  if (process.env.TENANT_ID == undefined || process.env.TENANT_ID == '') {
    throw new Error(
      'Please provide TENANT_ID in the environmental variables before running the autopilot'
    )
  }
  if (process.env.CLIENT_ID == undefined || process.env.CLIENT_ID == '') {
    throw new Error(
      'Please provide CLIENT_ID in the environmental variables before running the autopilot'
    )
  }
  if (
    process.env.CLIENT_SECRET == undefined ||
    process.env.CLIENT_SECRET == ''
  ) {
    throw new Error(
      'Please provide CLIENT_SECRET in the environmental variables before running the autopilot'
    )
  }
  if (
    process.env.SUBSCRIPTION_ID == undefined ||
    process.env.SUBSCRIPTION_ID == ''
  ) {
    throw new Error(
      'Please provide SUBSCRIPTION_ID in the environmental variables before running the autopilot'
    )
  }
  return defenderForCloudReportType
}

export function getUnhealthyRecommendations(
  recommendations: any[]
) {
  const unhealthyRecommendations: any[] = []
  for (const recommendation of recommendations) {
    if (recommendation.properties.status?.code === 'Unhealthy') {
      unhealthyRecommendations.push(recommendation)
    }
  }
  return unhealthyRecommendations
}

export function combineRecommendationAndMetadata(
  recommendations: any[],
  metadata: any[]
) {
  const metadataMap = new Map<string, any[]>()
  for (const meta of metadata) {
    metadataMap.set(meta.name, meta)
  }

  const combinedRecommendations: any[] = []
  for (const recommendation of recommendations) {
    const meta: any = metadataMap.get(recommendation.name)
    if (meta) {
      recommendation.properties.policyDefinitionId =
        meta.properties?.policyDefinitionId
      recommendation.properties.assessmentType = meta.properties?.assessmentType
      recommendation.properties.description = meta.properties?.description
      recommendation.properties.remediationDescription =
        meta.properties?.remediationDescription
      recommendation.properties.categories = meta.properties?.categories || []
      recommendation.properties.severity = meta.properties?.severity || ''
      recommendation.properties.userImpact = meta.properties?.userImpact || ''
      recommendation.properties.implementationEffort =
        meta.properties?.implementationEffort || ''
      recommendation.properties.threats = meta.properties?.threats || []
    }
    combinedRecommendations.push(recommendation)
  }
  return combinedRecommendations
}

export const run = async () => {
  const output = new AppOutput()

  try {
    const dataType = validateRequiredEnvVariables()
    if (dataType === 'alerts') {
      const alertTypeFilter = parseFilterValues(process.env.ALERT_TYPE_FILTER)
      const keyWordsFilter = parseFilterValues(process.env.KEY_WORDS_FILTER)
      const resourceNameFilter = parseFilterValues(
        process.env.RESOURCE_NAME_FILTER
      )
      const alerts = await getSecurityAlertsOnASubscription()

      let mandatoryNumberOfFilterMatches = 0
      if (alertTypeFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }
      if (keyWordsFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }
      if (resourceNameFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }

      const matchedAlerts = []
      for (const alert of alerts) {
        let numberOfFilterMatchesForCurrentAlert = 0
        if (
          alertTypeFilter &&
          prefixMatchAlerts(alert, alertTypeFilter, Filter.AlertType)
        ) {
          numberOfFilterMatchesForCurrentAlert =
            numberOfFilterMatchesForCurrentAlert + 1
        }
        if (
          keyWordsFilter &&
          prefixMatchAlerts(alert, keyWordsFilter, Filter.KeyWords)
        ) {
          numberOfFilterMatchesForCurrentAlert =
            numberOfFilterMatchesForCurrentAlert + 1
        }
        if (
          resourceNameFilter &&
          prefixMatchAlerts(alert, resourceNameFilter, Filter.ResourceName)
        ) {
          numberOfFilterMatchesForCurrentAlert =
            numberOfFilterMatchesForCurrentAlert + 1
        }
        if (
          numberOfFilterMatchesForCurrentAlert ===
          mandatoryNumberOfFilterMatches
        ) {
          matchedAlerts.push(alert)
        }
      }

      if (matchedAlerts.length > 0) {
        output.setStatus('RED')
        output.setReason(
          `Retrieved ${matchedAlerts.length} alerts based on given filters`
        )

        for (const alert of matchedAlerts) {
          output.addResult({
            criterion: 'Open Security Alert Defender for Cloud',
            justification: `Found security alert with id: ${alert.id} and display name: ${alert.properties.alertDisplayName}`,
            fulfilled: false,
            metadata: {
              compromisedEntity: alert.properties?.compromisedEntity,
              alertType: alert.properties?.alertType,
              alertDisplayName: alert.properties?.alertDisplayName,
              description: alert.properties?.description,
              severity: alert.properties?.severity,
              timeGeneratedUtc: alert.properties?.timeGeneratedUtc,
              productComponentName: alert.properties?.productComponentName,
              remediationSteps: alert.properties?.remediationSteps,
              alertUri: alert.properties?.alertUri,
            },
          })
        }
      } else {
        output.setStatus('GREEN')
        output.setReason(`No alerts found based on given filters`)
        output.addResult({
          criterion: `There are no alerts found based on given filters for Defender for Cloud`,
          justification: `No alerts found based on given filters`,
          fulfilled: true,
          metadata: {},
        })
      }
    } else if (dataType === 'recommendations') {
      const severityFilter = parseFilterValues(process.env.SEVERITY_FILTER)
      const keyWordsFilter = parseFilterValues(process.env.KEY_WORDS_FILTER)
      const categoriesFilter = parseFilterValues(process.env.CATEGORIES_FILTER)
      const threatsFilter = parseFilterValues(process.env.THREATS_FILTER)
      const userImpactFilter = parseFilterValues(process.env.USER_IMPACT_FILTER)
      const implementatioEffortFilter = parseFilterValues(
        process.env.IMPLEMENTATION_EFFORT_FILTER
      )

      const recommendations = await getRecommendationsOnASubscription()
      const unhealthyRecommendations = getUnhealthyRecommendations(recommendations)
      const recommendationsMetadata =
        await getRecommendationsMetadataOnASubscription()
      const recommendationsAndMetadata = combineRecommendationAndMetadata(
        unhealthyRecommendations,
        recommendationsMetadata
      )

      let mandatoryNumberOfFilterMatches = 0

      if (severityFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }
      if (keyWordsFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }
      if (categoriesFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }
      if (threatsFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }
      if (userImpactFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }
      if (implementatioEffortFilter) {
        mandatoryNumberOfFilterMatches = mandatoryNumberOfFilterMatches + 1
      }
      const matchedRecommendations = []
      for (const recommendation of recommendationsAndMetadata) {
        let numberOfFilterMatchesForCurrentRecommendation = 0
        if (
          severityFilter &&
          prefixMatchRecommendations(
            recommendation,
            severityFilter,
            Filter.Severity
          )
        ) {
          numberOfFilterMatchesForCurrentRecommendation =
            numberOfFilterMatchesForCurrentRecommendation + 1
        }
        if (
          keyWordsFilter &&
          prefixMatchRecommendations(
            recommendation,
            keyWordsFilter,
            Filter.KeyWords
          )
        ) {
          numberOfFilterMatchesForCurrentRecommendation =
            numberOfFilterMatchesForCurrentRecommendation + 1
        }
        if (
          categoriesFilter &&
          prefixMatchRecommendations(
            recommendation,
            categoriesFilter,
            Filter.Categories
          )
        ) {
          numberOfFilterMatchesForCurrentRecommendation =
            numberOfFilterMatchesForCurrentRecommendation + 1
        }
        if (
          threatsFilter &&
          prefixMatchRecommendations(
            recommendation,
            threatsFilter,
            Filter.Threats
          )
        ) {
          numberOfFilterMatchesForCurrentRecommendation =
            numberOfFilterMatchesForCurrentRecommendation + 1
        }
        if (
          userImpactFilter &&
          prefixMatchRecommendations(
            recommendation,
            userImpactFilter,
            Filter.UserImpact
          )
        ) {
          numberOfFilterMatchesForCurrentRecommendation =
            numberOfFilterMatchesForCurrentRecommendation + 1
        }
        if (
          implementatioEffortFilter &&
          prefixMatchRecommendations(
            recommendation,
            implementatioEffortFilter,
            Filter.ImplementationEffort
          )
        ) {
          numberOfFilterMatchesForCurrentRecommendation =
            numberOfFilterMatchesForCurrentRecommendation + 1
        }
        if (
          numberOfFilterMatchesForCurrentRecommendation ===
          mandatoryNumberOfFilterMatches
        ) {
          matchedRecommendations.push(recommendation)
        }
      }

      if (matchedRecommendations.length > 0) {
        output.setStatus('RED')
        output.setReason(
          `Retrieved ${matchedRecommendations.length} security recommendations based on given filters`
        )

        for (const recommendation of matchedRecommendations) {
          output.addResult({
            criterion: 'Open Security Recommendation Defender for Cloud',
            justification: `Found security recommendation with id: ${recommendation.id} and display name: ${recommendation.properties.displayName}`,
            fulfilled: false,
            metadata: {
              status: recommendation.properties?.status?.code,
              additionalData: recommendation.properties?.additionalData,
              resourceDetails: recommendation.properties?.resourceDetails,
              policyDefinitionId: recommendation.properties?.policyDefinitionId,
              assessmentType: recommendation.properties?.assessmentType,
              description: recommendation.properties?.description,
              remediationDescription:
                recommendation.properties?.remediationDescription,
              categories: recommendation.properties?.categories,
              severity: recommendation.properties?.severity,
              userImpact: recommendation.properties?.userImpact,
              implementationEffort: recommendation.properties?.implementationEffort,
              threats: recommendation.properties?.threats,
            },
          })
        }
      } else {
        output.setStatus('GREEN')
        output.setReason(
          `No security recommendations found based on given filters`
        )
        output.addResult({
          criterion: `There are no security recommendations found based on given filters for Defender for Cloud`,
          justification: `No security recommendations found based on given filters`,
          fulfilled: true,
          metadata: {},
        })
      }
    }
  } catch (error: any) {
    output.setStatus('FAILED')
    output.setReason(error.message)
  } finally {
    exportJson(output.data.results, './results.json')
    output.write()
  }
}
